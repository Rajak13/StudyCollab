import {
  CreateNoteFolderData,
  NoteFolder,
  UpdateNoteFolderData,
} from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface NoteFoldersResponse {
  data: NoteFolder[]
  error?: string
}

interface NoteFolderResponse {
  data: NoteFolder
  error?: string
}

// Fetch note folders
async function fetchNoteFolders(): Promise<NoteFolder[]> {
  const response = await fetch('/api/note-folders')
  if (!response.ok) {
    throw new Error('Failed to fetch note folders')
  }

  const result: NoteFoldersResponse = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }

  return result.data
}

// Create note folder
async function createNoteFolder(
  data: CreateNoteFolderData
): Promise<NoteFolder> {
  const response = await fetch('/api/note-folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create note folder')
  }

  const result: NoteFolderResponse = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }

  return result.data
}

// Update note folder
async function updateNoteFolder(
  id: string,
  data: UpdateNoteFolderData
): Promise<NoteFolder> {
  const response = await fetch(`/api/note-folders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update note folder')
  }

  const result: NoteFolderResponse = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }

  return result.data
}

// Delete note folder
async function deleteNoteFolder(id: string): Promise<void> {
  const response = await fetch(`/api/note-folders/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete note folder')
  }
}

// Move note folder
async function moveNoteFolder(
  id: string,
  parentId: string | null
): Promise<NoteFolder> {
  return updateNoteFolder(id, { parent_id: parentId ?? undefined })
}

// Custom hooks
export function useNoteFolders() {
  return useQuery({
    queryKey: ['note-folders'],
    queryFn: fetchNoteFolders,
  })
}

export function useCreateNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNoteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-folders'] })
    },
  })
}

export function useUpdateNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteFolderData }) =>
      updateNoteFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-folders'] })
    },
  })
}

export function useDeleteNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNoteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-folders'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useMoveNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      moveNoteFolder(id, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-folders'] })
    },
  })
}

// Utility function to build folder tree
export function buildFolderTree(
  folders: NoteFolder[]
): (NoteFolder & { children: NoteFolder[] })[] {
  const folderMap = new Map<string, NoteFolder & { children: NoteFolder[] }>()
  const rootFolders: (NoteFolder & { children: NoteFolder[] })[] = []

  // Initialize all folders with children array
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Build the tree structure
  folders.forEach((folder) => {
    const folderWithChildren = folderMap.get(folder.id)!

    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id)
      if (parent) {
        parent.children.push(folderWithChildren)
      } else {
        // Parent not found, treat as root
        rootFolders.push(folderWithChildren)
      }
    } else {
      rootFolders.push(folderWithChildren)
    }
  })

  return rootFolders
}
