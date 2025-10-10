import { z } from 'zod'

// Task validation schemas
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('TODO'),
  due_date: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').default([]),
  category_id: z.string().uuid().optional(),
})

export const updateTaskSchema = taskSchema.partial().extend({
  completed_at: z.string().datetime().optional(),
})

export const taskFiltersSchema = z.object({
  status: z.array(z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])).optional(),
  priority: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])).optional(),
  category_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  due_date_from: z.string().datetime().optional(),
  due_date_to: z.string().datetime().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'due_date', 'priority', 'title']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Task category validation schemas
export const taskCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .default('#3B82F6'),
})

export const updateTaskCategorySchema = taskCategorySchema.partial()

// Quick action schemas
export const completeTaskSchema = z.object({
  completed_at: z.string().datetime().optional(),
})

export const bulkTaskActionSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1, 'At least one task ID is required'),
  action: z.enum(['complete', 'delete', 'update_status', 'update_priority']),
  data: z.record(z.any()).optional(),
})

// Export types
export type TaskFormData = z.infer<typeof taskSchema>
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>
export type TaskFiltersData = z.infer<typeof taskFiltersSchema>
export type TaskCategoryFormData = z.infer<typeof taskCategorySchema>
export type UpdateTaskCategoryFormData = z.infer<typeof updateTaskCategorySchema>
export type BulkTaskActionData = z.infer<typeof bulkTaskActionSchema>