import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { updateResourceSchema } from '@/lib/validations/resources'
import { ApiResponse, Resource } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/resources/[id] - Get a specific resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createApiSupabaseClient(request)

    const { data: resource, error } = await supabase
      .from('resources')
      .select(
        `
        *,
        user:profiles!resources_user_id_fkey(
          id,
          name,
          avatar_url,
          university
        ),
        votes(type, user_id),
        comments(
          id,
          content,
          created_at,
          user:profiles!comments_user_id_fkey(
            id,
            name,
            avatar_url
          )
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching resource:', error)
      return NextResponse.json(
        { data: null, error: 'Resource not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Resource> = {
      data: resource,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/resources/[id]:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/resources/[id] - Update a resource
export async function PUT(
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
    const validatedData = updateResourceSchema.parse(body)

    const supabase = createApiSupabaseClient(request)

    // Check if resource exists and user owns it
    const { data: existingResource, error: fetchError } = await supabase
      .from('resources')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingResource) {
      return NextResponse.json(
        { data: null, error: 'Resource not found' },
        { status: 404 }
      )
    }

    if (existingResource.user_id !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: 'Forbidden: You can only edit your own resources',
        },
        { status: 403 }
      )
    }

    // Update the resource
    const { data: resource, error } = await supabase
      .from('resources')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        user:profiles!resources_user_id_fkey(
          id,
          name,
          avatar_url,
          university
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating resource:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to update resource' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Resource> = {
      data: resource,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PUT /api/resources/[id]:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { data: null, error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/[id] - Delete a resource
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

    // Check if resource exists and user owns it
    const { data: existingResource, error: fetchError } = await supabase
      .from('resources')
      .select('user_id, file_url')
      .eq('id', id)
      .single()

    if (fetchError || !existingResource) {
      return NextResponse.json(
        { data: null, error: 'Resource not found' },
        { status: 404 }
      )
    }

    if (existingResource.user_id !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: 'Forbidden: You can only delete your own resources',
        },
        { status: 403 }
      )
    }

    // Delete the resource (this will cascade delete votes and comments)
    const { error } = await supabase.from('resources').delete().eq('id', id)

    if (error) {
      console.error('Error deleting resource:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to delete resource' },
        { status: 500 }
      )
    }

    // TODO: Also delete the file from storage if it exists
    // This would be implemented when we integrate with file storage

    return NextResponse.json({ data: { id }, error: null }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/resources/[id]:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
