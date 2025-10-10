import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, requestId } = await params
    const body = await request.json()
    const { status } = updateRequestSchema.parse(body)

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
        { error: 'Only group owners and admins can manage join requests' },
        { status: 403 }
      )
    }

    // Get the join request
    const { data: joinRequest, error: requestError } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('group_id', id)
      .eq('status', 'PENDING')
      .single()

    if (requestError) {
      if (requestError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Join request not found or already processed' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch join request' },
        { status: 500 }
      )
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from('group_join_requests')
      .update({ status })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating join request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update join request' },
        { status: 500 }
      )
    }

    // If approved, add user as member
    if (status === 'APPROVED') {
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            user_id: joinRequest.user_id,
            group_id: id,
            role: 'MEMBER',
          },
        ])

      if (memberError) {
        console.error('Error adding group member:', memberError)
        // Rollback the request status update
        await supabase
          .from('group_join_requests')
          .update({ status: 'PENDING' })
          .eq('id', requestId)

        return NextResponse.json(
          { error: 'Failed to add member to group' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message:
        status === 'APPROVED'
          ? 'Join request approved and user added to group'
          : 'Join request rejected',
      data: { status },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in join request PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
