'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { useCreateMessage, useGroupMessages } from '@/hooks/use-group-messages'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { File, Reply, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface GroupChatProps {
  groupId: string
  className?: string
}

export function GroupChat({ groupId, className }: GroupChatProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messagesData, isLoading } = useGroupMessages(groupId)
  const createMessage = useCreateMessage(groupId)

  const messages = messagesData?.data || []

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    try {
      await createMessage.mutateAsync({
        content: message.trim(),
        reply_to_id: replyTo || undefined,
      })

      setMessage('')
      setReplyTo(null)
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleReply = (messageId: string) => {
    setReplyTo(messageId)
  }

  const cancelReply = () => {
    setReplyTo(null)
  }

  const getReplyMessage = (replyToId: string) => {
    return messages.find((msg) => msg.id === replyToId)
  }

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const getUserName = (
    user: {
      id: string
      name?: string
      email?: string
      user_metadata?: { name?: string }
    } | null
  ) => {
    if (user?.name) {
      return user.name
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Unknown User'
  }

  const getUserAvatar = (
    user: {
      avatar_url?: string
      user_metadata?: { avatar_url?: string }
    } | null
  ) => {
    return user?.avatar_url || user?.user_metadata?.avatar_url
  }

  const getUserInitials = (
    user: {
      id: string
      name?: string
      email?: string
      user_metadata?: { name?: string }
    } | null
  ) => {
    const name = getUserName(user)
    return name.charAt(0).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className={cn('flex h-96 items-center justify-center', className)}>
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-96 flex-col rounded-lg border', className)}>
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <div className="mb-2 text-4xl">💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.user_id === user?.id
              const replyMessage = msg.reply_to_id
                ? getReplyMessage(msg.reply_to_id)
                : null

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={getUserAvatar(msg.user)} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(msg.user)}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'max-w-[70%] flex-1',
                      isOwnMessage && 'text-right'
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getUserName(msg.user)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>

                    {/* Reply indicator */}
                    {replyMessage && (
                      <div className="mb-2 rounded border-l-2 border-primary bg-muted p-2 text-sm">
                        <div className="mb-1 text-xs text-muted-foreground">
                          Replying to {getUserName(replyMessage.user)}
                        </div>
                        <div className="truncate">{replyMessage.content}</div>
                      </div>
                    )}

                    <div
                      className={cn(
                        'inline-block max-w-full rounded-lg p-3',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.message_type === 'FILE' && msg.file_url ? (
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                          >
                            {msg.file_name}
                          </a>
                          {msg.file_size && (
                            <span className="text-xs opacity-70">
                              ({(msg.file_size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}
                    </div>

                    {/* Reply button */}
                    {!isOwnMessage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-6 px-2 text-xs"
                        onClick={() => handleReply(msg.id)}
                      >
                        <Reply className="mr-1 h-3 w-3" />
                        Reply
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded bg-muted p-2 text-sm">
            <div>
              <span className="text-muted-foreground">Replying to: </span>
              <span className="font-medium">
                {(() => {
                  const replyMessage = getReplyMessage(replyTo)
                  return replyMessage
                    ? getUserName(replyMessage.user)
                    : 'Unknown'
                })()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelReply}
              className="h-6 px-2"
            >
              Cancel
            </Button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={createMessage.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!message.trim() || createMessage.isPending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
