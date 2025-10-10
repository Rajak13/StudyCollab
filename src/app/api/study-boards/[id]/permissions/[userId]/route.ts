import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';



// Validation schemas
const updatePermissionSchema = z.object({
  permission_level: z.enum(['VIEW', 'EDIT', 'ADMIN'])
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, userId } = params

    // Check if user has access to view permissions
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        id,
        group:study_groups!inner(
          id,
          group_members!inner(user_id)
        )
      `)
      .eq('id', boardId)
      .eq('group.group_members.user_id', user.id)
      .single()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 })
    }

    // Get the specific permission
    const { data: permission, error: permissionError } = await supabase
      .from('board_permissions')
      .select(`
        *,
        user:profiles!board_permissions_user_id_fkey(id, name, avatar_url),
        granter:profiles!board_permissions_granted_by_fkey(id, name, avatar_url)
      `)
      .eq('board_id', boardId)
      .eq('user_id', userId)
      .single()

    if (permissionError) {
      if (permissionError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
      }
      console.error('Error fetching board permission:', permissionError)
      return NextResponse.json({ error: 'Failed to fetch board permission' }, { status: 500 })
    }

    return NextResponse.json({ data: permission })

  } catch (error) {
    console.error('Error in GET /api/study-boards/[id]/permissions/[userId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, userId } = params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updatePermissionSchema.parse(body)

    // Check if user has admin permissions for the board
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        id,
        created_by,
        group:study_groups!inner(
          id,
          group_members!inner(user_id, role)
        )
      `)
      .eq('id', boardId)
      .eq('group.group_members.user_id', user.id)
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

    const isGroupAdmin = (board.group as any).group_members?.some((m: any) => m.user_id === user.id && (m.role === 'OWNER' || m.role === 'ADMIN')) || false
    const hasAdminPermission = 
      board.created_by === user.id ||
      isGroupAdmin ||
      permission?.permission_level === 'ADMIN'

    if (!hasAdminPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to manage board permissions' }, { status: 403 })
    }

    // Prevent users from removing their own admin permissions if they're the board creator
    if (userId === user.id && board.created_by === user.id && validatedData.permission_level !== 'ADMIN') {
      return NextResponse.json({ error: 'Board creators cannot remove their own admin permissions' }, { status: 400 })
    }

    // Update the permission
    const updateData = {
      permission_level: validatedData.permission_level
    }

    const { data: updatedPermission, error: updateError } = await supabase
      .from('board_permissions')
      .update(updateData)
      .eq('board_id', boardId)
      .eq('user_id', userId)
      .select(`
        *,
        user:profiles!board_permissions_user_id_fkey(id, name, avatar_url),
        granter:profiles!board_permissions_granted_by_fkey(id, name, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating board permission:', updateError)
      return NextResponse.json({ error: 'Failed to update board permission' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedPermission })

  } catch (error) {
    console.error('Error in PUT /api/study-boards/[id]/permissions/[userId]:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, userId } = params

    // Check if user has admin permissions for the board
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        id,
        created_by,
        group:study_groups!inner(
          id,
          group_members!inner(user_id, role)
        )
      `)
      .eq('id', boardId)
      .eq('group.group_members.user_id', user.id)
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

    const hasAdminPermission = 
      board.created_by === user.id ||
      (board.group as any).group_members?.role === 'OWNER' ||
      (board.group as any).group_members?.role === 'ADMIN' ||
      permission?.permission_level === 'ADMIN'

    if (!hasAdminPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to manage board permissions' }, { status: 403 })
    }

    // Prevent users from removing their own permissions if they're the board creator
    if (userId === user.id && board.created_by === user.id) {
      return NextResponse.json({ error: 'Board creators cannot remove their own permissions' }, { status: 400 })
    }

    // Delete the permission (this will revert to default group-based permissions)
    const { error: deleteError } = await supabase
      .from('board_permissions')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting board permission:', deleteError)
      return NextResponse.json({ error: 'Failed to delete board permission' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Permission removed successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/study-boards/[id]/permissions/[userId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}