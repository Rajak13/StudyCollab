import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const updatePresenceSchema = z.object({
  cursor_position: z.object({
    x: z.number(),
    y: z.number()
  }).nullable().optional(),
  current_tool: z.string().max(50).nullable().optional(),
  session_id: z.string().max(255).optional().default('default')
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boardId = params.id

    // Check if user has access to the board
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        id,
        group:study_groups!inner(id),
        group_members!inner(user_id)
      `)
      .eq('id', boardId)
      .eq('group_members.user_id', user.id)
      .single()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 })
    }

    // Get active presence for the board
    const { data: presence, error: presenceError } = await supabase
      .from('user_presence')
      .select(`
        user_id,
        cursor_position,
        current_tool,
        is_active,
        last_seen,
        session_id,
        user:profiles!user_presence_user_id_fkey(id, name, avatar_url)
      `)
      .eq('board_id', boardId)
      .eq('is_active', true)
      .order('last_seen', { ascending: false })

    if (presenceError) {
      console.error('Error fetching user presence:', presenceError)
      return NextResponse.json({ error: 'Failed to fetch user presence' }, { status: 500 })
    }

    return NextResponse.json({ data: presence || [] })

  } catch (error) {
    console.error('Error in GET /api/study-boards/[id]/presence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boardId = params.id

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updatePresenceSchema.parse(body)

    // Check if user has access to the board
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        id,
        group:study_groups!inner(id),
        group_members!inner(user_id)
      `)
      .eq('id', boardId)
      .eq('group_members.user_id', user.id)
      .single()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 })
    }

    // Update user presence using the database function
    const { error: presenceError } = await supabase.rpc('update_user_presence', {
      p_board_id: boardId,
      p_cursor_position: validatedData.cursor_position,
      p_current_tool: validatedData.current_tool,
      p_session_id: validatedData.session_id
    })

    if (presenceError) {
      console.error('Error updating user presence:', presenceError)
      return NextResponse.json({ error: 'Failed to update user presence' }, { status: 500 })
    }

    // Get the updated presence
    const { data: updatedPresence, error: getPresenceError } = await supabase
      .from('user_presence')
      .select(`
        user_id,
        cursor_position,
        current_tool,
        is_active,
        last_seen,
        session_id,
        user:profiles!user_presence_user_id_fkey(id, name, avatar_url)
      `)
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .eq('session_id', validatedData.session_id)
      .single()

    if (getPresenceError) {
      console.error('Error fetching updated presence:', getPresenceError)
      return NextResponse.json({ error: 'Failed to fetch updated presence' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedPresence })

  } catch (error) {
    console.error('Error in POST /api/study-boards/[id]/presence:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boardId = params.id
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id') || 'default'

    // Remove user presence for the specific session
    const { error: deleteError } = await supabase
      .from('user_presence')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .eq('session_id', sessionId)

    if (deleteError) {
      console.error('Error removing user presence:', deleteError)
      return NextResponse.json({ error: 'Failed to remove user presence' }, { status: 500 })
    }

    return NextResponse.json({ message: 'User presence removed successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/study-boards/[id]/presence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}