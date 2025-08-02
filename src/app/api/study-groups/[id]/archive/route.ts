import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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
    const supabase = createApiClient(request)

    // Check if user is the owner of the group
    const { data: group } = await supabase
      .from('study_groups')
      .select('owner_id, is_archived, name')
      .eq('id', groupId)
      .single()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only group owners can archive groups' },
        { status: 403 }
      )
    }

    if (group.is_archived) {
      return NextResponse.json(
        { error: 'Group is already archived' },
        { status: 400 }
      )
    }

    // Archive the group
    const { data: archivedGroup, error } = await supabase
      .from('study_groups')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select('*')
      .single()

    if (error) {
      console.error('Error archiving group:', error)
      return NextResponse.json(
        { error: 'Failed to archive group' },
        { status: 500 }
      )
    }

    // Log the archival activity
    await supabase.from('group_activities').insert([
      {
        group_id: groupId,
        user_id: user.id,
        activity_type: 'GROUP_ARCHIVED',
        activity_data: {
          reason: 'manual',
          archived_by: user.id,
        },
      },
    ])

    return NextResponse.json({
      data: archivedGroup,
      message: 'Group archived successfully',
    })
  } catch (error) {
    console.error('Error in group archive POST:', error)
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
    const { data: group } = await supabase
      .from('study_groups')
      .select('owner_id, is_archived, name')
      .eq('id', groupId)
      .single()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only group owners can unarchive groups' },
        { status: 403 }
      )
    }

    if (!group.is_archived) {
      return NextResponse.json(
        { error: 'Group is not archived' },
        { status: 400 }
      )
    }

    // Unarchive the group
    const { data: unarchivedGroup, error } = await supabase
      .from('study_groups')
      .update({
        is_archived: false,
        archived_at: null,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select('*')
      .single()

    if (error) {
      console.error('Error unarchiving group:', error)
      return NextResponse.json(
        { error: 'Failed to unarchive group' },
        { status: 500 }
      )
    }

    // Log the unarchival activity
    await supabase.from('group_activities').insert([
      {
        group_id: groupId,
        user_id: user.id,
        activity_type: 'GROUP_UPDATED',
        activity_data: {
          action: 'unarchived',
          unarchived_by: user.id,
        },
      },
    ])

    return NextResponse.json({
      data: unarchivedGroup,
      message: 'Group unarchived successfully',
    })
  } catch (error) {
    console.error('Error in group archive DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
