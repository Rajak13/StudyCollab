import { toast } from '@/components/ui/use-toast'
import {
  normalizeMimeType,
  uploadFile,
  UploadProgress,
} from '@/lib/file-upload'
import {
  ApiResponse,
  CreateFileData,
  FileFilters,
  FileRecord,
  PaginatedResponse,
  UpdateFileData,
} from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'

// Fetch files with filters
export function useFiles(filters: FileFilters = {}) {
  return useQuery({
    queryKey: ['files', filters],
    queryFn: async (): Promise<PaginatedResponse<FileRecord>> => {
      const params = new URLSearchParams()

      if (filters.folder_id) params.append('folder_id', filters.folder_id)
      if (filters.file_type?.length)
        params.append('file_type', filters.file_type.join(','))
      if (filters.tags?.length) params.append('tags', filters.tags.join(','))
      if (filters.is_public !== undefined)
        params.append('is_public', filters.is_public.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)

      const response = await fetch(`/api/files?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }
      return response.json()
    },
  })
}

// Fetch single file
export function useFile(fileId: string) {
  return useQuery({
    queryKey: ['files', fileId],
    queryFn: async (): Promise<ApiResponse<FileRecord>> => {
      const response = await fetch(`/api/files/${fileId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }
      return response.json()
    },
    enabled: !!fileId,
  })
}

// Upload file mutation
export function useUploadFile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      file,
      metadata,
      onProgress,
    }: {
      file: File
      metadata: Partial<CreateFileData>
      onProgress?: (progress: UploadProgress) => void
    }) => {
      if (!user) throw new Error('User not authenticated')

      // Upload file to storage
      const uploadResult = await uploadFile(file, user.id)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Create file record in database
      const fileData: CreateFileData = {
        name: metadata.name || file.name.split('.')[0],
        original_name: file.name,
        file_path: uploadResult.file_path!,
        file_url: uploadResult.file_url!,
        file_size: file.size,
        mime_type: normalizeMimeType(file),
        file_type: metadata.file_type || 'OTHER',
        description: metadata.description,
        tags: metadata.tags || [],
        folder_id: metadata.folder_id,
        is_public: metadata.is_public || false,
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      })

      if (!response.ok) {
        throw new Error('Failed to create file record')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
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

// Update file mutation
export function useUpdateFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fileId,
      data,
    }: {
      fileId: string
      data: UpdateFileData
    }) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update file')
      }

      return response.json()
    },
    onSuccess: (_, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['files', fileId] })
      toast({
        title: 'Success',
        description: 'File updated successfully',
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

// Delete file mutation
export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast({
        title: 'Success',
        description: 'File deleted successfully',
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

// Download file
export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({
      fileId,
      shareToken,
    }: {
      fileId: string
      shareToken?: string
    }) => {
      // Use direct download approach
      const params = new URLSearchParams({ direct: 'true' })
      if (shareToken) params.append('token', shareToken)

      const response = await fetch(`/api/files/${fileId}/download?${params}`)

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      // Get filename from Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'download'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'File downloaded successfully',
      })

      return { filename }
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

// Create file share
export function useCreateFileShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fileId,
      shareData,
    }: {
      fileId: string
      shareData: {
        expires_at?: string
        password?: string
        max_downloads?: number
      }
    }) => {
      const response = await fetch(`/api/files/${fileId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData),
      })

      if (!response.ok) {
        throw new Error('Failed to create share')
      }

      return response.json()
    },
    onSuccess: (_, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ['file-shares', fileId] })
      toast({
        title: 'Success',
        description: 'Share link created successfully',
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

// Get file shares
export function useFileShares(fileId: string) {
  return useQuery({
    queryKey: ['file-shares', fileId],
    queryFn: async () => {
      const response = await fetch(`/api/files/${fileId}/share`)
      if (!response.ok) {
        throw new Error('Failed to fetch shares')
      }
      return response.json()
    },
    enabled: !!fileId,
  })
}
