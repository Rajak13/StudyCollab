import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createElementSchema = z.object({
  element_type: z.enum(['text', 'drawing', 'sticky', 'shape']),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  properties: z.record(z.unknown()),
  layer_index: z.number().optional().default(0)
})

const bulkUpdateSchema = z.object({
  elements: z.array(z.object({
    id: z.string().uuid(),
    element_type: z.enum(['text', 'drawing', 'sticky', 'shape']).optional(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }).optional(),
    properties: z.record(z.unknown()).optional(),
    layer_index: z.number().optional()
  }))
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

    // Get all canvas elements for the board
    const { data: elements, error: elementsError } = await supabase
      .from('canvas_elements')
      .select(`
        *,
        creator:profiles!canvas_elements_created_by_fkey(id, name, avatar_url)
      `)
      .eq('board_id', boardId)
      .order('layer_index', { ascending: true })
      .order('created_at', { ascending: true })

    if (elementsError) {
      console.error('Error fetching canvas elements:', elementsError)
      return NextResponse.json({ error: 'Failed to fetch canvas elements' }, { status: 500 })
    }

    return NextResponse.json({ data: elements || [] })

  } catch (error) {
    console.error('Error in GET /api/study-boards/[id]/elements:', error)
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
    const validatedData = createElementSchema.parse(body)

    // Check if user has edit permissions for the board
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        id,
        created_by,
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

    // Create the canvas element
    const elementData = {
      ...validatedData,
      board_id: boardId,
      created_by: user.id
    }

    const { data: element, error: createError } = await supabase
      .from('canvas_elements')
      .insert([elementData])
      .select(`
        *,
        creator:profiles!canvas_elements_created_by_fkey(id, name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating canvas element:', createError)
      return NextResponse.json({ error: 'Failed to create canvas element' }, { status: 500 })
    }

    return NextResponse.json({ data: element }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/study-boards/[id]/elements:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
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

    // Parse and validate request body for bulk updates
    const body = await request.json()
    const validatedData = bulkUpdateSchema.parse(body)

    // Check if user has edit permissions for the board
    const { data: board, error: boardError } = await supabase
      .from('study_boards')
      .select(`
        id,
        created_by,
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

    // Perform bulk updates
    const updatedElements = []
    const errors = []

    for (const elementUpdate of validatedData.elements) {
      try {
        const updateData = {
          ...elementUpdate,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }
        delete updateData.id // Remove id from update data

        const { data: updatedElement, error: updateError } = await supabase
          .from('canvas_elements')
          .update(updateData)
          .eq('id', elementUpdate.id)
          .eq('board_id', boardId) // Ensure element belongs to this board
          .select(`
            *,
            creator:profiles!canvas_elements_created_by_fkey(id, name, avatar_url)
          `)
          .single()

        if (updateError) {
          errors.push({ element_id: elementUpdate.id, error: updateError.message })
        } else {
          updatedElements.push(updatedElement)
        }
      } catch (error) {
        errors.push({ element_id: elementUpdate.id, error: 'Update failed' })
      }
    }

    return NextResponse.json({ 
      data: updatedElements,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error in PUT /api/study-boards/[id]/elements:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}