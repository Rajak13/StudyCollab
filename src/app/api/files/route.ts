import { getCurrentUser } from '@/lib/auth'
<<<<<<< HEAD
=======
import { supabase } from '@/lib/supabase'
>>>>>>> a9ba7c887532e1cbf933e51bc87a873daafc57a3
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CreateFileData } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const folder_id = searchParams.get('folder_id')
    const file_type = searchParams.get('file_type')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const is_public = searchParams.get('is_public')
    const search = searchParams.get('search')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('files')
      .select(
        `
        *,
        folder:file_folders(id, name, color),
        user:profiles(id, name, avatar_url)
      `
      )
      .eq('user_id', user.id)

    // Apply filters
    if (folder_id) {
      if (folder_id === 'root') {
        query = query.is('folder_id', null)
      } else {
        query = query.eq('folder_id', folder_id)
      }
    }

    if (file_type) {
      query = query.eq('file_type', file_type)
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    if (is_public !== null) {
      query = query.eq('is_public', is_public === 'true')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: files, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: files || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateFileData = await request.json()

    // Debug logging
    console.log('File creation request body:', body)

    // Validate required fields
    if (
      !body.name ||
      !body.file_path ||
      !body.file_url ||
      !body.file_size ||
      !body.mime_type
    ) {
      console.log('Missing fields:', {
        name: !body.name,
        file_path: !body.file_path,
        file_url: !body.file_url,
        file_size: !body.file_size,
        mime_type: !body.mime_type,
      })
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missing: {
            name: !body.name,
            file_path: !body.file_path,
            file_url: !body.file_url,
            file_size: !body.file_size,
            mime_type: !body.mime_type,
          },
        },
        { status: 400 }
      )
    }

    const fileData = {
      ...body,
      user_id: user.id,
      tags: body.tags || [],
      is_public: body.is_public || false,
    }

<<<<<<< HEAD
    const supabaseClient = createSupabaseServerClient()
=======
    const supabaseClient = supabase()
>>>>>>> a9ba7c887532e1cbf933e51bc87a873daafc57a3
    const { data: file, error } = await supabaseClient
      .from('files')
      .insert([fileData])
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
        { error: 'Failed to create file record' },
        { status: 500 }
      )
    }

    // Log the upload action
<<<<<<< HEAD
    try {
      await supabaseClient.from('file_access_logs').insert([
        {
          file_id: file.id,
          user_id: user.id,
          action: 'UPLOAD',
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        },
      ])
    } catch (logError) {
      console.warn('Failed to log file access:', logError)
      // Don't fail the request if logging fails
    }
=======
    await supabaseClient.from('file_access_logs').insert([
      {
        file_id: file.id,
        user_id: user.id,
        action: 'UPLOAD',
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      },
    ])
>>>>>>> a9ba7c887532e1cbf933e51bc87a873daafc57a3

    return NextResponse.json({ data: file }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
