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

const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(2000, 'Message too long'),
  message_type: z.enum(['TEXT', 'FILE', 'SYSTEM']).default('TEXT'),
  file_url: z.string().url().optional(),
  file_name: z.string().optional(),
  file_size: z.number().positive().optional(),
  reply_to_id: z.string().uuid().optional(),
})

const messagesQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  before: z.string().optional(), // For cursor-based pagination
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
    const query = messagesQuerySchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      before: searchParams.get('before') || undefined,
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

    // Build messages query - simplified to avoid complex joins
    let messagesQuery = supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    // Apply cursor-based pagination if before parameter is provided
    if (query.before) {
      messagesQuery = messagesQuery.lt('created_at', query.before)
    }

    // Apply limit
    messagesQuery = messagesQuery.limit(query.limit)

    const { data: messages, error } = await messagesQuery

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Get unique user IDs from messages
    const userIds = [...new Set(messages?.map((m) => m.user_id) || [])]

    // Fetch user data separately
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds)

    // Create user lookup map
    const userMap = new Map(users?.map((u) => [u.id, u]) || [])

    // Get reply message IDs
    const replyIds =
      messages?.filter((m) => m.reply_to_id).map((m) => m.reply_to_id) || []

    // Fetch reply messages if any exist
    let replyMessages: Array<{ id: string; content: string; user_id: string }> =
      []
    if (replyIds.length > 0) {
      const { data: replies } = await supabase
        .from('group_messages')
        .select('id, content, user_id')
        .in('id', replyIds)

      replyMessages = replies || []
    }

    // Create reply lookup map
    const replyMap = new Map(replyMessages.map((r) => [r.id, r]))

    // Transform messages with user and reply data
    const transformedMessages =
      messages?.map((message) => ({
        ...message,
        user: userMap.get(message.user_id) || {
          id: message.user_id,
          name: 'Unknown User',
        },
        reply_to: message.reply_to_id
          ? {
              ...replyMap.get(message.reply_to_id),
              user: userMap.get(replyMap.get(message.reply_to_id)?.user_id) || {
                id: 'unknown',
                name: 'Unknown User',
              },
            }
          : null,
      })) || []

    // Reverse to show oldest first
    const reversedMessages = transformedMessages.reverse()

    return NextResponse.json({
      data: reversedMessages,
      pagination: {
        limit: query.limit,
        hasMore: messages?.length === query.limit,
        nextCursor: messages?.length ? messages[0]?.created_at : null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in messages GET:', error)
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
    const validatedData = createMessageSchema.parse(body)

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

    // Validate reply_to_id if provided
    if (validatedData.reply_to_id) {
      const { data: replyMessage } = await supabase
        .from('group_messages')
        .select('id')
        .eq('id', validatedData.reply_to_id)
        .eq('group_id', groupId)
        .single()

      if (!replyMessage) {
        return NextResponse.json(
          { error: 'Reply message not found' },
          { status: 400 }
        )
      }
    }

    // Create the message
    const { data: message, error } = await supabase
      .from('group_messages')
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
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single()

    // Get reply data if exists
    let replyData = null
    if (message.reply_to_id) {
      const { data: reply } = await supabase
        .from('group_messages')
        .select('id, content, user_id')
        .eq('id', message.reply_to_id)
        .single()

      if (reply) {
        const { data: replyUser } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('id', reply.user_id)
          .single()

        replyData = {
          ...reply,
          user: replyUser || { id: reply.user_id, name: 'Unknown User' },
        }
      }
    }

    // Transform the message
    const transformedMessage = {
      ...message,
      user: userData || { id: user.id, name: 'Unknown User' },
      reply_to: replyData,
    }

    return NextResponse.json({ data: transformedMessage }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in messages POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
