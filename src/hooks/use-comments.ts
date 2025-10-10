import { useToast } from '@/components/ui/use-toast'
import { ApiResponse, Comment } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Fetch comments for a resource
export function useComments(resourceId: string) {
  return useQuery({
    queryKey: ['comments', resourceId],
    queryFn: async (): Promise<Comment[]> => {
      const response = await fetch(`/api/resources/${resourceId}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data: ApiResponse<Comment[]> = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      return data.data!
    },
    enabled: !!resourceId,
  })
}

// Create a new comment
export function useCreateComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      resourceId,
      content,
      parentId,
    }: {
      resourceId: string
      content: string
      parentId?: string
    }): Promise<Comment> => {
      const response = await fetch(`/api/resources/${resourceId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parent_id: parentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create comment')
      }

      const result: ApiResponse<Comment> = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (_, variables) => {
      // Invalidate comments for this resource
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.resourceId],
      })

      // Also invalidate the resource to update comment count
      queryClient.invalidateQueries({
        queryKey: ['resource', variables.resourceId],
      })
      queryClient.invalidateQueries({ queryKey: ['resources'] })

      toast({
        title: 'Success',
        description: 'Comment posted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Update a comment
export function useUpdateComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      resourceId,
      commentId,
      content,
    }: {
      resourceId: string
      commentId: string
      content: string
    }): Promise<Comment> => {
      const response = await fetch(
        `/api/resources/${resourceId}/comments/${commentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update comment')
      }

      const result: ApiResponse<Comment> = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (_, variables) => {
      // Invalidate comments for this resource
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.resourceId],
      })

      toast({
        title: 'Success',
        description: 'Comment updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      resourceId,
      commentId,
    }: {
      resourceId: string
      commentId: string
    }): Promise<void> => {
      const response = await fetch(
        `/api/resources/${resourceId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete comment')
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate comments for this resource
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.resourceId],
      })

      // Also invalidate the resource to update comment count
      queryClient.invalidateQueries({
        queryKey: ['resource', variables.resourceId],
      })
      queryClient.invalidateQueries({ queryKey: ['resources'] })

      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
