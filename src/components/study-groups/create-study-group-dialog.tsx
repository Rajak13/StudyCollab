'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useCreateStudyGroup } from '@/hooks/use-study-groups'
import { CreateStudyGroupData } from '@/types/database'
import { useState } from 'react'

interface CreateStudyGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateStudyGroupDialog({
  open,
  onOpenChange,
}: CreateStudyGroupDialogProps) {
  const createGroupMutation = useCreateStudyGroup()
  const [formData, setFormData] = useState<CreateStudyGroupData>({
    name: '',
    description: '',
    subject: '',
    university: '',
    is_private: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (
    field: keyof CreateStudyGroupData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required'
    } else if (formData.name.length > 255) {
      newErrors.name = 'Group name must be less than 255 characters'
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters'
    }

    if (formData.subject && formData.subject.length > 100) {
      newErrors.subject = 'Subject must be less than 100 characters'
    }

    if (formData.university && formData.university.length > 255) {
      newErrors.university = 'University name must be less than 255 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await createGroupMutation.mutateAsync(formData)
      // Reset form
      setFormData({
        name: '',
        description: '',
        subject: '',
        university: '',
        is_private: false,
      })
      setErrors({})
      onOpenChange(false)
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      university: '',
      is_private: false,
    })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
          <DialogDescription>
            Create a new study group to collaborate with other students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Computer Science Study Group"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this study group is about..."
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Help others understand the purpose of your study group.
            </p>
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                placeholder="e.g., Tribhuvan University"
                value={formData.university}
                onChange={(e) =>
                  handleInputChange('university', e.target.value)
                }
              />
              {errors.university && (
                <p className="text-sm text-destructive">{errors.university}</p>
              )}
            </div>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Private Group</Label>
              <p className="text-sm text-muted-foreground">
                Private groups require approval to join. Public groups allow
                anyone to join immediately.
              </p>
            </div>
            <Switch
              checked={formData.is_private}
              onCheckedChange={(checked) =>
                handleInputChange('is_private', checked)
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGroupMutation.isPending}>
              {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
