import { createApiSupabaseClient } from '@/lib/supabase'
import { taskFiltersSchema, taskSchema } from '@/lib/validations/tasks'
import type { ApiResponse, PaginatedResponse, Task } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiSupabaseClient(request)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters = taskFiltersSchema.parse({
      status: searchParams.get('status')?.split(','),
      priority: searchParams.get('priority')?.split(','),
      category_id: searchParams.get('category_id') || undefined,
      tags: searchParams.get('tags')?.split(','),
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    })

    // Build query
    let query = supabase
      .from('tasks')
      .select(`
        *,
        category:task_categories(id, name, color)
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }

    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    const { data: tasks, error, count } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json(
        { data: [], pagination: null, error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    const totalPages = count ? Math.ceil(count / filters.limit) : 0

    const response: PaginatedResponse<Task> = {
      data: tasks || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages,
      },
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/tasks:', error)
    return NextResponse.json(
      { data: [], pagination: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiSupabaseClient(request)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = taskSchema.parse(body)

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          ...validatedData,
          user_id: user.id,
        },
      ])
      .select(`
        *,
        category:task_categories(id, name, color)
      `)
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to create task' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Task> = {
      data: task,
      error: null,
      message: 'Task created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/tasks:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { data: null, error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}