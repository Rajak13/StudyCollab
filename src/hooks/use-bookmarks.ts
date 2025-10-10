import { useToast } from '@/components/ui/use-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface Bookmark {
  id: string
  user_id: string
  content_type: 'task' | 'note' | 'resource'
  content_id: string
  title: string
  description?: string
  tags: string[]
  folder_name?: string
  created_at: string
  updated_at: string
  content_data?: {
    priority?: string
    status?: string
    due_date?: string
    is_public?: boolean
    subject?: string
    upvotes?: number
  }
}

export interface BookmarkFolder {
  name: string
  bookmark_count: number
}

export interface BookmarkFilters {
  folder?: string
  content_type?: 'task' | 'note' | 'resource'
  search?: string
}

// Get all bookmarks
export function useBookmarks(filters: BookmarkFilters = {}) {
  return useQuery({
    queryKey: ['bookmarks', filters],
    queryFn: async (): Promise<Bookmark[]> => {
      const params = new URLSearchParams()

      if (filters.folder) params.append('folder', filters.folder)
      if (filters.content_type)
        params.append('content_type', filters.content_type)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/bookmarks?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks')
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
  })
}

// Get bookmark folders
export function useBookmarkFolders() {
  return useQuery({
    queryKey: ['bookmark-folders'],
    queryFn: async (): Promise<BookmarkFolder[]> => {
      const response = await fetch('/api/bookmarks/folders')
      if (!response.ok) {
        throw new Error('Failed to fetch bookmark folders')
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
  })
}

// Create a bookmark
export function useCreateBookmark() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      content_type: 'task' | 'note' | 'resource'
      content_id: string
      folder_name?: string
    }): Promise<Bookmark> => {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create bookmark')
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate and refetch bookmarks
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['bookmark-folders'] })

      toast({
        title: 'Success',
        description: 'Content bookmarked successfully',
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

// Delete a bookmark
export function useDeleteBookmark() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (bookmarkId: string): Promise<void> => {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete bookmark')
      }
    },
    onSuccess: () => {
      // Invalidate and refetch bookmarks
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['bookmark-folders'] })

      toast({
        title: 'Success',
        description: 'Bookmark removed successfully',
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

// Update bookmark folder
export function useUpdateBookmark() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      id: string
      folder_name?: string
    }): Promise<Bookmark> => {
      const response = await fetch(`/api/bookmarks/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder_name: data.folder_name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update bookmark')
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate and refetch bookmarks
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['bookmark-folders'] })

      toast({
        title: 'Success',
        description: 'Bookmark updated successfully',
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

// Check if content is bookmarked
export function useIsBookmarked(contentType: string, contentId: string) {
  const { data: bookmarks } = useBookmarks()

  return (
    bookmarks?.some(
      (bookmark) =>
        bookmark.content_type === contentType &&
        bookmark.content_id === contentId
    ) || false
  )
}

// Get bookmark for specific content
export function useBookmarkForContent(contentType: string, contentId: string) {
  const { data: bookmarks } = useBookmarks()

  return bookmarks?.find(
    (bookmark) =>
      bookmark.content_type === contentType && bookmark.content_id === contentId
  )
}
