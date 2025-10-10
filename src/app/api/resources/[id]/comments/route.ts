import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { ApiResponse, Comment } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment too long'),
  parent_id: z.string().uuid().optional(),
})

// GET /api/resources/[id]/comments - Get comments for a resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createApiSupabaseClient(request)

    // Fetch comments with nested replies
    const { data: comments, error } = await supabase
      .from('comments')
      .select(
        `
        *,
        user:profiles!comments_user_id_fkey(
          id,
          name,
          avatar_url
        ),
        replies:comments!parent_id(
          *,
          user:profiles!comments_user_id_fkey(
            id,
            name,
            avatar_url
          )
        )
      `
      )
      .eq('resource_id', id)
      .is('parent_id', null) // Only get top-level comments
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { data: [], error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Comment[]> = {
      data: comments || [],
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/resources/[id]/comments:', error)
    return NextResponse.json(
      { data: [], error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/resources/[id]/comments - Create a new comment
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
    const { content, parent_id } = createCommentSchema.parse(body)

    const supabase = createApiSupabaseClient(request)

    // Check if resource exists
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id')
      .eq('id', id)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json(
        { data: null, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // If parent_id is provided, check if parent comment exists
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, resource_id')
        .eq('id', parent_id)
        .single()

      if (parentError || !parentComment || parentComment.resource_id !== id) {
        return NextResponse.json(
          { data: null, error: 'Parent comment not found' },
          { status: 400 }
        )
      }
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([
        {
          content,
          parent_id: parent_id || null,
          user_id: user.id,
          resource_id: id,
        },
      ])
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
      console.error('Error creating comment:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Comment> = {
      data: comment,
      error: null,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/resources/[id]/comments:', error)

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
