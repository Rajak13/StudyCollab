'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  useCreateResource,
  useDeleteResource,
  useDownloadResource,
  useGroupResources,
} from '@/hooks/use-group-resources'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  Download,
  File,
  FileText,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import { useState } from 'react'

interface GroupSharedResourcesProps {
  groupId: string
  className?: string
}

export function GroupSharedResources({
  groupId,
  className,
}: GroupSharedResourcesProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file_url: '',
    file_name: '',
    file_size: 0,
    file_type: '',
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')

  const { data: resourcesData, isLoading } = useGroupResources(groupId, {
    search: searchQuery || undefined,
    limit: 20,
  })
  const createResource = useCreateResource(groupId)
  const deleteResource = useDeleteResource(groupId)
  const downloadResource = useDownloadResource(groupId)

  const resources = resourcesData?.data || []

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In a real app, you would upload to Supabase Storage here
    // For now, we'll simulate the upload
    const fileUrl = URL.createObjectURL(file)

    setUploadData({
      ...uploadData,
      file_url: fileUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    })
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !uploadData.tags.includes(tagInput.trim())) {
      setUploadData({
        ...uploadData,
        tags: [...uploadData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setUploadData({
      ...uploadData,
      tags: uploadData.tags.filter((t) => t !== tag),
    })
  }

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadData.title.trim() || !uploadData.file_url) {
      toast({
        title: 'Error',
        description: 'Please provide a title and select a file',
        variant: 'destructive',
      })
      return
    }

    try {
      await createResource.mutateAsync(uploadData)
      setShowUploadDialog(false)
      setUploadData({
        title: '',
        description: '',
        file_url: '',
        file_name: '',
        file_size: 0,
        file_type: '',
        tags: [],
      })
    } catch {
      // Error is handled by the mutation
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getUserName = (
    user: {
      user_metadata?: { name?: string }
      name?: string
      email?: string
    } | null
  ) => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
    }
    if (user?.name) {
      return user.name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Unknown User'
  }

  const getUserAvatar = (
    user: {
      user_metadata?: { avatar_url?: string }
      avatar_url?: string
    } | null
  ) => {
    return user?.user_metadata?.avatar_url || user?.avatar_url
  }

  const getUserInitials = (
    user: {
      user_metadata?: { name?: string }
      name?: string
      email?: string
    } | null
  ) => {
    const name = getUserName(user)
    return name.charAt(0).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className={cn('flex h-96 items-center justify-center', className)}>
        <div className="text-muted-foreground">Loading shared resources...</div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Share Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share a Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadResource} className="space-y-4">
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  required
                />
                {uploadData.file_name && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selected: {uploadData.file_name} (
                    {formatFileSize(uploadData.file_size)})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                  placeholder="Resource title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this resource..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>
                {uploadData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {uploadData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createResource.isPending}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-4xl">📎</div>
          <h3 className="mb-2 text-lg font-semibold">
            No shared resources yet
          </h3>
          <p className="mb-4 text-muted-foreground">
            Share files, documents, and other resources with your group members.
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Share First Resource
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(resource.file_type)}
                    <CardTitle className="truncate text-sm font-medium">
                      {resource.title}
                    </CardTitle>
                  </div>
                  {resource.user_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteResource.mutate(resource.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {resource.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                )}

                {resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={getUserAvatar(resource.user)} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(resource.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{getUserName(resource.user)}</span>
                  </div>
                  <span>
                    {formatDistanceToNow(new Date(resource.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(resource.file_size)}</span>
                  <span>{resource.download_count} downloads</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadResource.mutate(resource)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
