import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { CreateNoteData, NoteFilters } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    // Parse filters
    const filters: NoteFilters = {
      folder_id: searchParams.get('folder_id') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      is_public: searchParams.get('is_public') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
    }

    let query = supabase
      .from('notes')
      .select(
        `
        *,
        folder:note_folders(id, name, color)
      `
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (filters.folder_id) {
      query = query.eq('folder_id', filters.folder_id)
    }

    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.search) {
      // Use full-text search across title and content
      // Since content is JSONB, we need to extract text from it
      query = query.or(
        `title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`
      )
    }

    const { data: notes, error } = await query

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: notes })
  } catch (error) {
    console.error('Error in GET /api/notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/notes - Starting request')

    const user = await getCurrentUser()
    console.log(
      'User from getCurrentUser:',
      user ? { id: user.id, email: user.email } : 'null'
    )

    if (!user) {
      console.log('No user found, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: CreateNoteData
    try {
      body = await request.json()
      console.log('Successfully parsed JSON body')
    } catch (parseError) {
      console.error('Error parsing JSON body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Log the received data for debugging
    console.log('Received note data:', {
      title: body.title,
      contentType: typeof body.content,
      content: body.content,
      hasTitle: !!body.title,
      hasContent: !!body.content,
    })

    // Validate required fields
    if (!body.title || !body.content) {
      console.log('Validation failed:', {
        title: body.title,
        content: body.content,
      })
      return NextResponse.json(
        {
          error: 'Title and content are required',
          details: {
            hasTitle: !!body.title,
            hasContent: !!body.content,
            titleLength: body.title?.length || 0,
            contentKeys: body.content ? Object.keys(body.content) : [],
          },
        },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = await createServerSupabaseClient()
      console.log('Successfully created Supabase client')
    } catch (supabaseError) {
      console.error('Error creating Supabase client:', supabaseError)
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    // Log user information for debugging
    console.log('User info:', { id: user.id, email: user.email })

    // Note: Profile should already exist from auth setup, skip profile check for now

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        title: body.title,
        content: body.content,
        summary: body.summary,
        tags: body.tags || [],
        is_public: body.is_public || false,
        template: body.template,
        folder_id: body.folder_id,
        user_id: user.id,
      })
      .select(
        `
        *,
        folder:note_folders(id, name, color)
      `
      )
      .single()

    if (error) {
      console.error('Error creating note:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          error: 'Failed to create note',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: note }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
