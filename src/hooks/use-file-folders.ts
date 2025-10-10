import { toast } from '@/components/ui/use-toast'
import {
  ApiResponse,
  CreateFileFolderData,
  FileFolder,
  UpdateFileFolderData,
} from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Fetch file folders
export function useFileFolders(parentId?: string, includeFiles = false) {
  return useQuery({
    queryKey: ['file-folders', parentId, includeFiles],
    queryFn: async (): Promise<ApiResponse<FileFolder[]>> => {
      const params = new URLSearchParams()
      if (parentId) params.append('parent_id', parentId)
      if (includeFiles) params.append('include_files', 'true')

      const response = await fetch(`/api/file-folders?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch folders')
      }
      return response.json()
    },
  })
}

// Fetch single file folder
export function useFileFolder(folderId: string) {
  return useQuery({
    queryKey: ['file-folders', folderId],
    queryFn: async (): Promise<ApiResponse<FileFolder>> => {
      const response = await fetch(`/api/file-folders/${folderId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch folder')
      }
      return response.json()
    },
    enabled: !!folderId,
  })
}

// Create file folder mutation
export function useCreateFileFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFileFolderData) => {
      const response = await fetch('/api/file-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create folder')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-folders'] })
      toast({
        title: 'Success',
        description: 'Folder created successfully',
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

// Update file folder mutation
export function useUpdateFileFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      folderId,
      data,
    }: {
      folderId: string
      data: UpdateFileFolderData
    }) => {
      const response = await fetch(`/api/file-folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update folder')
      }

      return response.json()
    },
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ['file-folders'] })
      queryClient.invalidateQueries({ queryKey: ['file-folders', folderId] })
      toast({
        title: 'Success',
        description: 'Folder updated successfully',
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

// Delete file folder mutation
export function useDeleteFileFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folderId: string) => {
      const response = await fetch(`/api/file-folders/${folderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete folder')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-folders'] })
      toast({
        title: 'Success',
        description: 'Folder deleted successfully',
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

// Get folder breadcrumb path
export function useFolderBreadcrumb(folderId?: string) {
  return useQuery({
    queryKey: ['folder-breadcrumb', folderId],
    queryFn: async (): Promise<FileFolder[]> => {
      if (!folderId) return []

      const breadcrumb: FileFolder[] = []
      let currentId = folderId

      while (currentId) {
        const response = await fetch(`/api/file-folders/${currentId}`)
        if (!response.ok) break

        const { data: folder } = await response.json()
        if (!folder) break

        breadcrumb.unshift(folder)
        currentId = folder.parent_id
      }

      return breadcrumb
    },
    enabled: !!folderId,
  })
}
