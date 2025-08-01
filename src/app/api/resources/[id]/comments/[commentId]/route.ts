import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { ApiResponse, Comment } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment too long'),
})

// PUT /api/resources/[id]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id, commentId } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = updateCommentSchema.parse(body)

    const supabase = createApiSupabaseClient(request)

    // Check if comment exists and user owns it
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, resource_id')
      .eq('id', commentId)
      .eq('resource_id', id)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { data: null, error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden: You can only edit your own comments' },
        { status: 403 }
      )
    }

    // Update the comment
    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select(
        `
        *,
        user:profiles!comments_user_id_fkey(
          id,
          name,
          avatar_url
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to update comment' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Comment> = {
      data: comment,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error(
      'Error in PUT /api/resources/[id]/comments/[commentId]:',
      error
    )

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { data: null, error: 'Invalid comment data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id, commentId } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createApiSupabaseClient(request)

    // Check if comment exists and user owns it
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, resource_id')
      .eq('id', commentId)
      .eq('resource_id', id)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { data: null, error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: 'Forbidden: You can only delete your own comments',
        },
        { status: 403 }
      )
    }

    // Delete the comment (this will cascade delete replies)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { id: commentId }, error: null })
  } catch (error) {
    console.error(
      'Error in DELETE /api/resources/[id]/comments/[commentId]:',
      error
    )
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
