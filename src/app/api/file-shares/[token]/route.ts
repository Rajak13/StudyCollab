import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  try {
    const { data: share, error } = await supabase
      .from('file_shares')
      .select(
        `
        *,
        file:files(
          id,
          name,
          original_name,
          file_size,
          mime_type,
          file_type,
          description,
          created_at,
          user:profiles(id, name)
        )
      `
      )
      .eq('share_token', token)
      .eq('is_active', true)
      .single()

    if (error || !share) {
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      )
    }

    // Check if share is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      )
    }

    // Check download limit
    if (share.max_downloads && share.download_count >= share.max_downloads) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 429 }
      )
    }

    // Return share info (without password hash)
    return NextResponse.json({
      data: {
        ...share,
        password_hash: undefined,
        requires_password: !!share.password_hash,
        file: share.file,
      },
    })
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
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  try {
    const { password } = await request.json()

    const { data: share, error } = await supabase
      .from('file_shares')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single()

    if (error || !share) {
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      )
    }

    // Check if share is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      )
    }

    // Check password if required
    if (share.password_hash) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required' },
          { status: 401 }
        )
      }

      const isValidPassword = await bcrypt.compare(
        password,
        share.password_hash
      )
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }
    }

    return NextResponse.json({ message: 'Access granted' })
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
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  try {
    const { data: share, error: fetchError } = await supabase
      .from('file_shares')
      .select('created_by')
      .eq('share_token', token)
      .single()

    if (fetchError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Only the creator can deactivate the share
    // Note: This would need proper auth check in a real implementation
    const { error } = await supabase
      .from('file_shares')
      .update({ is_active: false })
      .eq('share_token', token)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate share' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Share deactivated successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
