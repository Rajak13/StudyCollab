import {
    ApiResponse,
    BoardPermission,
    CanvasElement,
    CreateBoardPermissionData,
    CreateCanvasElementData,
    CreateStudyBoardData,
    PaginatedResponse,
    StudyBoard,
    StudyBoardFilters,
    UpdateBoardPermissionData,
    UpdateCanvasElementData,
    UpdateStudyBoardData,
    UpdateUserPresenceData,
    UserPresence
} from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const API_BASE = '/api/study-boards'

// Study Boards API functions
async function fetchStudyBoards(filters: StudyBoardFilters = {}): Promise<PaginatedResponse<StudyBoard>> {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params.append(key, value.join(','))
      } else {
        params.append(key, value.toString())
      }
    }
  })

  const response = await fetch(`${API_BASE}?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch study boards')
  }
  return response.json()
}

async function fetchStudyBoard(boardId: string): Promise<ApiResponse<{
  board: StudyBoard
  elements: CanvasElement[]
  user_permission: string
  active_presence: UserPresence[]
}>> {
  const response = await fetch(`${API_BASE}/${boardId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch study board')
  }
  return response.json()
}

async function createStudyBoard(data: CreateStudyBoardData): Promise<ApiResponse<StudyBoard>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to create study board')
  }
  return response.json()
}

async function updateStudyBoard(boardId: string, data: UpdateStudyBoardData): Promise<ApiResponse<StudyBoard>> {
  const response = await fetch(`${API_BASE}/${boardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to update study board')
  }
  return response.json()
}

async function deleteStudyBoard(boardId: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/${boardId}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete study board')
  }
  return response.json()
}

// Canvas Elements API functions
async function fetchCanvasElements(boardId: string): Promise<ApiResponse<CanvasElement[]>> {
  const response = await fetch(`${API_BASE}/${boardId}/elements`)
  if (!response.ok) {
    throw new Error('Failed to fetch canvas elements')
  }
  return response.json()
}

async function createCanvasElement(boardId: string, data: CreateCanvasElementData): Promise<ApiResponse<CanvasElement>> {
  const response = await fetch(`${API_BASE}/${boardId}/elements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to create canvas element')
  }
  return response.json()
}

async function updateCanvasElement(boardId: string, elementId: string, data: UpdateCanvasElementData): Promise<ApiResponse<CanvasElement>> {
  const response = await fetch(`${API_BASE}/${boardId}/elements/${elementId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to update canvas element')
  }
  return response.json()
}

async function bulkUpdateCanvasElements(boardId: string, elements: Array<{ id: string } & Partial<UpdateCanvasElementData>>): Promise<ApiResponse<CanvasElement[]>> {
  const response = await fetch(`${API_BASE}/${boardId}/elements`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements })
  })
  if (!response.ok) {
    throw new Error('Failed to bulk update canvas elements')
  }
  return response.json()
}

async function deleteCanvasElement(boardId: string, elementId: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/${boardId}/elements/${elementId}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete canvas element')
  }
  return response.json()
}

// Presence API functions
async function fetchUserPresence(boardId: string): Promise<ApiResponse<UserPresence[]>> {
  const response = await fetch(`${API_BASE}/${boardId}/presence`)
  if (!response.ok) {
    throw new Error('Failed to fetch user presence')
  }
  return response.json()
}

async function updateUserPresence(boardId: string, data: UpdateUserPresenceData): Promise<ApiResponse<UserPresence>> {
  const response = await fetch(`${API_BASE}/${boardId}/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to update user presence')
  }
  return response.json()
}

async function removeUserPresence(boardId: string, sessionId?: string): Promise<ApiResponse<void>> {
  const params = sessionId ? `?session_id=${sessionId}` : ''
  const response = await fetch(`${API_BASE}/${boardId}/presence${params}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to remove user presence')
  }
  return response.json()
}

// Permissions API functions
async function fetchBoardPermissions(boardId: string): Promise<ApiResponse<BoardPermission[]>> {
  const response = await fetch(`${API_BASE}/${boardId}/permissions`)
  if (!response.ok) {
    throw new Error('Failed to fetch board permissions')
  }
  return response.json()
}

async function createBoardPermission(boardId: string, data: CreateBoardPermissionData): Promise<ApiResponse<BoardPermission>> {
  const response = await fetch(`${API_BASE}/${boardId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to create board permission')
  }
  return response.json()
}

async function updateBoardPermission(boardId: string, userId: string, data: UpdateBoardPermissionData): Promise<ApiResponse<BoardPermission>> {
  const response = await fetch(`${API_BASE}/${boardId}/permissions/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to update board permission')
  }
  return response.json()
}

async function deleteBoardPermission(boardId: string, userId: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/${boardId}/permissions/${userId}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete board permission')
  }
  return response.json()
}

// React Hooks
export function useStudyBoards(filters: StudyBoardFilters = {}) {
  return useQuery({
    queryKey: ['study-boards', filters],
    queryFn: () => fetchStudyBoards(filters),
    staleTime: 30000, // 30 seconds
  })
}

export function useStudyBoard(boardId: string | null) {
  return useQuery({
    queryKey: ['study-board', boardId],
    queryFn: () => boardId ? fetchStudyBoard(boardId) : null,
    enabled: !!boardId,
    staleTime: 10000, // 10 seconds
  })
}

export function useCreateStudyBoard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createStudyBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-boards'] })
    }
  })
}

export function useUpdateStudyBoard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: UpdateStudyBoardData }) =>
      updateStudyBoard(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['study-board', boardId] })
      queryClient.invalidateQueries({ queryKey: ['study-boards'] })
    }
  })
}

export function useDeleteStudyBoard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteStudyBoard,
    onSuccess: (_, boardId) => {
      queryClient.removeQueries({ queryKey: ['study-board', boardId] })
      queryClient.invalidateQueries({ queryKey: ['study-boards'] })
    }
  })
}

// Canvas Elements Hooks
export function useCanvasElements(boardId: string | null) {
  return useQuery({
    queryKey: ['canvas-elements', boardId],
    queryFn: () => boardId ? fetchCanvasElements(boardId) : null,
    enabled: !!boardId,
    staleTime: 5000, // 5 seconds
  })
}

export function useCreateCanvasElement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: CreateCanvasElementData }) =>
      createCanvasElement(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['canvas-elements', boardId] })
      queryClient.invalidateQueries({ queryKey: ['study-board', boardId] })
    }
  })
}

export function useUpdateCanvasElement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, elementId, data }: { boardId: string; elementId: string; data: UpdateCanvasElementData }) =>
      updateCanvasElement(boardId, elementId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['canvas-elements', boardId] })
      queryClient.invalidateQueries({ queryKey: ['study-board', boardId] })
    }
  })
}

export function useBulkUpdateCanvasElements() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, elements }: { boardId: string; elements: Array<{ id: string } & Partial<UpdateCanvasElementData>> }) =>
      bulkUpdateCanvasElements(boardId, elements),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['canvas-elements', boardId] })
      queryClient.invalidateQueries({ queryKey: ['study-board', boardId] })
    }
  })
}

export function useDeleteCanvasElement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, elementId }: { boardId: string; elementId: string }) =>
      deleteCanvasElement(boardId, elementId),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['canvas-elements', boardId] })
      queryClient.invalidateQueries({ queryKey: ['study-board', boardId] })
    }
  })
}

// Presence Hooks
export function useUserPresence(boardId: string | null) {
  return useQuery({
    queryKey: ['user-presence', boardId],
    queryFn: () => boardId ? fetchUserPresence(boardId) : null,
    enabled: !!boardId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 2000, // 2 seconds
  })
}

export function useUpdateUserPresence() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: UpdateUserPresenceData }) =>
      updateUserPresence(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-presence', boardId] })
    }
  })
}

export function useRemoveUserPresence() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, sessionId }: { boardId: string; sessionId?: string }) =>
      removeUserPresence(boardId, sessionId),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-presence', boardId] })
    }
  })
}

// Permissions Hooks
export function useBoardPermissions(boardId: string | null) {
  return useQuery({
    queryKey: ['board-permissions', boardId],
    queryFn: () => boardId ? fetchBoardPermissions(boardId) : null,
    enabled: !!boardId,
    staleTime: 30000, // 30 seconds
  })
}

export function useCreateBoardPermission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: CreateBoardPermissionData }) =>
      createBoardPermission(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board-permissions', boardId] })
    }
  })
}

export function useUpdateBoardPermission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, userId, data }: { boardId: string; userId: string; data: UpdateBoardPermissionData }) =>
      updateBoardPermission(boardId, userId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board-permissions', boardId] })
    }
  })
}

export function useDeleteBoardPermission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ boardId, userId }: { boardId: string; userId: string }) =>
      deleteBoardPermission(boardId, userId),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board-permissions', boardId] })
    }
  })
}

// Utility hook for managing presence updates
export function usePresenceManager(boardId: string | null) {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const updatePresence = useUpdateUserPresence()
  const removePresence = useRemoveUserPresence()

  const updateCursor = (position: { x: number; y: number } | null, tool?: string) => {
    if (!boardId) return
    
    updatePresence.mutate({
      boardId,
      data: {
        cursor_position: position,
        current_tool: tool,
        session_id: sessionId
      }
    })
  }

  const cleanup = () => {
    if (!boardId) return
    
    removePresence.mutate({
      boardId,
      sessionId
    })
  }

  useEffect(() => {
    // Cleanup on unmount
    return cleanup
  }, [boardId])

  return {
    sessionId,
    updateCursor,
    cleanup,
    isUpdating: updatePresence.isPending
  }
}