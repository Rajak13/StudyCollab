'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { formatFileSize } from '@/lib/file-upload'
import { cn } from '@/lib/utils'
import {
  File,
  FileText,
  Image,
  Music,
  Upload,
  Video,
  X
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
// Desktop file handling hooks - fallback for web version
const useDesktopFileHandling = () => ({
  isElectron: false,
  isDragging: false,
  openFilePicker: async (_options?: any) => [],
  cacheFile: null
})

const useDesktopFileEvents = () => ({
  droppedFiles: [],
  clearDroppedFiles: () => { }
})

interface DragDropFile {
  name: string
  path: string
  size: number
  type: string
  lastModified: number
}

interface DragDropZoneProps {
  onFilesSelectedAction?: (files: DragDropFile[]) => void
  onFileUploadAction?: (file: DragDropFile, progress: number) => void
  onUploadCompleteAction?: (file: DragDropFile, success: boolean) => void
  accept?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function DragDropZone({
  onFilesSelectedAction,
  onFileUploadAction,
  onUploadCompleteAction,
  accept,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB default
  disabled = false,
  className,
  children
}: DragDropZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<DragDropFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = useState(false)

  const {
    isElectron,
    isDragging,
    openFilePicker,
    cacheFile
  } = useDesktopFileHandling()

  const { droppedFiles, clearDroppedFiles } = useDesktopFileEvents()

  // Handle dropped files from desktop
  useEffect(() => {
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
      clearDroppedFiles()
    }
  }, [droppedFiles, clearDroppedFiles])

  const validateFile = useCallback((file: DragDropFile): boolean => {
    // Check file size
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `${file.name} is ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(maxSize)}.`,
        variant: 'destructive'
      })
      return false
    }

    // Check file type if accept filter is provided
    if (accept && accept.length > 0) {
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      const isAccepted = accept.some(acceptType => {
        if (acceptType.startsWith('.')) {
          return acceptType.toLowerCase() === fileExt
        }
        if (acceptType.includes('/*')) {
          const mimeCategory = acceptType.split('/')[0]
          return file.type.startsWith(mimeCategory)
        }
        return file.type === acceptType
      })

      if (!isAccepted) {
        toast({
          title: 'File type not supported',
          description: `${file.name} is not a supported file type.`,
          variant: 'destructive'
        })
        return false
      }
    }

    return true
  }, [accept, maxSize])

  const handleFiles = useCallback((files: DragDropFile[]) => {
    if (disabled) return

    // Validate and filter files
    const validFiles = files.filter(validateFile)
    // Check max files limit
    const totalFiles = selectedFiles.length + validFiles.length
    if (totalFiles > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only select up to ${maxFiles} files. ${totalFiles - maxFiles} files were ignored.`,
        variant: 'destructive'
      })
      validFiles.splice(maxFiles - selectedFiles.length)
    }

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles]
      setSelectedFiles(newFiles)
      onFilesSelectedAction?.(newFiles)
    }
  }, [disabled, validateFile, selectedFiles, maxFiles, onFilesSelectedAction])

  const handleBrowseFiles = useCallback(async () => {
    if (disabled || !isElectron) return

    try {
      const filePaths = await openFilePicker({
        multiple: true,
        accept,
        title: 'Select Files'
      })

      if (filePaths.length > 0) {
        // Convert file paths to DragDropFile objects
        const files: DragDropFile[] = await Promise.all(
          filePaths.map(async (filePath) => {
            try {
              // Get file stats if available
              const stats = await (window as any).desktopAPI?.getFileStats?.(filePath)
              const fileName = filePath.split(/[\\/]/).pop() || 'unknown'

              return {
                name: fileName,
                path: filePath,
                size: stats?.data?.size || 0,
                type: getFileTypeFromName(fileName),
                lastModified: stats?.data?.modified || Date.now()
              }
            } catch (error) {
              console.error('Error getting file stats:', error)
              const fileName = filePath.split(/[\\/]/).pop() || 'unknown'
              return {
                name: fileName,
                path: filePath,
                size: 0,
                type: getFileTypeFromName(fileName),
                lastModified: Date.now()
              }
            }
          })
        )

        handleFiles(files)
      }
    } catch (error) {
      console.error('Browse files error:', error)
      toast({
        title: 'Error',
        description: 'Failed to browse files',
        variant: 'destructive'
      })
    }
  }, [disabled, isElectron, openFilePicker, accept, handleFiles])

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelectedAction?.(newFiles)
  }, [selectedFiles, onFilesSelectedAction])

  const uploadFiles = useCallback(async () => {
    if (!isElectron || selectedFiles.length === 0) return

    setIsUploading(true)
    for (const file of selectedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.path]: 0 }))
        onFileUploadAction?.(file, 0)

        // Simulate upload progress for demo
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({ ...prev, [file.path]: progress }))
          onFileUploadAction?.(file, progress)
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Cache file locally
        if (cacheFile) {
          const content = await (window as any).desktopAPI?.readFile?.(file.path)
          if (content?.success && content.data) {
            await cacheFile(file.name, content.data)
          }
        }

        onUploadCompleteAction?.(file, true)
        toast({
          title: 'Upload complete',
          description: `${file.name} uploaded successfully`
        })
      } catch (error) {
        console.error('Upload error:', error)
        onUploadCompleteAction?.(file, false)
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive'
        })
      }
    }

    setIsUploading(false)
    setUploadProgress({})
  }, [isElectron, selectedFiles, onFileUploadAction, onUploadCompleteAction, cacheFile])

  const getFileIcon = (file: DragDropFile) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />
    }
    if (file.type.startsWith('video/')) {
      return <Video className="h-4 w-4 text-purple-500" />
    }
    if (file.type.startsWith('audio/')) {
      return <Music className="h-4 w-4 text-green-500" />
    }
    if (file.type.includes('text') || file.name.endsWith('.md')) {
      return <FileText className="h-4 w-4 text-orange-500" />
    }
    return <File className="h-4 w-4 text-gray-500" />
  }

  const getFileTypeFromName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'study': 'application/x-studycollab'
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          isDragging && !disabled ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        )}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Upload className={cn(
              'mx-auto h-12 w-12',
              isDragging && !disabled ? 'text-blue-500' : 'text-gray-400'
            )} />
            <div>
              <p className="text-lg font-medium">
                {isDragging ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isElectron ? 'or click to browse files' : 'Desktop app required for file operations'}
              </p>
            </div>

            {isElectron && !disabled && (
              <Button
                variant="outline"
                onClick={handleBrowseFiles}
                disabled={isUploading}
              >
                Browse Files
              </Button>
            )}

            {accept && (
              <p className="text-xs text-gray-400">
                Supported: {accept.join(', ')}
              </p>
            )}

            {children}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
              {!isUploading && (
                <Button
                  onClick={uploadFiles}
                  disabled={selectedFiles.length === 0}
                  size="sm"
                >
                  Upload All
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={`${file.path}-${index}`} className="flex items-center gap-3 p-2 border rounded">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                    </p>
                  </div>

                  {uploadProgress[file.path] !== undefined && (
                    <div className="w-24">
                      <Progress value={uploadProgress[file.path]} className="h-2" />
                      <p className="text-xs text-center mt-1">{uploadProgress[file.path]}%</p>
                    </div>
                  )}

                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}