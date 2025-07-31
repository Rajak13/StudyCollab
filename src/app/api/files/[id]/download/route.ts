import { getCurrentUser } from '@/lib/auth'
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
    const { searchParams } = new URL(request.url)
    const shareToken = searchParams.get('token')
    const { id } = await params

    let file
    let canAccess = false

    if (shareToken) {
      // Access via share token
      const { data: share, error: shareError } = await supabase
        .from('file_shares')
        .select(
          `
          *,
          file:files(*)
        `
        )
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single()

      if (shareError || !share) {
        return NextResponse.json(
          { error: 'Invalid or expired share link' },
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

      file = share.file
      canAccess = true

      // Log the download with share token
      await supabase.from('file_access_logs').insert([
        {
          file_id: file.id,
          user_id: user?.id || null,
          action: 'DOWNLOAD',
          share_token: shareToken,
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        },
      ])
    } else {
      // Regular access - user must be authenticated and own the file
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: fileData, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !fileData) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      // Check if user can access (owner or public file)
      if (fileData.user_id === user.id || fileData.is_public) {
        file = fileData
        canAccess = true
      }

      if (canAccess) {
        // Log the download
        await supabase.from('file_access_logs').insert([
          {
            file_id: file.id,
            user_id: user.id,
            action: 'DOWNLOAD',
            ip_address:
              request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
          },
        ])
      }
    }

    if (!canAccess || !file) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if this is a direct download request (has 'direct' query param)
    const isDirect = searchParams.get('direct') === 'true'

    if (isDirect) {
      // Stream the file directly with download headers
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('files')
        .download(file.file_path)

      if (downloadError || !fileData) {
        console.error('Failed to download file:', downloadError)
        return NextResponse.json(
          { error: 'Failed to download file' },
          { status: 500 }
        )
      }

      // Return the file with proper download headers
      return new NextResponse(fileData, {
        headers: {
          'Content-Type': file.mime_type,
          'Content-Disposition': `attachment; filename="${file.original_name}"`,
          'Content-Length': file.file_size.toString(),
        },
      })
    } else {
      // Return signed URL for client-side download
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('files')
        .createSignedUrl(file.file_path, 3600)

      if (urlError || !signedUrl) {
        console.error('Failed to create signed URL:', urlError)
        return NextResponse.json(
          { error: 'Failed to generate download link' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        download_url: signedUrl.signedUrl,
        filename: file.original_name,
        file_size: file.file_size,
        mime_type: file.mime_type,
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
