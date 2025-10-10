'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useComments, useCreateComment } from '@/hooks/use-comments'
import { MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { CommentItem } from './comment-item'

interface CommentSectionProps {
  resourceId: string
}

export function CommentSection({ resourceId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuth()
  const { data: comments, isLoading, error } = useComments(resourceId)
  const createComment = useCreateComment()

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createComment.mutateAsync({
        resourceId,
        content: newComment.trim(),
      })
      setNewComment('')
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Press Ctrl+Enter to submit
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {newComment.length}/2000
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Please log in to post a comment
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <CommentsSkeleton />
          ) : error ? (
            <EmptyState
              title="Error Loading Comments"
              description="There was an error loading the comments. Please try again."
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          ) : !comments || comments.length === 0 ? (
            <EmptyState
              title="No Comments Yet"
              description="Be the first to share your thoughts on this resource!"
            />
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                resourceId={resourceId}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
