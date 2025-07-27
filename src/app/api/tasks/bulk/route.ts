import { createApiSupabaseClient } from '@/lib/supabase'
import { updateTaskSchema } from '@/lib/validations/tasks'
import type { ApiResponse } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bulkUpdateSchema = z.object({
  task_ids: z.array(z.string().uuid()),
  updates: updateTaskSchema.partial(),
})

const bulkDeleteSchema = z.object({
  task_ids: z.array(z.string().uuid()),
})

export async function PUT(request: NextRequest) {
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
    const { task_ids, updates } = bulkUpdateSchema.parse(body)

    if (task_ids.length === 0) {
      return NextResponse.json(
        { data: null, error: 'No tasks specified' },
        { status: 400 }
      )
    }

    // Update tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('user_id', user.id)
      .in('id', task_ids)
      .select(`
        *,
        category:task_categories(id, name, color)
      `)

    if (error) {
      console.error('Error updating tasks:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to update tasks' },
        { status: 500 }
      )
    }

    const response: ApiResponse<typeof tasks> = {
      data: tasks,
      error: null,
      message: `Updated ${tasks?.length || 0} task${tasks?.length !== 1 ? 's' : ''}`,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PUT /api/tasks/bulk:', error)
    
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

export async function DELETE(request: NextRequest) {
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
    const { task_ids } = bulkDeleteSchema.parse(body)

    if (task_ids.length === 0) {
      return NextResponse.json(
        { data: null, error: 'No tasks specified' },
        { status: 400 }
      )
    }

    // Delete tasks
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user.id)
      .in('id', task_ids)

    if (error) {
      console.error('Error deleting tasks:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to delete tasks' },
        { status: 500 }
      )
    }

    const response: ApiResponse<null> = {
      data: null,
      error: null,
      message: `Deleted ${task_ids.length} task${task_ids.length !== 1 ? 's' : ''}`,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in DELETE /api/tasks/bulk:', error)
    
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