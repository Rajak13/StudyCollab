import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/bookmarks/[id] - Remove a bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createApiSupabaseClient(request)
    const { id: bookmarkId } = await params

    // Delete bookmark (only if owned by user)
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting bookmark:', error)
      return NextResponse.json(
        { error: 'Failed to delete bookmark' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Bookmark deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/bookmarks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/bookmarks/[id] - Update bookmark folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { folder_name } = body
    const supabase = createApiSupabaseClient(request)
    const { id: bookmarkId } = await params

    // Update bookmark folder
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .update({ folder_name: folder_name || null })
      .eq('id', bookmarkId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bookmark:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to update bookmark' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: bookmark, error: null })
  } catch (error) {
    console.error('Error in PUT /api/bookmarks/[id]:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
