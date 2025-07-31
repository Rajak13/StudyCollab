'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useDeleteResource } from '@/hooks/use-resources'
import { Resource } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  Download,
  Edit,
  ExternalLink,
  File,
  FileText,
  Image,
  Link,
  MessageCircle,
  MoreHorizontal,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Video,
} from 'lucide-react'
import { useState } from 'react'

interface ResourceCardProps {
  resource: Resource
  onEdit?: (resource: Resource) => void
  onView?: (resource: Resource) => void
  showActions?: boolean
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

export function ResourceCard({
  resource,
  onEdit,
  onView,
  showActions = true,
}: ResourceCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const { user } = useAuth()
  const deleteResource = useDeleteResource()

  const IconComponent = resourceTypeIcons[resource.type]
  const typeColorClass = resourceTypeColors[resource.type]

  const isOwner = user?.id === resource.user_id
  const userVote = resource.votes?.find((vote) => vote.user_id === user?.id)
  // const netVotes = resource.upvotes - resource.downvotes // TODO: Use for vote display

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || isVoting) return

    setIsVoting(true)
    try {
      // TODO: Implement voting API
      console.log(`Voting ${voteType} on resource ${resource.id}`)
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!isOwner) return

    if (
      window.confirm(
        'Are you sure you want to delete this resource? This action cannot be undone.'
      )
    ) {
      try {
        await deleteResource.mutateAsync(resource.id)
      } catch (error) {
        console.error('Error deleting resource:', error)
      }
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
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-start gap-3">
            <div className={`rounded-lg p-2 ${typeColorClass}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="cursor-pointer text-lg font-semibold leading-tight transition-colors hover:text-blue-600"
                onClick={() => onView?.(resource)}
              >
                {resource.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {resource.description}
              </p>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(resource)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {resource.file_url && (
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(resource)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Metadata */}
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

        {/* Subject and Course Code */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
          <div className="mb-4 flex flex-wrap gap-1">
            {resource.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{resource.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Voting */}
            <div className="flex items-center gap-2">
              <Button
                variant={userVote?.type === 'UPVOTE' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleVote('UPVOTE')}
                disabled={!user || isVoting}
                className="h-8 px-2"
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                {resource.upvotes}
              </Button>
              <Button
                variant={
                  userVote?.type === 'DOWNVOTE' ? 'destructive' : 'ghost'
                }
                size="sm"
                onClick={() => handleVote('DOWNVOTE')}
                disabled={!user || isVoting}
                className="h-8 px-2"
              >
                <ThumbsDown className="mr-1 h-4 w-4" />
                {resource.downvotes}
              </Button>
            </div>

            {/* Comments */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(resource)}
              className="h-8 px-2"
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              {resource.comments?.length || 0}
            </Button>
          </div>

          {/* Score */}
          <div className="text-sm font-medium text-muted-foreground">
            Score: {resource.score.toFixed(1)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
