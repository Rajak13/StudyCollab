import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createClient()

    // Check if user has access to view members (is a member or group is public)
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('is_private')
      .eq('id', id)
      .single()

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Study group not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch study group' },
        { status: 500 }
      )
    }

    // If group is private, check if user is a member
    if (group.is_private) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return NextResponse.json(
          { error: 'You must be a member to view group members' },
          { status: 403 }
        )
      }
    }

    // Get group members
    const { data: members, error } = await supabase
      .from('group_members')
      .select(
        `
        *,
        user:profiles!group_members_user_id_fkey(id, name, avatar_url, university, major)
      `
      )
      .eq('group_id', id)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching group members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch group members' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: members || [] })
  } catch (error) {
    console.error('Error in group members GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
