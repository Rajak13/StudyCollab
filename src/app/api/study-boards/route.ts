import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createBoardSchema = z.object({
  group_id: z.string().uuid(),
  name: z.string().min(1).max(255).optional().default('Study Board'),
  description: z.string().max(1000).optional(),
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

const filtersSchema = z.object({
  group_id: z.string().uuid().optional(),
  template_type: z.array(z.string()).optional(),
  created_by: z.string().uuid().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'last_modified_at']).optional().default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20)
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = filtersSchema.parse({
      group_id: searchParams.get('group_id'),
      template_type: searchParams.get('template_type')?.split(','),
      created_by: searchParams.get('created_by'),
      search: searchParams.get('search'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    // Build query
    let query = supabase
      .from('study_boards')
      .select(`
        *,
        group:study_groups(id, name, subject),
        creator:profiles!study_boards_created_by_fkey(id, name, avatar_url),
        element_count:canvas_elements(count),
        active_users:user_presence(user_id)
      `)

    // Apply filters
    if (filters.group_id) {
      query = query.eq('group_id', filters.group_id)
    }

    if (filters.template_type && filters.template_type.length > 0) {
      query = query.in('template_type', filters.template_type)
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    const { data: boards, error, count } = await query

    if (error) {
      console.error('Error fetching study boards:', error)
      return NextResponse.json({ error: 'Failed to fetch study boards' }, { status: 500 })
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / filters.limit) : 0

    return NextResponse.json({
      data: boards || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error in GET /api/study-boards:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createBoardSchema.parse(body)

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', validatedData.group_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'You must be a member of this group to create a board' }, { status: 403 })
    }

    // Create the study board
    const boardData = {
      ...validatedData,
      created_by: user.id
    }

    const { data: board, error: createError } = await supabase
      .from('study_boards')
      .insert([boardData])
      .select(`
        *,
        group:study_groups(id, name, subject),
        creator:profiles!study_boards_created_by_fkey(id, name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating study board:', createError)
      return NextResponse.json({ error: 'Failed to create study board' }, { status: 500 })
    }

    // Log group activity
    await supabase.rpc('log_group_activity', {
      p_group_id: validatedData.group_id,
      p_user_id: user.id,
      p_activity_type: 'BOARD_CREATED',
      p_activity_data: { board_id: board.id, board_name: board.name }
    })

    return NextResponse.json({ data: board }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/study-boards:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}