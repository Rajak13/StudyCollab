import { createApiSupabaseClient } from '@/lib/supabase'
import { taskCategorySchema } from '@/lib/validations/tasks'
import type { ApiResponse, TaskCategory } from '@/types/database'
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

    // Fetch categories
    const { data: categories, error } = await supabase
      .from('task_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error('Error fetching task categories:', error)
      return NextResponse.json(
        { data: [], error: 'Failed to fetch task categories' },
        { status: 500 }
      )
    }

    const response: ApiResponse<TaskCategory[]> = {
      data: categories || [],
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/task-categories:', error)
    return NextResponse.json(
      { data: [], error: 'Internal server error' },
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
    const validatedData = taskCategorySchema.parse(body)

    // Create category
    const { data: category, error } = await supabase
      .from('task_categories')
      .insert([
        {
          ...validatedData,
          user_id: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating task category:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to create task category' },
        { status: 500 }
      )
    }

    const response: ApiResponse<TaskCategory> = {
      data: category,
      error: null,
      message: 'Task category created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/task-categories:', error)
    
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