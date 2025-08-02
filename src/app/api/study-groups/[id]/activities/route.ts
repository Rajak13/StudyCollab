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

const activitiesQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  activity_type: z.string().optional(),
  user_id: z.string().uuid().optional(),
  since: z.string().datetime().optional(), // ISO datetime string
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
    const query = activitiesQuerySchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      activity_type: searchParams.get('activity_type') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      since: searchParams.get('since') || undefined,
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

    // Build activities query
    let activitiesQuery = supabase
      .from('group_activities')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (query.activity_type) {
      activitiesQuery = activitiesQuery.eq('activity_type', query.activity_type)
    }

    if (query.user_id) {
      activitiesQuery = activitiesQuery.eq('user_id', query.user_id)
    }

    if (query.since) {
      activitiesQuery = activitiesQuery.gte('created_at', query.since)
    }

    // Apply pagination
    const from = (query.page - 1) * query.limit
    const to = from + query.limit - 1
    activitiesQuery = activitiesQuery.range(from, to)

    const { data: activities, error, count } = await activitiesQuery

    if (error) {
      console.error('Error fetching group activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch group activities' },
        { status: 500 }
      )
    }

    // Get unique user IDs from activities
    const userIds = [...new Set(activities?.map((a) => a.user_id) || [])]

    // Fetch user data separately
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds)

    // Create user lookup map
    const userMap = new Map(users?.map((u) => [u.id, u]) || [])

    // Transform activities with user data
    const transformedActivities =
      activities?.map((activity) => ({
        ...activity,
        user: userMap.get(activity.user_id) || {
          id: activity.user_id,
          name: 'Unknown User',
        },
      })) || []

    return NextResponse.json({
      data: transformedActivities,
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

    console.error('Error in group activities GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
