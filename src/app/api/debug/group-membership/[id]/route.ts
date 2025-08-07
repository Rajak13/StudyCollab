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

    // Get detailed information about the user's membership
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single()

    // Get all memberships for this group
    const { data: allMemberships, error: allMembershipsError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', id)

    // Get group information
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json({
      debug: {
        userId: user.id,
        groupId: id,
        userMembership: membership,
        membershipError: membershipError,
        allMemberships: allMemberships,
        allMembershipsError: allMembershipsError,
        group: group,
        groupError: groupError,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint error', details: error },
      { status: 500 }
    )
  }
}