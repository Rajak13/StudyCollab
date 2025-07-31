import { FileType } from '@/types/database'
import { supabase } from './supabase'

// Normalize MIME type based on file extension for files that browsers might not detect correctly
export function normalizeMimeType(file: File): string {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'))

  // Override browser MIME type for specific extensions
  switch (extension) {
    case '.md':
    case '.markdown':
      return 'text/markdown'
    case '.txt':
      return 'text/plain'
    case '.csv':
      return 'text/csv'
    default:
      return file.type || 'application/octet-stream'
  }
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  success: boolean
  file_path?: string
  file_url?: string
  error?: string
}

// File type detection based on MIME type and filename
export function getFileType(mimeType: string, fileName?: string): FileType {
  // Check by file extension first for markdown files
  if (fileName) {
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'))
    if (extension === '.md' || extension === '.markdown') return 'DOCUMENT'
  }

  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('text') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType === 'text/markdown'
  )
    return 'DOCUMENT'
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip')
  )
    return 'ARCHIVE'
  return 'OTHER'
}

// Validate file before upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 100 * 1024 * 1024 // 100MB
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    // Audio
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip',
  ]

  // Check for .md files specifically (sometimes browsers don't set correct MIME type)
  const allowedExtensions = ['.md', '.markdown']
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'))

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 100MB' }
  }

  // Allow if MIME type is in allowed list OR if it's a markdown file
  if (
    !allowedTypes.includes(file.type) &&
    !allowedExtensions.includes(fileExtension)
  ) {
    return { valid: false, error: 'File type not supported' }
  }

  return { valid: true }
}

// Generate unique file path
export function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${userId}/${timestamp}_${randomString}_${cleanName}`
}

// Upload file to Supabase Storage
export async function uploadFile(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate file path
    const filePath = generateFilePath(userId, file.name)

    // Normalize MIME type for better compatibility
    const normalizedMimeType = normalizeMimeType(file)

    // Create a new File object with the correct MIME type if needed
    const fileToUpload =
      file.type !== normalizedMimeType
        ? new File([file], file.name, { type: normalizedMimeType })
        : file

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('files')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    return {
      success: true,
      file_path: filePath,
      file_url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

// Delete file from Supabase Storage
export async function deleteFile(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from('files').remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get file icon based on type
export function getFileIcon(fileType: FileType): string {
  switch (fileType) {
    case 'PDF':
      return '📄'
    case 'IMAGE':
      return '🖼️'
    case 'VIDEO':
      return '🎥'
    case 'AUDIO':
      return '🎵'
    case 'DOCUMENT':
      return '📝'
    case 'ARCHIVE':
      return '📦'
    default:
      return '📁'
  }
}

// Check if file can be previewed
export function canPreviewFile(mimeType: string): boolean {
  const previewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'text/markdown',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
  ]

  return previewableTypes.includes(mimeType)
}
