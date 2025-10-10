import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Type definitions for the RPC function response
interface BoardWithElementsResponse {
  board_data: {
    id: string
    group_id: string
    name: string
    description?: string
    canvas_data: Record<string, unknown>
    template_type?: string
    settings: {
      width: number
      height: number
      backgroundColor: string
      gridEnabled: boolean
      snapToGrid: boolean
      gridSize: number
    }
    version: number
    created_by?: string
    created_at: string
    updated_at: string
    last_modified_by?: string
    last_modified_at: string
  }
  elements_data: Array<{
    id: string
    board_id: string
    element_type: 'text' | 'drawing' | 'sticky' | 'shape'
    position: { x: number; y: number }
    properties: Record<string, unknown>
    layer_index: number
    created_by?: string
    created_at: string
    updated_at: string
    updated_by?: string
  }>
}

// Validation schemas
const updateBoardSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  canvas_data: z.record(z.unknown()).optional(),
  template_type: z.string().max(50).optional(),
  settings: z.object({
    width: z.number().min(100).max(10000).optional(),
    height: z.number().min(100).max(10000).optional(),
    backgroundColor: z.string().optional(),
    gridEnabled: z.boolean().optional(),
    snapToGrid: z.boolean().optional(),
    gridSize: z.number().min(1).max(100).optional()
  }).optional()
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

    // Get board with elements using the database function
    const { data: boardData, error } = await supabase
      .rpc('get_board_with_elements', { p_board_id: boardId })
      .single()

    if (error) {
      console.error('Error fetching study board:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch study board' }, { status: 500 })
    }

    if (!boardData) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Type assertion for the RPC response
    const typedBoardData = boardData as BoardWithElementsResponse

    // Get board permissions for the user
    const { data: permission } = await supabase
      .from('board_permissions')
      .select('permission_level')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    // Get active presence
    const { data: presence } = await supabase
      .from('user_presence')
      .select(`
        user_id,
        cursor_position,
        current_tool,
        is_active,
        last_seen,
        user:profiles!user_presence_user_id_fkey(id, name, avatar_url)
      `)
      .eq('board_id', boardId)
      .eq('is_active', true)

    const response = {
      board: typedBoardData.board_data,
      elements: typedBoardData.elements_data,
      user_permission: permission?.permission_level || 'VIEW',
      active_presence: presence || []
    }

    return NextResponse.json({ data: response })

  } catch (error) {
    console.error('Error in GET /api/study-boards/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const validatedData = updateBoardSchema.parse(body)

    // Check if user has edit permissions
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        *,
        group:study_groups!inner(id),
        group_members!inner(user_id, role)
      `)
      .eq('id', boardId)
      .eq('group_members.user_id', user.id)
      .single()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 })
    }

    // Check permissions
    const { data: permission } = await supabase
      .from('board_permissions')
      .select('permission_level')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    const hasEditPermission =
      board.created_by === user.id ||
      board.group_members.role === 'OWNER' ||
      board.group_members.role === 'ADMIN' ||
      permission?.permission_level === 'EDIT' ||
      permission?.permission_level === 'ADMIN'

    if (!hasEditPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this board' }, { status: 403 })
    }

    // Update the board
    const updateData = {
      ...validatedData,
      last_modified_by: user.id,
      last_modified_at: new Date().toISOString()
    }

    const { data: updatedBoard, error: updateError } = await supabase
      .from('study_boards')
      .update(updateData)
      .eq('id', boardId)
      .select(`
        *,
        group:study_groups(id, name, subject),
        creator:profiles!study_boards_created_by_fkey(id, name, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating study board:', updateError)
      return NextResponse.json({ error: 'Failed to update study board' }, { status: 500 })
    }

    // Log the change
    await supabase
      .from('board_changes')
      .insert([{
        board_id: boardId,
        change_type: 'board_update',
        change_data: validatedData,
        user_id: user.id,
        version: updatedBoard.version
      }])

    return NextResponse.json({ data: updatedBoard })

  } catch (error) {
    console.error('Error in PUT /api/study-boards/[id]:', error)
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

    // Check if user has delete permissions
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        *,
        group:study_groups!inner(id),
        group_members!inner(user_id, role)
      `)
      .eq('id', boardId)
      .eq('group_members.user_id', user.id)
      .single()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 })
    }

    // Check permissions
    const { data: permission } = await supabase
      .from('board_permissions')
      .select('permission_level')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    const hasDeletePermission =
      board.created_by === user.id ||
      board.group_members.role === 'OWNER' ||
      board.group_members.role === 'ADMIN' ||
      permission?.permission_level === 'ADMIN'

    if (!hasDeletePermission) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this board' }, { status: 403 })
    }

    // Delete the board (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('study_boards')
      .delete()
      .eq('id', boardId)

    if (deleteError) {
      console.error('Error deleting study board:', deleteError)
      return NextResponse.json({ error: 'Failed to delete study board' }, { status: 500 })
    }

    // Log group activity
    await supabase.rpc('log_group_activity', {
      p_group_id: board.group_id,
      p_user_id: user.id,
      p_activity_type: 'BOARD_DELETED',
      p_activity_data: { board_id: boardId, board_name: board.name }
    })

    return NextResponse.json({ message: 'Board deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/study-boards/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}