import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Create a server-side Supabase client
function createApiClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        const cookieHeader = request.headers.get('cookie')
        if (!cookieHeader) return undefined

        const cookies = cookieHeader.split(';').reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          },
          {} as Record<string, string>
        )

        return cookies[name]
      },
      set() {},
      remove() {},
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, resourceId } = await params
    const supabase = createApiClient(request)

    // Check if user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      )
    }

    // Check if resource exists and belongs to the group
    const { data: resource } = await supabase
      .from('group_shared_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('group_id', groupId)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from('group_shared_resources')
      .update({ download_count: resource.download_count + 1 })
      .eq('id', resourceId)

    if (updateError) {
      console.error('Error updating download count:', updateError)
      // Don't fail the request if we can't update the count
    }

    // Log the download activity
    await supabase.from('group_activities').insert([
      {
        group_id: groupId,
        user_id: user.id,
        activity_type: 'RESOURCE_DOWNLOADED',
        activity_data: {
          resource_id: resourceId,
          title: resource.title,
          file_type: resource.file_type,
        },
      },
    ])

    return NextResponse.json({
      message: 'Download tracked successfully',
      download_url: resource.file_url,
    })
  } catch (error) {
    console.error('Error in resource download POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
