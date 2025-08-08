import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const changesFiltersSchema = z.object({
  element_id: z.string().uuid().optional(),
  change_type: z.enum(['add', 'update', 'delete', 'board_update']).optional(),
  user_id: z.string().uuid().optional(),
  from_version: z.coerce.number().min(1).optional(),
  to_version: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0)
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = changesFiltersSchema.parse({
      element_id: searchParams.get('element_id'),
      change_type: searchParams.get('change_type'),
      user_id: searchParams.get('user_id'),
      from_version: searchParams.get('from_version'),
      to_version: searchParams.get('to_version'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    })

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

    // Build query for board changes
    let query = supabase
      .from('board_changes')
      .select(`
        *,
        user:profiles!board_changes_user_id_fkey(id, name, avatar_url),
        element:canvas_elements(id, element_type)
      `)
      .eq('board_id', boardId)

    // Apply filters
    if (filters.element_id) {
      query = query.eq('element_id', filters.element_id)
    }

    if (filters.change_type) {
      query = query.eq('change_type', filters.change_type)
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters.from_version) {
      query = query.gte('version', filters.from_version)
    }

    if (filters.to_version) {
      query = query.lte('version', filters.to_version)
    }

    // Apply ordering and pagination
    query = query
      .order('timestamp', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1)

    const { data: changes, error: changesError, count } = await query

    if (changesError) {
      console.error('Error fetching board changes:', changesError)
      return NextResponse.json({ error: 'Failed to fetch board changes' }, { status: 500 })
    }

    return NextResponse.json({
      data: changes || [],
      pagination: {
        offset: filters.offset,
        limit: filters.limit,
        total: count || 0,
        hasMore: (count || 0) > filters.offset + filters.limit
      }
    })

  } catch (error) {
    console.error('Error in GET /api/study-boards/[id]/changes:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}