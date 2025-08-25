'use client'

import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

export interface GroupMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  message_type: 'TEXT' | 'FILE' | 'SYSTEM'
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name?: string
    avatar_url?: string
    email?: string
    user_metadata?: {
      name?: string
      avatar_url?: string
    }
  }
  reply_to?: {
    id: string
    content: string
    user: {
      id: string
      name?: string
      avatar_url?: string
      email?: string
      user_metadata?: {
        name?: string
        avatar_url?: string
      }
    }
  }
}

export interface CreateMessageData {
  content: string
  message_type?: 'TEXT' | 'FILE' | 'SYSTEM'
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
}

export interface MessagesResponse {
  data: GroupMessage[]
  pagination: {
    limit: number
    hasMore: boolean
    nextCursor: string | null
  }
}

export function useGroupMessages(
  groupId: string,
  options?: {
    limit?: number
    enabled?: boolean
  }
) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['group-messages', groupId], [groupId])

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MessagesResponse> => {
      const params = new URLSearchParams({
        limit: (options?.limit || 50).toString(),
      })

      const response = await fetch(
        `/api/study-groups/${groupId}/messages?${params}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch messages')
      }

      return response.json()
    },
    enabled: options?.enabled !== false && !!groupId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  })

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!groupId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMessage = payload.new as GroupMessage

          // Add the new message to the query cache
          queryClient.setQueryData<MessagesResponse>(queryKey, (old) => {
            if (!old) return old

            // Check if message already exists to avoid duplicates
            const messageExists = old.data.some(
              (msg) => msg.id === newMessage.id
            )
            if (messageExists) return old

            return {
              ...old,
              data: [...old.data, newMessage],
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as GroupMessage

          // Update the message in the query cache
          queryClient.setQueryData<MessagesResponse>(queryKey, (old) => {
            if (!old) return old

            return {
              ...old,
              data: old.data.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              ),
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const deletedMessage = payload.old as GroupMessage

          // Remove the message from the query cache
          queryClient.setQueryData<MessagesResponse>(queryKey, (old) => {
            if (!old) return old

            return {
              ...old,
              data: old.data.filter((msg) => msg.id !== deletedMessage.id),
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, queryClient, queryKey])

  return query
}

export function useCreateMessage(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMessageData): Promise<GroupMessage> => {
      const response = await fetch(`/api/study-groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      // The real-time subscription will handle adding the message to the cache
      // But we can invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useLoadMoreMessages(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cursor: string): Promise<MessagesResponse> => {
      const params = new URLSearchParams({
        before: cursor,
        limit: '50',
      })

      const response = await fetch(
        `/api/study-groups/${groupId}/messages?${params}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load more messages')
      }

      return response.json()
    },
    onSuccess: (newData) => {
      // Prepend the new messages to the existing data
      queryClient.setQueryData<MessagesResponse>(
        ['group-messages', groupId],
        (old) => {
          if (!old) return newData

          return {
            ...newData,
            data: [...newData.data, ...old.data],
          }
        }
      )
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
