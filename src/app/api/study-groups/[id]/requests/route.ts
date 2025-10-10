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

    // First, let's check if the group exists using service role to bypass RLS
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

    // Check if user is owner or admin of the group using regular client
    const supabaseRegular = createClient()
    const { data: membershipData, error: membershipError } = await supabaseRegular
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    
    let membership = membershipData

    // Enhanced error logging for debugging
    if (membershipError) {
      console.error('Membership query error:', {
        error: membershipError,
        groupId: id,
        userId: user.id,
        groupName: group.name,
      })
    }

    if (!membership) {
      console.log('No membership found for user:', {
        groupId: id,
        userId: user.id,
        groupName: group.name,
        groupOwnerId: group.owner_id,
        isOwner: group.owner_id === user.id,
      })
      
      // If user is the owner but not in group_members, this is a data consistency issue
      if (group.owner_id === user.id) {
        console.error('CRITICAL: Group owner is not in group_members table!', {
          groupId: id,
          groupName: group.name,
          ownerId: group.owner_id,
        })
        
        // Try to fix this by adding the owner to group_members
        const { error: insertError } = await supabase
          .from('group_members')
          .insert({
            user_id: user.id,
            group_id: id,
            role: 'OWNER'
          })
        
        if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
          console.error('Failed to add owner to group_members:', insertError)
        } else {
          console.log('Successfully added owner to group_members')
          // Retry the membership query
          const { data: retryMembership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', id)
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (retryMembership) {
            // Continue with the fixed membership
            membership = retryMembership
          }
        }
      }
      
      if (!membership) {
        return NextResponse.json(
          { 
            error: 'You are not a member of this group',
            details: { 
              groupId: id, 
              userId: user.id,
              groupName: group.name,
              isOwner: group.owner_id === user.id
            }
          },
          { status: 403 }
        )
      }
    }

    if (!['OWNER', 'ADMIN'].includes(membership.role)) {
      console.log('User does not have required role:', {
        groupId: id,
        userId: user.id,
        userRole: membership.role,
        requiredRoles: ['OWNER', 'ADMIN'],
        groupName: group.name,
      })
      return NextResponse.json(
        { 
          error: 'Only group owners and admins can view join requests',
          details: { 
            userRole: membership.role, 
            requiredRoles: ['OWNER', 'ADMIN'],
            groupName: group.name
          }
        },
        { status: 403 }
      )
    }

    // Get all join requests (not just pending)
    const { data: requests, error } = await supabaseRegular
      .from('group_join_requests')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching join requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch join requests' },
        { status: 500 }
      )
    }

    // Get user data for each request using service client
    const requestsWithUsers = await Promise.all(
      (requests || []).map(async (request) => {
        try {
          const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(
            request.user_id
          )
          
          if (userError) {
            console.error('Error fetching user data for request:', userError, 'for user:', request.user_id)
          }
          
          // Also try to get profile data from profiles table
          const { data: profileData } = await serviceSupabase
            .from('profiles')
            .select('*')
            .eq('id', request.user_id)
            .maybeSingle()
          
          return {
            ...request,
            user: userData.user,
            profile: profileData,
          }
        } catch (error) {
          console.error('Error in user data fetch for request:', error, 'for user:', request.user_id)
          return {
            ...request,
            user: null,
            profile: null,
          }
        }
      })
    )

    return NextResponse.json({ data: requestsWithUsers || [] })
  } catch (error) {
    console.error('Error in join requests GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
