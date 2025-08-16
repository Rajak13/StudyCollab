import { getCurrentUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CreateFileShareData } from '@/types/database'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

function generateShareToken(): string {
  return randomBytes(32).toString('hex')
}

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

    // Verify user owns the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get all active shares for this file
    const { data: shares, error } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_id', id)
      .eq('created_by', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shares' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: shares || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const body: CreateFileShareData = await request.json()

    // Verify user owns the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Generate share token
    const shareToken = generateShareToken()

    // Hash password if provided
    let passwordHash = null
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password, 12)
    }

    const shareData = {
      file_id: id,
      share_token: shareToken,
      expires_at: body.expires_at || null,
      password_hash: passwordHash,
      max_downloads: body.max_downloads || null,
      created_by: user.id,
    }

    const { data: share, error } = await supabase
      .from('file_shares')
      .insert([shareData])
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create share' },
        { status: 500 }
      )
    }

    // Log the share action
    await supabase.from('file_access_logs').insert([
      {
        file_id: id,
        user_id: user.id,
        action: 'SHARE',
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      },
    ])

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/files/shared/${shareToken}`

    return NextResponse.json(
      {
        data: {
          ...share,
          share_url: shareUrl,
          password_hash: undefined, // Don't return the hash
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
