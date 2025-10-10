import { useToast } from '@/components/ui/use-toast'
import {
  ApiResponse,
  CreateResourceData,
  PaginatedResponse,
  Resource,
  ResourceFilters,
  UpdateResourceData,
} from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Fetch resources with filters and pagination
export function useResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async (): Promise<PaginatedResponse<Resource>> => {
      const params = new URLSearchParams()

      if (filters.type) {
        filters.type.forEach((type) => params.append('type', type))
      }
      if (filters.subject) {
        filters.subject.forEach((subject) => params.append('subject', subject))
      }
      if (filters.tags) {
        filters.tags.forEach((tag) => params.append('tags', tag))
      }
      if (filters.is_verified !== undefined) {
        params.append('is_verified', filters.is_verified.toString())
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy)
      }

      const response = await fetch(`/api/resources?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }
      return response.json()
    },
  })
}

// Fetch a single resource by ID
export function useResource(id: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: async (): Promise<Resource> => {
      const response = await fetch(`/api/resources/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch resource')
      }
      const data: ApiResponse<Resource> = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      return data.data!
    },
    enabled: !!id,
  })
}

// Create a new resource
export function useCreateResource() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateResourceData): Promise<Resource> => {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create resource')
      }

      const result: ApiResponse<Resource> = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: () => {
      // Invalidate and refetch resources
      queryClient.invalidateQueries({ queryKey: ['resources'] })

      toast({
        title: 'Success',
        description: 'Resource created successfully',
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

// Update a resource
export function useUpdateResource() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateResourceData
    }): Promise<Resource> => {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update resource')
      }

      const result: ApiResponse<Resource> = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (resource) => {
      // Update the specific resource in cache
      queryClient.setQueryData(['resource', resource.id], resource)

      // Invalidate resources list to refetch
      queryClient.invalidateQueries({ queryKey: ['resources'] })

      toast({
        title: 'Success',
        description: 'Resource updated successfully',
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

// Delete a resource
export function useDeleteResource() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete resource')
      }
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['resource', id] })

      // Invalidate resources list to refetch
      queryClient.invalidateQueries({ queryKey: ['resources'] })

      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
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

// Get user's own resources
export function useMyResources() {
  return useQuery({
    queryKey: ['my-resources'],
    queryFn: async (): Promise<Resource[]> => {
      const response = await fetch('/api/resources/my')
      if (!response.ok) {
        throw new Error('Failed to fetch your resources')
      }
      const data: ApiResponse<Resource[]> = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      return data.data!
    },
  })
}

// Get popular subjects for filtering
export function usePopularSubjects() {
  return useQuery({
    queryKey: ['popular-subjects'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/resources/subjects')
      if (!response.ok) {
        throw new Error('Failed to fetch subjects')
      }
      const data: ApiResponse<string[]> = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      return data.data!
    },
  })
}

// Vote on a resource
export function useVoteResource() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      resourceId,
      voteType,
    }: {
      resourceId: string
      voteType: 'UPVOTE' | 'DOWNVOTE'
    }): Promise<{ upvotes: number; downvotes: number; score: number }> => {
      const response = await fetch(`/api/resources/${resourceId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: voteType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to vote')
      }

      const result: ApiResponse<{
        upvotes: number
        downvotes: number
        score: number
      }> = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data, variables) => {
      // Update the specific resource in cache
      queryClient.setQueryData(
        ['resource', variables.resourceId],
        (old: Resource) => {
          if (old) {
            return {
              ...old,
              upvotes: data.upvotes,
              downvotes: data.downvotes,
              score: data.score,
            }
          }
          return old
        }
      )

      // Invalidate resources list to refetch
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['my-resources'] })
      queryClient.invalidateQueries({ queryKey: ['trending-resources'] })
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

// Get trending resources
export function useTrendingResources(
  options: { limit?: number; days?: number } = {}
) {
  const { limit = 10, days = 7 } = options

  return useQuery({
    queryKey: ['trending-resources', limit, days],
    queryFn: async (): Promise<Resource[]> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        days: days.toString(),
      })

      const response = await fetch(
        `/api/resources/trending?${params.toString()}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch trending resources')
      }
      const data: ApiResponse<Resource[]> = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      return data.data!
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
