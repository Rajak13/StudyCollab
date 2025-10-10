import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { UpdateNoteFolderData } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateNoteFolderData = await request.json()
    const supabase = await createServerSupabaseClient()

    // Check if folder exists and belongs to user
    const { data: existingFolder, error: fetchError } = await supabase
      .from('note_folders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const { data: folder, error } = await supabase
      .from('note_folders')
      .update({
        ...(body.name && { name: body.name }),
        ...(body.color && { color: body.color }),
        ...(body.parent_id !== undefined && { parent_id: body.parent_id }),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating note folder:', error)
      return NextResponse.json(
        { error: 'Failed to update note folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: folder })
  } catch (error) {
    console.error('Error in PUT /api/note-folders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Check if folder exists and belongs to user
    const { data: existingFolder, error: fetchError } = await supabase
      .from('note_folders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if folder has child folders or notes
    const { data: childFolders } = await supabase
      .from('note_folders')
      .select('id')
      .eq('parent_id', id)
      .limit(1)

    const { data: notes } = await supabase
      .from('notes')
      .select('id')
      .eq('folder_id', id)
      .limit(1)

    if (childFolders && childFolders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder with subfolders' },
        { status: 400 }
      )
    }

    if (notes && notes.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder with notes' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('note_folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting note folder:', error)
      return NextResponse.json(
        { error: 'Failed to delete note folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/note-folders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
