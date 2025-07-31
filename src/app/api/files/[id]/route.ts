import { getCurrentUser } from '@/lib/auth'
import { deleteFile } from '@/lib/file-upload'
import { UpdateFileData } from '@/types/database'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    const { data: file, error } = await supabase
      .from('files')
      .select(
        `
        *,
        folder:file_folders(id, name, color),
        user:profiles(id, name, avatar_url),
        shares:file_shares(id, share_token, expires_at, max_downloads, download_count, is_active)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Log the view action
    await supabase.from('file_access_logs').insert([
      {
        file_id: file.id,
        user_id: user.id,
        action: 'VIEW',
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      },
    ])

    return NextResponse.json({ data: file })
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

    const { id } = await params
    const body: UpdateFileData = await request.json()

    const { data: file, error } = await supabase
      .from('files')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(
        `
        *,
        folder:file_folders(id, name, color),
        user:profiles(id, name, avatar_url)
      `
      )
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update file' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: file })
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

    const { id } = await params

    // Get file info before deletion
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from database first
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    // Delete from storage
    const storageResult = await deleteFile(file.file_path)
    if (!storageResult.success) {
      console.error('Storage deletion failed:', storageResult.error)
      // Don't fail the request if storage deletion fails
    }

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
