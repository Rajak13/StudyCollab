import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Type for board with group members
interface BoardWithGroup {
  id: string;
  created_by?: string;
  group: {
    id: string;
    group_members: Array<{
      user_id: string;
      role: string;
    }>;
  };
}

// Validation schemas
const createPermissionSchema = z.object({
  user_id: z.string().uuid(),
  permission_level: z.enum(['VIEW', 'EDIT', 'ADMIN'])
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

    // Check if user has access to view permissions
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

    // Get board permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('board_permissions')
      .select(`
        *,
        user:profiles!board_permissions_user_id_fkey(id, name, avatar_url),
        granter:profiles!board_permissions_granted_by_fkey(id, name, avatar_url)
      `)
      .eq('board_id', boardId)
      .order('granted_at', { ascending: false })

    if (permissionsError) {
      console.error('Error fetching board permissions:', permissionsError)
      return NextResponse.json({ error: 'Failed to fetch board permissions' }, { status: 500 })
    }

    return NextResponse.json({ data: permissions || [] })

  } catch (error) {
    console.error('Error in GET /api/study-boards/[id]/permissions:', error)
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
    const validatedData = createPermissionSchema.parse(body)

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

    // Check if target user is a member of the group
    const { data: targetMembership, error: membershipError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', board.group.id)
      .eq('user_id', validatedData.user_id)
      .single()

    if (membershipError || !targetMembership) {
      return NextResponse.json({ error: 'Target user is not a member of this group' }, { status: 400 })
    }

    // Check permissions
    const { data: permission } = await supabase
      .from('board_permissions')
      .select('permission_level')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    const isGroupAdmin = board.group.group_members.some(m => m.user_id === user.id && (m.role === 'OWNER' || m.role === 'ADMIN'))
    const hasAdminPermission = 
      board.created_by === user.id ||
      isGroupAdmin ||
      permission?.permission_level === 'ADMIN'

    if (!hasAdminPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to manage board permissions' }, { status: 403 })
    }

    // Create or update the permission
    const permissionData = {
      ...validatedData,
      board_id: boardId,
      granted_by: user.id
    }

    const { data: newPermission, error: createError } = await supabase
      .from('board_permissions')
      .upsert([permissionData], { 
        onConflict: 'board_id,user_id',
        ignoreDuplicates: false 
      })
      .select(`
        *,
        user:profiles!board_permissions_user_id_fkey(id, name, avatar_url),
        granter:profiles!board_permissions_granted_by_fkey(id, name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating board permission:', createError)
      return NextResponse.json({ error: 'Failed to create board permission' }, { status: 500 })
    }

    return NextResponse.json({ data: newPermission }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/study-boards/[id]/permissions:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}