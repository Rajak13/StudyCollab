'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useResource, useVoteResource } from '@/hooks/use-resources'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Download,
  Edit,
  File,
  FileText,
  Image,
  Link,
  MessageCircle,
  Tag,
  ThumbsDown,
  ThumbsUp,
  User,
  Video,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CommentSection } from './comment-section'
import { ResourceEditDialog } from './resource-edit-dialog'

interface ResourceDetailProps {
  resourceId: string
}

const resourceTypeIcons = {
  PDF: FileText,
  DOCX: FileText,
  PPT: FileText,
  IMAGE: Image,
  VIDEO: Video,
  LINK: Link,
  OTHER: File,
}

const resourceTypeColors = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  PPT: 'bg-orange-100 text-orange-700',
  IMAGE: 'bg-green-100 text-green-700',
  VIDEO: 'bg-purple-100 text-purple-700',
  LINK: 'bg-cyan-100 text-cyan-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

export function ResourceDetail({ resourceId }: ResourceDetailProps) {
  const [editingResource, setEditingResource] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const router = useRouter()
  const { user } = useAuth()
  const { data: resource, isLoading, error } = useResource(resourceId)
  const voteResource = useVoteResource()

  if (isLoading) {
    return <ResourceDetailSkeleton />
  }

  if (error || !resource) {
    return (
      <EmptyState
        title="Resource Not Found"
        description="The resource you're looking for doesn't exist or has been removed."
        action={{
          label: 'Back to Resources',
          onClick: () => router.push('/resources'),
        }}
      />
    )
  }

  const IconComponent = resourceTypeIcons[resource.type]
  const typeColorClass = resourceTypeColors[resource.type]
  const isOwner = user?.id === resource.user_id
  const userVote = resource.votes?.find((vote) => vote.user_id === user?.id)

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || isVoting) return

    setIsVoting(true)
    try {
      await voteResource.mutateAsync({
        resourceId: resource.id,
        voteType,
      })
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleDownload = () => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Resource Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${typeColorClass}`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{resource.title}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{resource.user?.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(resource.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {resource.file_size && (
                      <div className="flex items-center gap-1">
                        <File className="h-4 w-4" />
                        <span>{formatFileSize(resource.file_size)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    onClick={() => setEditingResource(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="mb-2 text-lg font-semibold">Description</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {resource.description}
                </p>
              </div>

              {/* Subject and Course */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-medium">
                  {resource.subject}
                </Badge>
                {resource.course_code && (
                  <Badge variant="secondary">{resource.course_code}</Badge>
                )}
                {resource.is_verified && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Verified
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-sm">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-6">
                <div className="flex items-center gap-4">
                  {/* Voting */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={
                        userVote?.type === 'UPVOTE' ? 'default' : 'ghost'
                      }
                      size="sm"
                      onClick={() => handleVote('UPVOTE')}
                      disabled={!user || isVoting}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      {resource.upvotes}
                    </Button>
                    <Button
                      variant={
                        userVote?.type === 'DOWNVOTE' ? 'destructive' : 'ghost'
                      }
                      size="sm"
                      onClick={() => handleVote('DOWNVOTE')}
                      disabled={!user || isVoting}
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      {resource.downvotes}
                    </Button>
                  </div>

                  {/* Comments */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{resource.comments?.length || 0} comments</span>
                  </div>
                </div>

                {/* Download */}
                {resource.file_url && (
                  <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="font-semibold">
                  {resource.score.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Upvotes</span>
                <span className="font-semibold">{resource.upvotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Downvotes</span>
                <span className="font-semibold">{resource.downvotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span className="font-semibold">
                  {resource.comments?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          {resource.user && (
            <Card>
              <CardHeader>
                <CardTitle>Author</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{resource.user.name}</div>
                    {resource.user.university && (
                      <div className="text-sm text-muted-foreground">
                        {resource.user.university}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection resourceId={resourceId} />

      {/* Edit Dialog */}
      {editingResource && resource && (
        <ResourceEditDialog
          resource={resource}
          open={editingResource}
          onOpenChange={setEditingResource}
        />
      )}
    </div>
  )
}

function ResourceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
