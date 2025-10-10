'use client'

import { toast } from '@/components/ui/use-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface GroupSharedResource {
  id: string
  group_id: string
  user_id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  tags: string[]
  download_count: number
  created_at: string
  updated_at: string
  user: {
    id: string
    email: string
    user_metadata: {
      name?: string
      avatar_url?: string
    }
  }
}

export interface CreateResourceData {
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  tags?: string[]
}

export interface ResourceFilters {
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'title' | 'download_count'
  sort_order?: 'asc' | 'desc'
  search?: string
  file_type?: string
}

export interface ResourcesResponse {
  data: GroupSharedResource[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useGroupResources(
  groupId: string,
  filters: ResourceFilters = {}
) {
  const queryKey = ['group-resources', groupId, filters]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ResourcesResponse> => {
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)
      if (filters.search) params.append('search', filters.search)
      if (filters.file_type) params.append('file_type', filters.file_type)

      const response = await fetch(
        `/api/study-groups/${groupId}/resources?${params}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch shared resources')
      }

      return response.json()
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateResource(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: CreateResourceData
    ): Promise<GroupSharedResource> => {
      const response = await fetch(`/api/study-groups/${groupId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to share resource')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      // Invalidate and refetch resources
      queryClient.invalidateQueries({
        queryKey: ['group-resources', groupId],
      })

      toast({
        title: 'Success',
        description: 'Resource shared successfully',
      })
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

export function useDeleteResource(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceId: string): Promise<void> => {
      const response = await fetch(
        `/api/study-groups/${groupId}/resources/${resourceId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete resource')
      }
    },
    onSuccess: () => {
      // Invalidate and refetch resources
      queryClient.invalidateQueries({
        queryKey: ['group-resources', groupId],
      })

      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      })
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

export function useDownloadResource(groupId: string) {
  return useMutation({
    mutationFn: async (resource: GroupSharedResource): Promise<void> => {
      // Track the download
      await fetch(
        `/api/study-groups/${groupId}/resources/${resource.id}/download`,
        {
          method: 'POST',
        }
      )

      // Trigger the download
      const link = document.createElement('a')
      link.href = resource.file_url
      link.download = resource.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to download resource',
        variant: 'destructive',
      })
    },
  })
}
