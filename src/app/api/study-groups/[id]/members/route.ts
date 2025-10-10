import { getCurrentUser } from '@/lib/auth'
import { createClient, createServiceSupabaseClient } from '@/lib/supabase'
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
    const serviceSupabase = createServiceSupabaseClient()

    // Check if the group exists using service role to bypass RLS
    const { data: group, error: groupError } = await serviceSupabase
      .from('study_groups')
      .select('id, name, owner_id, is_private')
      .eq('id', id)
      .maybeSingle()

    if (groupError) {
      console.error('Database error when checking group:', {
        error: groupError,
        groupId: id,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!group) {
      console.error('Group not found:', {
        groupId: id,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      )
    }

    console.log('Group found:', {
      groupId: id,
      groupName: group.name,
      ownerId: group.owner_id,
      isPrivate: group.is_private,
      userId: user.id,
      isOwner: group.owner_id === user.id,
    })

    // First, fix any membership consistency issues for this group
    if (group.owner_id === user.id) {
      // Ensure the owner is in the group_members table
      await supabase
        .rpc('fix_group_membership_consistency')
    }

    // If group is private, check if user is a member using service role
    if (group.is_private) {
      const { data: membership } = await serviceSupabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json(
          { error: 'You must be a member to view group members' },
          { status: 403 }
        )
      }
    }

    // Get group members with user data from auth.users using service client
    const { data: members, error } = await serviceSupabase
      .from('group_members')
      .select('*')
      .eq('group_id', id)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching group members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch group members' },
        { status: 500 }
      )
    }

    console.log('Raw members data:', {
      groupId: id,
      membersCount: members?.length || 0,
      members: members
    })

    // Get user data for each member using service client for auth.admin
    const membersWithUsers = await Promise.all(
      (members || []).map(async (member) => {
        try {
          const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(
            member.user_id
          )
          
          if (userError) {
            console.error('Error fetching user data:', userError, 'for user:', member.user_id)
          }
          
          // Also try to get profile data from profiles table
          const { data: profileData } = await serviceSupabase
            .from('profiles')
            .select('*')
            .eq('id', member.user_id)
            .maybeSingle()
          
          return {
            ...member,
            user: userData.user,
            profile: profileData,
          }
        } catch (error) {
          console.error('Error in user data fetch:', error, 'for user:', member.user_id)
          return {
            ...member,
            user: null,
            profile: null,
          }
        }
      })
    )

    console.log('Final members with users:', {
      groupId: id,
      membersWithUsersCount: membersWithUsers.length,
      membersWithUsers: membersWithUsers
    })

    return NextResponse.json({ data: membersWithUsers || [] })
  } catch (error) {
    console.error('Error in group members GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
