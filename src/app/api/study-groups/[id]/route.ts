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

const updateStudyGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  subject: z.string().max(100, 'Subject too long').optional(),
  university: z.string().max(255, 'University name too long').optional(),
  is_private: z.boolean().optional(),
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
    const supabase = createApiClient(request)

    // Get the study group with member count and user's membership info
    const { data: group, error } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle()

    if (error) {
      console.error('Database error when fetching group:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user can view this group (public groups or member of private groups)
    if (group.is_private) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership && group.owner_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get user's membership info
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Get member count
    const { count: memberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    // Transform the response
    const transformedGroup = {
      ...group,
      member_count: memberCount || 0,
      is_member: !!membership,
      user_role: membership?.role || null,
    }

    return NextResponse.json({ data: transformedGroup })
  } catch (error) {
    console.error('Error in study group GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const validatedData = updateStudyGroupSchema.parse(body)

    const supabase = createApiClient(request)

    // Check if user is the owner of the group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('owner_id')
      .eq('id', groupId)
      .maybeSingle()

    if (groupError) {
      console.error('Database error when checking group ownership:', groupError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only group owners can update the group' },
        { status: 403 }
      )
    }

    // Update the group
    const { data: updatedGroup, error } = await supabase
      .from('study_groups')
      .update(validatedData)
      .eq('id', groupId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating study group:', error)
      return NextResponse.json(
        { error: 'Failed to update study group' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: updatedGroup,
      message: 'Study group updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in study group PUT:', error)
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

    // Check if user is the owner of the group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('owner_id, name')
      .eq('id', groupId)
      .maybeSingle()

    if (groupError) {
      console.error('Database error when checking group for deletion:', groupError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only group owners can delete the group' },
        { status: 403 }
      )
    }

    // Use the safe deletion function to avoid foreign key constraint violations
    const { data: deletionResult, error } = await supabase
      .rpc('delete_study_group_safely', { group_id_param: groupId })

    if (error) {
      console.error('Error deleting study group:', error)
      return NextResponse.json(
        { error: 'Failed to delete study group', details: error },
        { status: 500 }
      )
    }

    if (!deletionResult) {
      return NextResponse.json(
        { error: 'Group not found or already deleted' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Study group deleted successfully',
    })
  } catch (error) {
    console.error('Error in study group DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
