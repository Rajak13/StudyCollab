import { z } from 'zod'

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.any().refine(
    (content) => content && typeof content === 'object',
    'Content must be a valid JSON object'
  ),
  summary: z.string().max(500, 'Summary too long').optional(),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  is_public: z.boolean().optional(),
  template: z.enum(['basic', 'cornell', 'mindmap']).optional(),
  folder_id: z.string().uuid().optional(),
})

export const updateNoteSchema = noteSchema.partial()

export const noteFiltersSchema = z.object({
  folder_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  search: z.string().optional(),
})

export type NoteFormData = z.infer<typeof noteSchema>
export type UpdateNoteFormData = z.infer<typeof updateNoteSchema>
export type NoteFiltersData = z.infer<typeof noteFiltersSchema>