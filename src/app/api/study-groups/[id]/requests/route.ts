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

    // Check if user is owner or admin of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single()

    if (
      membershipError ||
      !membership ||
      !['OWNER', 'ADMIN'].includes(membership.role)
    ) {
      return NextResponse.json(
        { error: 'Only group owners and admins can view join requests' },
        { status: 403 }
      )
    }

    // Get pending join requests
    const { data: requests, error } = await supabase
      .from('group_join_requests')
      .select(
        `
        *,
        user:profiles!group_join_requests_user_id_fkey(id, name, avatar_url, university, major)
      `
      )
      .eq('group_id', id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching join requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch join requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: requests || [] })
  } catch (error) {
    console.error('Error in join requests GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
