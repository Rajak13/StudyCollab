'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateResource } from '@/hooks/use-resources'
import type { UpdateResourceFormData } from '@/lib/validations/resources'
import { updateResourceSchema } from '@/lib/validations/resources'
import { Resource } from '@/types/database'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface ResourceEditDialogProps {
  resource: Resource
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResourceEditDialog({
  resource,
  open,
  onOpenChange,
}: ResourceEditDialogProps) {
  const [tags, setTags] = useState<string[]>(resource.tags || [])
  const [tagInput, setTagInput] = useState('')

  const updateResource = useUpdateResource()

  const form = useForm<UpdateResourceFormData>({
    resolver: zodResolver(updateResourceSchema),
    defaultValues: {
      title: resource.title,
      description: resource.description,
      subject: resource.subject,
      course_code: resource.course_code || '',
      tags: resource.tags || [],
    },
  })

  // Update form when resource changes
  useEffect(() => {
    form.reset({
      title: resource.title,
      description: resource.description,
      subject: resource.subject,
      course_code: resource.course_code || '',
      tags: resource.tags || [],
    })
    setTags(resource.tags || [])
  }, [resource, form])

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

  const onSubmit = async (data: UpdateResourceFormData) => {
    try {
      await updateResource.mutateAsync({
        id: resource.id,
        data: {
          ...data,
          tags,
        },
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating resource:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              placeholder="Describe what this resource is about..."
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

          {/* Resource Info (Read-only) */}
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <h4 className="text-sm font-medium">Resource Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium">{resource.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(resource.created_at).toLocaleDateString()}
                </span>
              </div>
              {resource.file_size && (
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <span className="ml-2 font-medium">
                    {(resource.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Score:</span>
                <span className="ml-2 font-medium">
                  {resource.score.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateResource.isPending}
              className="flex-1"
            >
              {updateResource.isPending ? 'Updating...' : 'Update Resource'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateResource.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
