import { getCurrentUser } from '@/lib/auth'
import { UpdateFileFolderData } from '@/types/database'
import { createSupabaseServerClient } from '@/lib/supabase-server'
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

    const supabase = createSupabaseServerClient()
    const { id } = await params

    const { data: folder, error } = await supabase
      .from('file_folders')
      .select(
        `
        *,
        parent:file_folders!parent_id(id, name, color),
        children:file_folders!parent_id(id, name, color, created_at),
        files(id, name, file_type, file_size, created_at)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json({ data: folder })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const supabase = createSupabaseServerClient()
    const { id } = await params
    const body: UpdateFileFolderData = await request.json()

    // Check if trying to set parent to itself or create circular reference
    if (body.parent_id === id) {
      return NextResponse.json(
        { error: 'Cannot set folder as its own parent' },
        { status: 400 }
      )
    }

    // Check for duplicate folder names in the same parent (if name is being changed)
    if (body.name) {
      const { data: existingFolder } = await supabase
        .from('file_folders')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', body.name)
        .eq('parent_id', body.parent_id || null)
        .neq('id', id)
        .single()

      if (existingFolder) {
        return NextResponse.json(
          { error: 'Folder with this name already exists' },
          { status: 400 }
        )
      }
    }

    const { data: folder, error } = await supabase
      .from('file_folders')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(
        `
        *,
        parent:file_folders!parent_id(id, name, color)
      `
      )
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: folder })
  } catch (error) {
    console.error('API error:', error)
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
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const { id } = await params

    // Check if folder has children or files
    const { data: children } = await supabase
      .from('file_folders')
      .select('id')
      .eq('parent_id', id)
      .eq('user_id', user.id)

    const { data: files } = await supabase
      .from('files')
      .select('id')
      .eq('folder_id', id)
      .eq('user_id', user.id)

    if ((children && children.length > 0) || (files && files.length > 0)) {
      return NextResponse.json(
        {
          error: 'Cannot delete folder that contains files or subfolders',
        },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('file_folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Folder deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
