import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { UpdateNoteData } from '@/types/database'
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
    const supabase = await createServerSupabaseClient()
    const { data: note, error } = await supabase
      .from('notes')
      .select(`
        *,
        folder:note_folders(id, name, color)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      }
      console.error('Error fetching note:', error)
      return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
    }

    return NextResponse.json({ data: note })
  } catch (error) {
    console.error('Error in GET /api/notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: UpdateNoteData = await request.json()

    const supabase = await createServerSupabaseClient()
    const { data: note, error } = await supabase
      .from('notes')
      .update({
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.summary !== undefined && { summary: body.summary }),
        ...(body.tags && { tags: body.tags }),
        ...(body.is_public !== undefined && { is_public: body.is_public }),
        ...(body.template !== undefined && { template: body.template }),
        ...(body.folder_id !== undefined && { folder_id: body.folder_id }),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        folder:note_folders(id, name, color)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      }
      console.error('Error updating note:', error)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    return NextResponse.json({ data: note })
  } catch (error) {
    console.error('Error in PUT /api/notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting note:', error)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}