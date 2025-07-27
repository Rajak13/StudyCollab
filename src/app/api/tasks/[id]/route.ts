import { createApiSupabaseClient } from '@/lib/supabase'
import { updateTaskSchema } from '@/lib/validations/tasks'
import type { ApiResponse, Task } from '@/types/database'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch task
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:task_categories(id, name, color)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Task not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching task:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch task' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Task> = {
      data: task,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )
    
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
    const validatedData = updateTaskSchema.parse(body)

    // Handle task completion
    if (validatedData.status === 'COMPLETED' && !validatedData.completed_at) {
      validatedData.completed_at = new Date().toISOString()
    } else if (validatedData.status !== 'COMPLETED') {
      validatedData.completed_at = undefined
    }

    // Update task
    const { data: task, error } = await supabase
      .from('tasks')
      .update(validatedData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select(`
        *,
        category:task_categories(id, name, color)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Task not found' },
          { status: 404 }
        )
      }
      
      console.error('Error updating task:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to update task' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Task> = {
      data: task,
      error: null,
      message: 'Task updated successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PUT /api/tasks/[id]:', error)
    
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting task:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    const response: ApiResponse<null> = {
      data: null,
      error: null,
      message: 'Task deleted successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}