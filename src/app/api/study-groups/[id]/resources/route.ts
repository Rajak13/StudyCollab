import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Create a server-side Supabase client
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
      set() {},
      remove() {},
    },
  })
}

const createResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  file_url: z.string().url('Invalid file URL'),
  file_name: z.string().min(1, 'File name is required'),
  file_size: z.number().positive('File size must be positive'),
  file_type: z.string().min(1, 'File type is required'),
  tags: z.array(z.string()).max(10, 'Too many tags').default([]),
})

const resourcesQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z
    .enum(['created_at', 'title', 'download_count'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  file_type: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const query = resourcesQuerySchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
      search: searchParams.get('search') || undefined,
      file_type: searchParams.get('file_type') || undefined,
    })

    const supabase = createApiClient(request)

    // Check if user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      )
    }

    // Build resources query
    let resourcesQuery = supabase
      .from('group_shared_resources')
      .select('*')
      .eq('group_id', groupId)

    // Apply search filter
    if (query.search) {
      resourcesQuery = resourcesQuery.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      )
    }

    // Apply file type filter
    if (query.file_type) {
      resourcesQuery = resourcesQuery.eq('file_type', query.file_type)
    }

    // Apply sorting
    resourcesQuery = resourcesQuery.order(query.sort_by, {
      ascending: query.sort_order === 'asc',
    })

    // Apply pagination
    const from = (query.page - 1) * query.limit
    const to = from + query.limit - 1
    resourcesQuery = resourcesQuery.range(from, to)

    const { data: resources, error, count } = await resourcesQuery

    if (error) {
      console.error('Error fetching shared resources:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shared resources' },
        { status: 500 }
      )
    }

    // Get unique user IDs from resources
    const userIds = [...new Set(resources?.map((r) => r.user_id) || [])]

    // Fetch user data separately
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds)

    // Create user lookup map
    const userMap = new Map(users?.map((u) => [u.id, u]) || [])

    // Transform resources with user data
    const transformedResources =
      resources?.map((resource) => ({
        ...resource,
        user: userMap.get(resource.user_id) || {
          id: resource.user_id,
          name: 'Unknown User',
        },
      })) || []

    return NextResponse.json({
      data: transformedResources,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in shared resources GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const validatedData = createResourceSchema.parse(body)

    const supabase = createApiClient(request)

    // Check if user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      )
    }

    // Create the shared resource
    const { data: resource, error } = await supabase
      .from('group_shared_resources')
      .insert([
        {
          ...validatedData,
          group_id: groupId,
          user_id: user.id,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating shared resource:', error)
      return NextResponse.json(
        { error: 'Failed to create shared resource' },
        { status: 500 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single()

    // Transform the resource
    const transformedResource = {
      ...resource,
      user: userData || { id: user.id, name: 'Unknown User' },
    }

    return NextResponse.json({ data: transformedResource }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in shared resources POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
