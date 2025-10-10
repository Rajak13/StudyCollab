import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const updateElementSchema = z.object({
  element_type: z.enum(['text', 'drawing', 'sticky', 'shape']).optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  properties: z.record(z.unknown()).optional(),
  layer_index: z.number().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; elementId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, elementId } = params

    // Check if user has access to the board and get the element
    const { data: element, error: elementError } = await supabase
      .from('canvas_elements')
      .select(`
        *,
        creator:profiles!canvas_elements_created_by_fkey(id, name, avatar_url),
        board:study_boards!inner(
          id,
          group:study_groups!inner(
            id,
            group_members!inner(user_id)
          )
        )
      `)
      .eq('id', elementId)
      .eq('board_id', boardId)
      .eq('board.group.group_members.user_id', user.id)
      .single()

    if (elementError || !element) {
      return NextResponse.json({ error: 'Element not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ data: element })

  } catch (error) {
    console.error('Error in GET /api/study-boards/[id]/elements/[elementId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; elementId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, elementId } = params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateElementSchema.parse(body)

    // Check if user has edit permissions for the board and element exists
    const { data: element, error: elementError } = await supabase
      .from('canvas_elements')
      .select(`
        *,
        board:study_boards!inner(
          id,
          created_by,
          group:study_groups!inner(
            id,
            group_members!inner(user_id, role)
          )
        )
      `)
      .eq('id', elementId)
      .eq('board_id', boardId)
      .eq('board.group.group_members.user_id', user.id)
      .single()

    if (elementError || !element) {
      return NextResponse.json({ error: 'Element not found or access denied' }, { status: 404 })
    }

    // Check permissions
    const { data: permission } = await supabase
      .from('board_permissions')
      .select('permission_level')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    const hasEditPermission = 
      element.created_by === user.id ||
      element.board.created_by === user.id ||
      element.board.group.group_members.role === 'OWNER' ||
      element.board.group.group_members.role === 'ADMIN' ||
      permission?.permission_level === 'EDIT' ||
      permission?.permission_level === 'ADMIN'

    if (!hasEditPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this element' }, { status: 403 })
    }

    // Update the canvas element
    const updateData = {
      ...validatedData,
      updated_by: user.id
    }

    const { data: updatedElement, error: updateError } = await supabase
      .from('canvas_elements')
      .update(updateData)
      .eq('id', elementId)
      .select(`
        *,
        creator:profiles!canvas_elements_created_by_fkey(id, name, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating canvas element:', updateError)
      return NextResponse.json({ error: 'Failed to update canvas element' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedElement })

  } catch (error) {
    console.error('Error in PUT /api/study-boards/[id]/elements/[elementId]:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; elementId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, elementId } = params

    // Check if user has delete permissions for the element
    const { data: element, error: elementError } = await supabase
      .from('canvas_elements')
      .select(`
        *,
        board:study_boards!inner(
          id,
          created_by,
          group:study_groups!inner(
            id,
            group_members!inner(user_id, role)
          )
        )
      `)
      .eq('id', elementId)
      .eq('board_id', boardId)
      .eq('board.group.group_members.user_id', user.id)
      .single()

    if (elementError || !element) {
      return NextResponse.json({ error: 'Element not found or access denied' }, { status: 404 })
    }

    // Check permissions
    const { data: permission } = await supabase
      .from('board_permissions')
      .select('permission_level')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    const hasDeletePermission = 
      element.created_by === user.id ||
      element.board.created_by === user.id ||
      element.board.group.group_members.role === 'OWNER' ||
      element.board.group.group_members.role === 'ADMIN' ||
      permission?.permission_level === 'ADMIN'

    if (!hasDeletePermission) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this element' }, { status: 403 })
    }

    // Delete the canvas element
    const { error: deleteError } = await supabase
      .from('canvas_elements')
      .delete()
      .eq('id', elementId)

    if (deleteError) {
      console.error('Error deleting canvas element:', deleteError)
      return NextResponse.json({ error: 'Failed to delete canvas element' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Element deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/study-boards/[id]/elements/[elementId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}