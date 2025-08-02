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

const joinGroupSchema = z.object({
  group_id: z.string().uuid(),
  message: z.string().optional(),
})

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
    const validatedData = joinGroupSchema.parse(body)

    const supabase = createApiClient(request)

    // Check if group exists
    const { data: group } = await supabase
      .from('study_groups')
      .select('id, name, is_private, owner_id')
      .eq('id', groupId)
      .single()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this group' },
        { status: 400 }
      )
    }

    if (group.is_private) {
      // For private groups, create a join request
      const { data: existingRequest } = await supabase
        .from('group_join_requests')
        .select('id, status')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (existingRequest) {
        if (existingRequest.status === 'PENDING') {
          return NextResponse.json(
            { error: 'Join request already pending' },
            { status: 400 }
          )
        } else if (existingRequest.status === 'REJECTED') {
          // Update existing rejected request to pending
          const { error } = await supabase
            .from('group_join_requests')
            .update({
              status: 'PENDING',
              message: validatedData.message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingRequest.id)

          if (error) {
            console.error('Error updating join request:', error)
            return NextResponse.json(
              { error: 'Failed to submit join request' },
              { status: 500 }
            )
          }

          return NextResponse.json({
            message: 'Join request submitted successfully',
            data: { status: 'PENDING' },
          })
        }
      }

      // Create new join request
      const { error } = await supabase.from('group_join_requests').insert([
        {
          group_id: groupId,
          user_id: user.id,
          message: validatedData.message,
          status: 'PENDING',
        },
      ])

      if (error) {
        console.error('Error creating join request:', error)
        return NextResponse.json(
          { error: 'Failed to submit join request' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message:
          'Join request submitted successfully. The group owner will review your request.',
        data: { status: 'PENDING' },
      })
    } else {
      // For public groups, add user directly as a member
      const { error } = await supabase.from('group_members').insert([
        {
          group_id: groupId,
          user_id: user.id,
          role: 'MEMBER',
        },
      ])

      if (error) {
        console.error('Error joining group:', error)
        return NextResponse.json(
          { error: 'Failed to join group' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Successfully joined the group!',
        data: { status: 'JOINED' },
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in join group POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const supabase = createApiClient(request)

    // Check if user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 400 }
      )
    }

    // Check if user is the owner
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        {
          error:
            'Group owners cannot leave the group. Transfer ownership or delete the group instead.',
        },
        { status: 400 }
      )
    }

    // Remove user from group
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', membership.id)

    if (error) {
      console.error('Error leaving group:', error)
      return NextResponse.json(
        { error: 'Failed to leave group' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully left the group',
    })
  } catch (error) {
    console.error('Error in leave group DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
