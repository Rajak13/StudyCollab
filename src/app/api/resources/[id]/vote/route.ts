import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { ApiResponse } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const voteSchema = z.object({
  type: z.enum(['UPVOTE', 'DOWNVOTE']),
})

// POST /api/resources/[id]/vote - Vote on a resource
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type } = voteSchema.parse(body)

    const supabase = createApiSupabaseClient(request)

    // Check if resource exists
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json(
        { data: null, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Prevent users from voting on their own resources
    if (resource.user_id === user.id) {
      return NextResponse.json(
        { data: null, error: 'Cannot vote on your own resource' },
        { status: 400 }
      )
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource_id', id)
      .single()

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', id)
      } else {
        // Update vote if different type
        await supabase
          .from('votes')
          .update({ type })
          .eq('user_id', user.id)
          .eq('resource_id', id)
      }
    } else {
      // Create new vote
      await supabase.from('votes').insert([
        {
          type,
          user_id: user.id,
          resource_id: id,
        },
      ])
    }

    // Recalculate resource scores
    const { data: votes } = await supabase
      .from('votes')
      .select('type')
      .eq('resource_id', id)

    const upvotes = votes?.filter((v) => v.type === 'UPVOTE').length || 0
    const downvotes = votes?.filter((v) => v.type === 'DOWNVOTE').length || 0
    const score = upvotes - downvotes

    // Update resource with new counts
    await supabase
      .from('resources')
      .update({
        upvotes,
        downvotes,
        score,
      })
      .eq('id', id)

    const response: ApiResponse<{
      upvotes: number
      downvotes: number
      score: number
    }> = {
      data: { upvotes, downvotes, score },
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in POST /api/resources/[id]/vote:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { data: null, error: 'Invalid vote type' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/[id]/vote - Remove vote from a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createApiSupabaseClient(request)

    // Remove the vote
    await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('resource_id', id)

    // Recalculate resource scores
    const { data: votes } = await supabase
      .from('votes')
      .select('type')
      .eq('resource_id', id)

    const upvotes = votes?.filter((v) => v.type === 'UPVOTE').length || 0
    const downvotes = votes?.filter((v) => v.type === 'DOWNVOTE').length || 0
    const score = upvotes - downvotes

    // Update resource with new counts
    await supabase
      .from('resources')
      .update({
        upvotes,
        downvotes,
        score,
      })
      .eq('id', id)

    const response: ApiResponse<{
      upvotes: number
      downvotes: number
      score: number
    }> = {
      data: { upvotes, downvotes, score },
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in DELETE /api/resources/[id]/vote:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
