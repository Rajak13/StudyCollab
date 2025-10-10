import { getCurrentUser } from '@/lib/auth'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Create a server-side Supabase client with proper auth context for API routes
function createApiClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        const cookieHeader = request.headers.get('cookie')
        if (!cookieHeader) return undefined

        const cookies = cookieHeader.split(';').reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          },
          {} as Record<string, string>
        )

        return cookies[name]
      },
      set() {
        // No-op for API routes
      },
      remove() {
        // No-op for API routes
      },
    },
  })
}

const createStudyGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  subject: z.string().max(100, 'Subject too long').optional(),
  university: z.string().max(255, 'University name too long').optional(),
  is_private: z.boolean().default(false),
})

const studyGroupFiltersSchema = z.object({
  subject: z.string().optional(),
  university: z.string().optional(),
  is_private: z.boolean().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'member_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = studyGroupFiltersSchema.parse({
      subject: searchParams.get('subject') || undefined,
      university: searchParams.get('university') || undefined,
      is_private: searchParams.get('is_private') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    })

    const supabase = createApiClient(request)

    // First, let's try a simple query to see if the table exists
    let query = supabase.from('study_groups').select('*')

    // Apply filters
    if (filters.subject) {
      query = query.ilike('subject', `%${filters.subject}%`)
    }

    if (filters.university) {
      query = query.ilike('university', `%${filters.university}%`)
    }

    if (filters.is_private !== undefined) {
      query = query.eq('is_private', filters.is_private)
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Apply sorting
    if (filters.sort_by === 'member_count') {
      // For member count, we'll need to handle this differently
      query = query.order('created_at', {
        ascending: filters.sort_order === 'asc',
      })
    } else {
      query = query.order(filters.sort_by, {
        ascending: filters.sort_order === 'asc',
      })
    }

    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    const { data: groups, error, count } = await query

    if (error) {
      console.error('Error fetching study groups:', error)
      return NextResponse.json(
        { error: 'Failed to fetch study groups' },
        { status: 500 }
      )
    }

    // Get user memberships for all groups
    const groupIds = groups?.map((g) => g.id) || []
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)
      .in('group_id', groupIds)

    // Create a map of group memberships
    const membershipMap = new Map(
      memberships?.map((m) => [m.group_id, m.role]) || []
    )

    // Get member counts for all groups
    const { data: memberCounts } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds)

    const memberCountMap = new Map()
    memberCounts?.forEach((m) => {
      const count = memberCountMap.get(m.group_id) || 0
      memberCountMap.set(m.group_id, count + 1)
    })

    // Transform groups with proper membership info
    const transformedGroups =
      groups?.map((group) => ({
        ...group,
        member_count: memberCountMap.get(group.id) || 0,
        is_member: membershipMap.has(group.id),
        user_role: membershipMap.get(group.id) || null,
      })) || []

    return NextResponse.json({
      data: transformedGroups,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    })
  } catch (error) {
    console.error('Error in study groups GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStudyGroupSchema.parse(body)

    const serviceSupabase = createServiceSupabaseClient()

    // Create the group using service client to bypass RLS
    const { data: group, error } = await serviceSupabase
      .from('study_groups')
      .insert([
        {
          ...validatedData,
          owner_id: user.id,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating study group:', error)
      return NextResponse.json(
        { error: 'Failed to create study group' },
        { status: 500 }
      )
    }

    console.log('Group created successfully:', {
      groupId: group.id,
      groupName: group.name,
      ownerId: group.owner_id,
      userId: user.id
    })

    // Add the owner as a member of the group using service client
    const { error: membershipError } = await serviceSupabase
      .from('group_members')
      .insert([
        {
          group_id: group.id,
          user_id: user.id,
          role: 'OWNER',
          joined_at: new Date().toISOString(),
        },
      ])

    if (membershipError) {
      if (membershipError.code === '23505') {
        // Duplicate key error - owner is already in the group_members table
        console.log('Owner already exists in group members (duplicate key):', {
          groupId: group.id,
          userId: user.id,
          error: membershipError.message
        })
      } else {
        console.error('Error adding owner to group members:', membershipError)
        // Don't fail the entire request, but log the error
        // The owner can still access the group through ownership
      }
    } else {
      console.log('Owner added to group members successfully:', {
        groupId: group.id,
        userId: user.id,
        role: 'OWNER'
      })
    }

    // Transform the response
    const transformedGroup = {
      ...group,
      member_count: 1, // Owner is automatically a member
      is_member: true,
      user_role: 'OWNER',
    }

    return NextResponse.json({ data: transformedGroup }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in study groups POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
