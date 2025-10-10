import { CreateNoteData, Note, NoteFilters, UpdateNoteData } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface NotesResponse {
  data: Note[]
  error?: string
}

interface NoteResponse {
  data: Note
  error?: string
}

// Fetch notes with filters
async function fetchNotes(filters?: NoteFilters): Promise<Note[]> {
  const params = new URLSearchParams()
  
  if (filters?.folder_id) params.append('folder_id', filters.folder_id)
  if (filters?.tags) params.append('tags', filters.tags.join(','))
  if (filters?.is_public !== undefined) params.append('is_public', filters.is_public.toString())
  if (filters?.search) params.append('search', filters.search)

  const response = await fetch(`/api/notes?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch notes')
  }
  
  const result: NotesResponse = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.data
}

// Fetch single note
async function fetchNote(id: string): Promise<Note> {
  const response = await fetch(`/api/notes/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch note')
  }
  
  const result: NoteResponse = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.data
}

// Create note
async function createNote(data: CreateNoteData): Promise<Note> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create note')
  }
  
  const result: NoteResponse = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.data
}

// Update note
async function updateNote(id: string, data: UpdateNoteData): Promise<Note> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update note')
  }
  
  const result: NoteResponse = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.data
}

// Delete note
async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete note')
  }
}

// Custom hooks
export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: ['notes', filters],
    queryFn: () => fetchNotes(filters),
  })
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => fetchNote(id),
    enabled: !!id,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteData }) =>
      updateNote(id, data),
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['notes', updatedNote.id], updatedNote)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

// Auto-save hook for note content
export function useAutoSaveNote(noteId: string) {
  const updateNote = useUpdateNote()
  
  const autoSave = useMutation({
    mutationFn: (data: UpdateNoteData) => updateNote.mutateAsync({ id: noteId, data }),
    onError: (error) => {
      console.error('Auto-save failed:', error)
    },
  })
  
  return {
    autoSave: autoSave.mutate,
    isAutoSaving: autoSave.isPending,
    autoSaveError: autoSave.error,
  }
}