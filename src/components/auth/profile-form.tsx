'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import {
  profileUpdateSchema,
  type ProfileUpdateFormData,
} from '@/lib/validations/auth'

interface ProfileFormProps {
  onSuccess?: () => void
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, updateProfile, uploadAvatar, loading } = useAuth()
  const { profile, refreshProfile } = useProfile()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
  })

  // Reset form when profile data changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        university: profile.university || '',
        major: profile.major || '',
        graduationYear: profile.graduation_year || undefined,
        bio: profile.bio || '',
      })
    }
  }, [profile, reset])

  const currentAvatar = profile?.avatar_url || user?.user_metadata?.avatar

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setAvatarUploading(true)

    const { error } = await uploadAvatar(file)

    if (error) {
      toast({
        title: 'Upload failed',
        description: error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      })
    }

    setAvatarUploading(false)
  }

  const onSubmit = async (data: ProfileUpdateFormData) => {
    // Filter out empty values and prepare updates
    const updates: Record<string, unknown> = {}

    if (data.name && data.name.trim() !== '') updates.name = data.name.trim()
    if (data.university && data.university.trim() !== '')
      updates.university = data.university.trim()
    if (data.major && data.major.trim() !== '')
      updates.major = data.major.trim()
    if (data.graduationYear) updates.graduation_year = data.graduationYear
    if (data.bio && data.bio.trim() !== '') updates.bio = data.bio.trim()

    // Only proceed if there are updates to make
    if (Object.keys(updates).length === 0) {
      toast({
        title: 'No changes',
        description: 'No changes were made to your profile.',
      })
      return
    }

    try {
      // Call the API route directly for better reliability
      const response = await fetch('/api/auth/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      // Refresh profile data to update the form
      refreshProfile()

      // Also update the auth store to keep UI in sync
      await updateProfile(updates)

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description:
          error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <div className="space-y-4">
          <Label>Profile Picture</Label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-border">
                {currentAvatar ? (
                  <Image
                    src={currentAvatar}
                    alt="Profile picture"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
                onClick={handleAvatarClick}
                disabled={avatarUploading}
              >
                {avatarUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Change profile picture</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Basic Information */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...register('name')}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              placeholder="Enter your university"
              {...register('university')}
              disabled={loading}
            />
            {errors.university && (
              <p className="text-sm text-destructive">
                {errors.university.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              placeholder="Enter your major"
              {...register('major')}
              disabled={loading}
            />
            {errors.major && (
              <p className="text-sm text-destructive">{errors.major.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              type="number"
              placeholder="2024"
              {...register('graduationYear', { valueAsNumber: true })}
              disabled={loading}
            />
            {errors.graduationYear && (
              <p className="text-sm text-destructive">
                {errors.graduationYear.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us a bit about yourself..."
            rows={4}
            {...register('bio')}
            disabled={loading}
          />
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={loading || avatarUploading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
