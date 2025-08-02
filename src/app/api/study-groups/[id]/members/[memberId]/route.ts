import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, memberId } = await params
    const body = await request.json()
    const { role } = updateMemberSchema.parse(body)

    const supabase = createClient()

    // Check if user is owner or admin of the group
    const { data: userMembership, error: userMembershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single()

    if (
      userMembershipError ||
      !userMembership ||
      !['OWNER', 'ADMIN'].includes(userMembership.role)
    ) {
      return NextResponse.json(
        { error: 'Only group owners and admins can update member roles' },
        { status: 403 }
      )
    }

    // Get the target member
    const { data: targetMember, error: targetMemberError } = await supabase
      .from('group_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('group_id', id)
      .single()

    if (targetMemberError) {
      if (targetMemberError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to fetch member' },
        { status: 500 }
      )
    }

    // Prevent changing owner role
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change the role of the group owner' },
        { status: 400 }
      )
    }

    // Only owners can promote to admin
    if (role === 'ADMIN' && userMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only group owners can promote members to admin' },
        { status: 403 }
      )
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('group_members')
      .update({ role })
      .eq('id', memberId)
      .select(
        `
        *,
        user:profiles!group_members_user_id_fkey(id, name, avatar_url, university, major)
      `
      )
      .single()

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Member role updated successfully',
      data: updatedMember,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in member PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, memberId } = await params
    const supabase = createClient()

    // Check if user is owner or admin of the group
    const { data: userMembership, error: userMembershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single()

    if (
      userMembershipError ||
      !userMembership ||
      !['OWNER', 'ADMIN'].includes(userMembership.role)
    ) {
      return NextResponse.json(
        { error: 'Only group owners and admins can remove members' },
        { status: 403 }
      )
    }

    // Get the target member
    const { data: targetMember, error: targetMemberError } = await supabase
      .from('group_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('group_id', id)
      .single()

    if (targetMemberError) {
      if (targetMemberError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to fetch member' },
        { status: 500 }
      )
    }

    // Prevent removing owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove the group owner' },
        { status: 400 }
      )
    }

    // Only owners can remove admins
    if (targetMember.role === 'ADMIN' && userMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only group owners can remove admins' },
        { status: 403 }
      )
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error in member DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
