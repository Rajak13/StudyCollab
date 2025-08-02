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

export async function DELETE(
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

    // Check if resource exists and user has permission to delete it
    const { data: resource } = await supabase
      .from('group_shared_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('group_id', groupId)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Only the resource owner or group admins can delete resources
    const canDelete =
      resource.user_id === user.id ||
      ['OWNER', 'ADMIN'].includes(membership.role)

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            'You can only delete your own resources or must be a group admin',
        },
        { status: 403 }
      )
    }

    // Delete the resource
    const { error: deleteError } = await supabase
      .from('group_shared_resources')
      .delete()
      .eq('id', resourceId)

    if (deleteError) {
      console.error('Error deleting resource:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Resource deleted successfully' })
  } catch (error) {
    console.error('Error in resource DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
