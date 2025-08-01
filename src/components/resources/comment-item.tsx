'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '@/hooks/use-comments'
import { Comment } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { Edit, MoreHorizontal, Reply, Trash2, User } from 'lucide-react'
import { useState } from 'react'

interface CommentItemProps {
  comment: Comment
  resourceId: string
  isReply?: boolean
}

export function CommentItem({
  comment,
  resourceId,
  isReply = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [replyContent, setReplyContent] = useState('')

  const { user } = useAuth()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const createComment = useCreateComment()

  const isOwner = user?.id === comment.user_id
  const canReply = !isReply && user // Only allow replies to top-level comments

  const handleEdit = async () => {
    if (!editContent.trim()) return

    try {
      await updateComment.mutateAsync({
        resourceId,
        commentId: comment.id,
        content: editContent.trim(),
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    try {
      await deleteComment.mutateAsync({
        resourceId,
        commentId: comment.id,
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return

    try {
      await createComment.mutateAsync({
        resourceId,
        content: replyContent.trim(),
        parentId: comment.id,
      })
      setReplyContent('')
      setIsReplying(false)
    } catch (error) {
      console.error('Error creating reply:', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  const handleCancelReply = () => {
    setIsReplying(false)
    setReplyContent('')
  }

  return (
    <div
      className={`space-y-3 ${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          {comment.user?.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.name || 'User'}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                {comment.user?.name || 'Anonymous'}
              </span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-muted-foreground">(edited)</span>
              )}
            </div>

            {/* Actions Menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {editContent.length}/2000
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={!editContent.trim() || updateComment.isPending}
                  >
                    {updateComment.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {replyContent.length}/2000
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelReply}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim() || createComment.isPending}
                  >
                    {createComment.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              resourceId={resourceId}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
