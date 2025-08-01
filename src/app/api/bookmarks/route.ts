import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export interface Bookmark {
  id: string
  user_id: string
  content_type: 'task' | 'note' | 'resource'
  content_id: string
  title: string
  description?: string
  tags: string[]
  folder_name?: string
  created_at: string
  updated_at: string
  // Content details
  content_data?: {
    priority?: string
    status?: string
    due_date?: string
    is_public?: boolean
    subject?: string
    upvotes?: number
  }
}

export interface BookmarkFolder {
  id: string
  name: string
  description?: string
  color: string
  user_id: string
  created_at: string
  updated_at: string
  bookmark_count: number
}

// GET /api/bookmarks - List user's bookmarks
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
    const { searchParams } = new URL(request.url)

    const folder = searchParams.get('folder')
    const contentType = searchParams.get('content_type') as
      | 'task'
      | 'note'
      | 'resource'
      | null
    const search = searchParams.get('search')

    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (folder) {
      query = query.eq('folder_name', folder)
    }

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: bookmarks, error } = await query

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return NextResponse.json(
        { data: [], error: 'Failed to fetch bookmarks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: bookmarks || [], error: null })
  } catch (error) {
    console.error('Error in GET /api/bookmarks:', error)
    return NextResponse.json(
      { data: [], error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/bookmarks - Create a new bookmark
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content_type, content_id, folder_name } = body

    if (!content_type || !content_id) {
      return NextResponse.json(
        { data: null, error: 'Content type and ID are required' },
        { status: 400 }
      )
    }

    const supabase = createApiSupabaseClient(request)

    // Fetch the content details to populate bookmark metadata
    let contentData: Record<string, unknown> | null = null
    let title = ''
    let description = ''
    let tags: string[] = []

    switch (content_type) {
      case 'task':
        const { data: task } = await supabase
          .from('tasks')
          .select('title, description, tags, priority, status, due_date')
          .eq('id', content_id)
          .eq('user_id', user.id)
          .single()

        if (task) {
          title = task.title
          description = task.description || ''
          tags = task.tags
          contentData = {
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
          }
        }
        break

      case 'note':
        const { data: note } = await supabase
          .from('notes')
          .select('title, summary, tags, is_public')
          .eq('id', content_id)
          .eq('user_id', user.id)
          .single()

        if (note) {
          title = note.title
          description = note.summary || ''
          tags = note.tags
          contentData = {
            is_public: note.is_public,
          }
        }
        break

      case 'resource':
        const { data: resource } = await supabase
          .from('resources')
          .select('title, description, tags, subject, upvotes')
          .eq('id', content_id)
          .single()

        if (resource) {
          title = resource.title
          description = resource.description
          tags = resource.tags
          contentData = {
            subject: resource.subject,
            upvotes: resource.upvotes,
          }
        }
        break
    }

    if (!title) {
      return NextResponse.json(
        { data: null, error: 'Content not found or access denied' },
        { status: 404 }
      )
    }

    // Check if bookmark already exists
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .single()

    if (existingBookmark) {
      return NextResponse.json(
        { data: null, error: 'Content is already bookmarked' },
        { status: 409 }
      )
    }

    // Create bookmark
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: user.id,
          content_type,
          content_id,
          title,
          description,
          tags,
          folder_name: folder_name || null,
          content_data: contentData,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating bookmark:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to create bookmark' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: bookmark, error: null }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bookmarks:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
