import { getCurrentUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CreateFileFolderData } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const parent_id = searchParams.get('parent_id')
    const include_files = searchParams.get('include_files') === 'true'

    let query = supabase
      .from('file_folders')
      .select(
        `
        *,
        parent:file_folders!parent_id(id, name, color),
        ${include_files ? 'files(id, name, file_type, file_size, created_at),' : ''}
        children:file_folders!parent_id(id, name, color, created_at)
      `
      )
      .eq('user_id', user.id)
      .order('name')

    if (parent_id) {
      if (parent_id === 'root') {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parent_id)
      }
    }

    const { data: folders, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch folders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: folders || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const body: CreateFileFolderData = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate folder names in the same parent
    const { data: existingFolder } = await supabase
      .from('file_folders')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', body.name)
      .eq('parent_id', body.parent_id || null)
      .single()

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder with this name already exists' },
        { status: 409 }
      )
    }

    const folderData = {
      ...body,
      user_id: user.id,
      color: body.color || '#6B7280',
    }

    const { data: folder, error } = await supabase
      .from('file_folders')
      .insert([folderData])
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
        { error: 'Failed to create folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: folder }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
