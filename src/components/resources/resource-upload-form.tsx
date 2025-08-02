'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useCreateResource } from '@/hooks/use-resources'
import type { CreateResourceFormData } from '@/lib/validations/resources'
import {
  createResourceSchema,
  MAX_FILE_SIZE,
  validateFileType,
} from '@/lib/validations/resources'
import { ResourceType } from '@/types/database'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  File,
  FileText,
  Image as ImageIcon,
  Link,
  Upload,
  Video,
  X,
} from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

interface ResourceUploadFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const resourceTypeIcons = {
  PDF: FileText,
  DOCX: FileText,
  PPT: FileText,
  IMAGE: ImageIcon,
  VIDEO: Video,
  LINK: Link,
  OTHER: File,
}

const resourceTypeLabels = {
  PDF: 'PDF Document',
  DOCX: 'Word Document',
  PPT: 'PowerPoint',
  IMAGE: 'Image',
  VIDEO: 'Video',
  LINK: 'Web Link',
  OTHER: 'Other File',
}

export function ResourceUploadForm({
  onSuccess,
  onCancel,
}: ResourceUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const { toast } = useToast()
  const { user } = useAuth()
  const createResource = useCreateResource()

  const form = useForm<CreateResourceFormData>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'OTHER',
      subject: '',
      course_code: '',
      tags: [],
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateFileType(file)
    if (!validation.isValid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive',
      })
      return
    }

    // Additional security checks
    if (
      file.name.includes('..') ||
      file.name.includes('/') ||
      file.name.includes('\\')
    ) {
      toast({
        title: 'Invalid File Name',
        description: 'File name contains invalid characters',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
    form.setValue('type', validation.type)

    // Set title to filename if not already set
    if (!form.getValues('title')) {
      form.setValue('title', file.name.replace(/\.[^/.]+$/, ''))
    }

    // Create preview for images
    if (validation.type === 'IMAGE') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    form.setValue('type', 'OTHER')
  }

  const handleAddTag = () => {
    if (
      tagInput.trim() &&
      !tags.includes(tagInput.trim()) &&
      tags.length < 10
    ) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue('tags', newTags)
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(newTags)
    form.setValue('tags', newTags)
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddTag()
    }
  }

  const uploadFileToStorage = async (file: File): Promise<string> => {
    // Import the upload function dynamically to avoid SSR issues
    const { uploadFile, getFileType, normalizeMimeType } = await import(
      '@/lib/file-upload'
    )

    // Get current user from the component's auth hook
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Upload file to Supabase Storage
    const uploadResult = await uploadFile(file, user.id)

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload file')
    }

    // Create file record in database
    const normalizedMimeType = normalizeMimeType(file)
    const fileType = getFileType(normalizedMimeType, file.name)

    const fileData = {
      name: file.name,
      original_name: file.name,
      file_path: uploadResult.file_path!,
      file_url: uploadResult.file_url!,
      file_size: file.size,
      mime_type: normalizedMimeType,
      file_type: fileType,
      description: '',
      tags: [],
      folder_id: null,
      is_public: false,
    }

    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fileData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create file record')
    }

    return uploadResult.file_url!
  }

  const onSubmit = async (data: CreateResourceFormData) => {
    try {
      setIsUploading(true)

      let fileUrl = data.file_url
      let fileSize = data.file_size

      // Upload file if one is selected
      if (selectedFile) {
        fileUrl = await uploadFileToStorage(selectedFile)
        fileSize = selectedFile.size
      }

      // Create resource
      await createResource.mutateAsync({
        ...data,
        file_url: fileUrl,
        file_size: fileSize,
        tags,
      })

      // Reset form
      form.reset()
      setSelectedFile(null)
      setFilePreview(null)
      setTags([])
      setTagInput('')

      onSuccess?.()
    } catch (error) {
      console.error('Error uploading resource:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const selectedType = form.watch('type')
  const IconComponent = resourceTypeIcons[selectedType]

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Resource
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>File Upload</Label>
            {!selectedFile ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium">Click to upload a file</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Supports PDF, Word, PowerPoint, Images, Videos (max{' '}
                    {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                        {resourceTypeLabels[selectedType]}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {filePreview && (
                  <div className="mt-4">
                    <Image
                      src={filePreview}
                      alt={`Preview of ${selectedFile.name}`}
                      width={200}
                      height={128}
                      className="h-32 max-w-full rounded object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resource Type (for links) */}
          {!selectedFile && (
            <div className="space-y-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value: ResourceType) =>
                  form.setValue('type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(resourceTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {React.createElement(
                          resourceTypeIcons[value as ResourceType],
                          {
                            className: 'h-4 w-4',
                          }
                        )}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* URL for links */}
          {form.watch('type') === 'LINK' && (
            <div className="space-y-2">
              <Label htmlFor="file_url">URL</Label>
              <Input
                {...form.register('file_url')}
                placeholder="https://example.com/resource"
                type="url"
              />
              {form.formState.errors.file_url && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.file_url.message}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              {...form.register('title')}
              placeholder="Enter resource title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              {...form.register('description')}
              placeholder="Describe what this resource is about, what topics it covers, and how it might be useful to other students..."
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              {...form.register('subject')}
              placeholder="e.g., Computer Science, Mathematics, Biology"
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500">
                {form.formState.errors.subject.message}
              </p>
            )}
          </div>

          {/* Course Code */}
          <div className="space-y-2">
            <Label htmlFor="course_code">Course Code (Optional)</Label>
            <Input
              {...form.register('course_code')}
              placeholder="e.g., CS101, MATH201"
            />
            {form.formState.errors.course_code && (
              <p className="text-sm text-red-500">
                {form.formState.errors.course_code.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag and press Enter"
                disabled={tags.length >= 10}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                variant="outline"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500">{tags.length}/10 tags used</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isUploading || createResource.isPending}
              className="flex-1"
            >
              {isUploading || createResource.isPending
                ? 'Uploading...'
                : 'Upload Resource'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isUploading || createResource.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
