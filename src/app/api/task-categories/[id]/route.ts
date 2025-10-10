import { createApiSupabaseClient } from '@/lib/supabase'
import { updateTaskCategorySchema } from '@/lib/validations/tasks'
import type { ApiResponse, TaskCategory } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createApiSupabaseClient(request)

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateTaskCategorySchema.parse(body)

    // Update category
    const { id } = await params
    const { data: category, error } = await supabase
      .from('task_categories')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Task category not found' },
          { status: 404 }
        )
      }

      console.error('Error updating task category:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to update task category' },
        { status: 500 }
      )
    }

    const response: ApiResponse<TaskCategory> = {
      data: category,
      error: null,
      message: 'Task category updated successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PUT /api/task-categories/[id]:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createApiSupabaseClient(request)

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if category has tasks
    const { id } = await params
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', user.id)
      .limit(1)

    if (tasksError) {
      console.error('Error checking tasks for category:', tasksError)
      return NextResponse.json(
        { data: null, error: 'Failed to check category usage' },
        { status: 500 }
      )
    }

    if (tasks && tasks.length > 0) {
      return NextResponse.json(
        { data: null, error: 'Cannot delete category that contains tasks' },
        { status: 400 }
      )
    }

    // Delete category
    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting task category:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to delete task category' },
        { status: 500 }
      )
    }

    const response: ApiResponse<null> = {
      data: null,
      error: null,
      message: 'Task category deleted successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in DELETE /api/task-categories/[id]:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
