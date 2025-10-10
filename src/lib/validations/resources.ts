import { ResourceType } from '@/types/database'
import { z } from 'zod'

// Resource validation schemas
export const createResourceSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  type: z.enum([
    'PDF',
    'DOCX',
    'PPT',
    'VIDEO',
    'LINK',
    'IMAGE',
    'OTHER',
  ] as const),
  file_url: z.string().url('Invalid file URL').optional(),
  file_size: z.number().positive('File size must be positive').optional(),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(100, 'Subject must be less than 100 characters'),
  course_code: z
    .string()
    .max(20, 'Course code must be less than 20 characters')
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
})

export const updateResourceSchema = createResourceSchema.partial()

export const resourceFiltersSchema = z.object({
  type: z
    .array(
      z.enum(['PDF', 'DOCX', 'PPT', 'VIDEO', 'LINK', 'IMAGE', 'OTHER'] as const)
    )
    .optional(),
  subject: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  is_verified: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['recent', 'popular', 'score']).default('recent'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  subject: z.string().min(1, 'Subject is required'),
  course_code: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  PDF: ['application/pdf'],
  DOCX: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  PPT: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ],
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  OTHER: [], // Will be determined dynamically
} as const

// Maximum file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024

// Function to determine resource type from MIME type
export function getResourceTypeFromMimeType(mimeType: string): ResourceType {
  for (const [type, mimeTypes] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if ((mimeTypes as readonly string[]).includes(mimeType)) {
      return type as ResourceType
    }
  }
  return 'OTHER'
}

// Function to validate file type
export function validateFileType(file: File): {
  isValid: boolean
  type: ResourceType
  error?: string
} {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      type: 'OTHER',
      error: 'File size must be less than 50MB',
    }
  }

  const resourceType = getResourceTypeFromMimeType(file.type)

  // Check if it's a supported type
  const allSupportedTypes = Object.values(
    SUPPORTED_FILE_TYPES
  ).flat() as string[]
  if (!allSupportedTypes.includes(file.type) && resourceType === 'OTHER') {
    // Allow OTHER type but warn about potential issues
    console.warn(`Unsupported file type: ${file.type}`)
  }

  return {
    isValid: true,
    type: resourceType,
  }
}

export type CreateResourceFormData = z.infer<typeof createResourceSchema>
export type UpdateResourceFormData = z.infer<typeof updateResourceSchema>
export type ResourceFiltersData = z.infer<typeof resourceFiltersSchema>
export type FileUploadFormData = z.infer<typeof fileUploadSchema>
