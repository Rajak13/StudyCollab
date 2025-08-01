import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bookmarks/folders - List bookmark folders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: [], error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createApiSupabaseClient(request)

    // Get unique folder names from bookmarks
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('folder_name')
      .eq('user_id', user.id)
      .not('folder_name', 'is', null)

    if (error) {
      console.error('Error fetching bookmark folders:', error)
      return NextResponse.json(
        { data: [], error: 'Failed to fetch folders' },
        { status: 500 }
      )
    }

    // Count bookmarks per folder
    const folderCounts: Record<string, number> = {}
    bookmarks?.forEach((bookmark) => {
      if (bookmark.folder_name) {
        folderCounts[bookmark.folder_name] =
          (folderCounts[bookmark.folder_name] || 0) + 1
      }
    })

    const folders = Object.entries(folderCounts).map(([name, count]) => ({
      name,
      bookmark_count: count,
    }))

    return NextResponse.json({ data: folders, error: null })
  } catch (error) {
    console.error('Error in GET /api/bookmarks/folders:', error)
    return NextResponse.json(
      { data: [], error: 'Internal server error' },
      { status: 500 }
    )
  }
}
