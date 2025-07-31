import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { CreateNoteFolderData } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: folders, error } = await supabase
      .from('note_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error('Error fetching note folders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch note folders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: folders })
  } catch (error) {
    console.error('Error in GET /api/note-folders:', error)
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

    const body: CreateNoteFolderData = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: folder, error } = await supabase
      .from('note_folders')
      .insert({
        name: body.name,
        color: body.color || '#6B7280',
        parent_id: body.parent_id || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating note folder:', error)
      return NextResponse.json(
        { error: 'Failed to create note folder' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: folder }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/note-folders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
