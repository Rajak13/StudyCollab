import { z } from 'zod'

// Point validation
export const pointSchema = z.object({
  x: z.number(),
  y: z.number()
})

// Board settings validation
export const boardSettingsSchema = z.object({
  width: z.number().min(100).max(10000).default(1920),
  height: z.number().min(100).max(10000).default(1080),
  backgroundColor: z.string().default('#ffffff'),
  gridEnabled: z.boolean().default(true),
  snapToGrid: z.boolean().default(false),
  gridSize: z.number().min(1).max(100).default(20)
})

// Study board validation schemas
export const createStudyBoardSchema = z.object({
  group_id: z.string().uuid('Invalid group ID'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').default('Study Board'),
  description: z.string().max(1000, 'Description too long').optional(),
  template_type: z.string().max(50, 'Template type too long').optional(),
  settings: boardSettingsSchema.partial().optional()
})

export const updateStudyBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  canvas_data: z.record(z.unknown()).optional(),
  template_type: z.string().max(50, 'Template type too long').optional(),
  settings: boardSettingsSchema.partial().optional()
})

// Canvas element validation schemas
export const createCanvasElementSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  element_type: z.enum(['text', 'drawing', 'sticky', 'shape'], {
    errorMap: () => ({ message: 'Invalid element type' })
  }),
  position: pointSchema,
  properties: z.record(z.unknown()),
  layer_index: z.number().int().min(0).default(0)
})

export const updateCanvasElementSchema = z.object({
  element_type: z.enum(['text', 'drawing', 'sticky', 'shape']).optional(),
  position: pointSchema.optional(),
  properties: z.record(z.unknown()).optional(),
  layer_index: z.number().int().min(0).optional()
})

// Text element properties validation
export const textElementPropertiesSchema = z.object({
  text: z.string(),
  fontSize: z.number().min(8).max(72).default(16),
  fontFamily: z.string().default('Arial'),
  color: z.string().default('#000000'),
  width: z.number().min(10).optional(),
  height: z.number().min(10).optional()
})

// Drawing element properties validation
export const drawingElementPropertiesSchema = z.object({
  path: z.string(),
  strokeWidth: z.number().min(1).max(20).default(2),
  strokeColor: z.string().default('#000000'),
  fill: z.string().optional()
})

// Sticky note element properties validation
export const stickyElementPropertiesSchema = z.object({
  text: z.string(),
  color: z.string().default('#ffeb3b'),
  width: z.number().min(50).max(500).default(200),
  height: z.number().min(50).max(500).default(200),
  fontSize: z.number().min(8).max(24).default(14)
})

// Shape element properties validation
export const shapeElementPropertiesSchema = z.object({
  shapeType: z.enum(['rectangle', 'circle', 'triangle', 'line']),
  width: z.number().min(10).max(1000),
  height: z.number().min(10).max(1000),
  fill: z.string().optional(),
  stroke: z.string().default('#000000'),
  strokeWidth: z.number().min(1).max(20).default(2)
})

// User presence validation schemas
export const updateUserPresenceSchema = z.object({
  cursor_position: pointSchema.nullable().optional(),
  current_tool: z.string().max(50).nullable().optional(),
  session_id: z.string().max(255).default('default')
})

// Board permission validation schemas
export const createBoardPermissionSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  user_id: z.string().uuid('Invalid user ID'),
  permission_level: z.enum(['VIEW', 'EDIT', 'ADMIN'], {
    errorMap: () => ({ message: 'Invalid permission level' })
  })
})

export const updateBoardPermissionSchema = z.object({
  permission_level: z.enum(['VIEW', 'EDIT', 'ADMIN'], {
    errorMap: () => ({ message: 'Invalid permission level' })
  })
})

// Bulk operations validation
export const bulkUpdateElementsSchema = z.object({
  elements: z.array(
    z.object({
      id: z.string().uuid('Invalid element ID'),
      element_type: z.enum(['text', 'drawing', 'sticky', 'shape']).optional(),
      position: pointSchema.optional(),
      properties: z.record(z.unknown()).optional(),
      layer_index: z.number().int().min(0).optional()
    })
  ).min(1, 'At least one element is required').max(100, 'Too many elements')
})

// Filter validation schemas
export const studyBoardFiltersSchema = z.object({
  group_id: z.string().uuid().optional(),
  template_type: z.array(z.string()).optional(),
  created_by: z.string().uuid().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'last_modified_at']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export const changesFiltersSchema = z.object({
  element_id: z.string().uuid().optional(),
  change_type: z.enum(['add', 'update', 'delete', 'board_update']).optional(),
  user_id: z.string().uuid().optional(),
  from_version: z.coerce.number().min(1).optional(),
  to_version: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
})

// Element properties validation based on type
export function validateElementProperties(elementType: string, properties: unknown) {
  switch (elementType) {
    case 'text':
      return textElementPropertiesSchema.parse(properties)
    case 'drawing':
      return drawingElementPropertiesSchema.parse(properties)
    case 'sticky':
      return stickyElementPropertiesSchema.parse(properties)
    case 'shape':
      return shapeElementPropertiesSchema.parse(properties)
    default:
      throw new Error(`Unknown element type: ${elementType}`)
  }
}

// Form validation schemas for frontend
export const studyBoardFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  template_type: z.string().max(50, 'Template type too long').optional(),
  settings: z.object({
    width: z.coerce.number().min(100).max(10000).optional(),
    height: z.coerce.number().min(100).max(10000).optional(),
    backgroundColor: z.string().optional(),
    gridEnabled: z.boolean().optional(),
    snapToGrid: z.boolean().optional(),
    gridSize: z.coerce.number().min(1).max(100).optional()
  }).optional()
})

export const permissionFormSchema = z.object({
  user_id: z.string().uuid('Please select a valid user'),
  permission_level: z.enum(['VIEW', 'EDIT', 'ADMIN'], {
    errorMap: () => ({ message: 'Please select a permission level' })
  })
})

// Type exports for TypeScript
export type CreateStudyBoardInput = z.infer<typeof createStudyBoardSchema>
export type UpdateStudyBoardInput = z.infer<typeof updateStudyBoardSchema>
export type CreateCanvasElementInput = z.infer<typeof createCanvasElementSchema>
export type UpdateCanvasElementInput = z.infer<typeof updateCanvasElementSchema>
export type UpdateUserPresenceInput = z.infer<typeof updateUserPresenceSchema>
export type CreateBoardPermissionInput = z.infer<typeof createBoardPermissionSchema>
export type UpdateBoardPermissionInput = z.infer<typeof updateBoardPermissionSchema>
export type StudyBoardFiltersInput = z.infer<typeof studyBoardFiltersSchema>
export type StudyBoardFormInput = z.infer<typeof studyBoardFormSchema>
export type PermissionFormInput = z.infer<typeof permissionFormSchema>
export type TextElementProperties = z.infer<typeof textElementPropertiesSchema>
export type DrawingElementProperties = z.infer<typeof drawingElementPropertiesSchema>
export type StickyElementProperties = z.infer<typeof stickyElementPropertiesSchema>
export type ShapeElementProperties = z.infer<typeof shapeElementPropertiesSchema>