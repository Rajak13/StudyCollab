import { z } from 'zod'

export const createStudyGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(255, 'Group name must be less than 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  subject: z
    .string()
    .max(100, 'Subject must be less than 100 characters')
    .optional(),
  university: z
    .string()
    .max(255, 'University name must be less than 255 characters')
    .optional(),
  is_private: z.boolean().default(false),
})

export const updateStudyGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(255, 'Group name must be less than 255 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  subject: z
    .string()
    .max(100, 'Subject must be less than 100 characters')
    .optional(),
  university: z
    .string()
    .max(255, 'University name must be less than 255 characters')
    .optional(),
  is_private: z.boolean().optional(),
})

export const joinGroupSchema = z.object({
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
})

export const studyGroupFiltersSchema = z.object({
  subject: z.array(z.string()).optional(),
  university: z.array(z.string()).optional(),
  is_private: z.boolean().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'member_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export type CreateStudyGroupFormData = z.infer<typeof createStudyGroupSchema>
export type UpdateStudyGroupFormData = z.infer<typeof updateStudyGroupSchema>
export type JoinGroupFormData = z.infer<typeof joinGroupSchema>
export type StudyGroupFiltersData = z.infer<typeof studyGroupFiltersSchema>
