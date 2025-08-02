import { toast } from '@/components/ui/use-toast'
import {
  ApiResponse,
  CreateJoinRequestData,
  CreateStudyGroupData,
  GroupJoinRequest,
  GroupMember,
  PaginatedResponse,
  StudyGroup,
  StudyGroupFilters,
  UpdateJoinRequestData,
  UpdateStudyGroupData,
} from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// API functions
async function fetchStudyGroups(
  filters: StudyGroupFilters = {}
): Promise<
  PaginatedResponse<
    StudyGroup & {
      member_count: number
      is_member: boolean
      user_role: string | null
    }
  >
> {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v.toString()))
      } else {
        params.append(key, value.toString())
      }
    }
  })

  const response = await fetch(`/api/study-groups?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch study groups')
  }
  return response.json()
}

async function fetchStudyGroup(
  id: string
): Promise<
  ApiResponse<
    StudyGroup & {
      member_count: number
      is_member: boolean
      user_role: string | null
    }
  >
> {
  const response = await fetch(`/api/study-groups/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch study group')
  }
  return response.json()
}

async function createStudyGroup(
  data: CreateStudyGroupData
): Promise<ApiResponse<StudyGroup>> {
  const response = await fetch('/api/study-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create study group')
  }
  return response.json()
}

async function updateStudyGroup(
  id: string,
  data: UpdateStudyGroupData
): Promise<ApiResponse<StudyGroup>> {
  const response = await fetch(`/api/study-groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update study group')
  }
  return response.json()
}

async function deleteStudyGroup(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(`/api/study-groups/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete study group')
  }
  return response.json()
}

async function joinGroup(
  id: string,
  data: CreateJoinRequestData
): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`/api/study-groups/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to join group')
  }
  return response.json()
}

async function leaveGroup(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(`/api/study-groups/${id}/join`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to leave group')
  }
  return response.json()
}

async function fetchGroupMembers(
  groupId: string
): Promise<ApiResponse<GroupMember[]>> {
  const response = await fetch(`/api/study-groups/${groupId}/members`)
  if (!response.ok) {
    throw new Error('Failed to fetch group members')
  }
  return response.json()
}

async function fetchJoinRequests(
  groupId: string
): Promise<ApiResponse<GroupJoinRequest[]>> {
  const response = await fetch(`/api/study-groups/${groupId}/requests`)
  if (!response.ok) {
    throw new Error('Failed to fetch join requests')
  }
  return response.json()
}

async function updateJoinRequest(
  groupId: string,
  requestId: string,
  data: UpdateJoinRequestData
): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(
    `/api/study-groups/${groupId}/requests/${requestId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )
  if (!response.ok) {
    throw new Error('Failed to update join request')
  }
  return response.json()
}

async function updateMemberRole(
  groupId: string,
  memberId: string,
  role: 'ADMIN' | 'MEMBER'
): Promise<ApiResponse<GroupMember>> {
  const response = await fetch(
    `/api/study-groups/${groupId}/members/${memberId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }
  )
  if (!response.ok) {
    throw new Error('Failed to update member role')
  }
  return response.json()
}

async function removeMember(
  groupId: string,
  memberId: string
): Promise<ApiResponse<null>> {
  const response = await fetch(
    `/api/study-groups/${groupId}/members/${memberId}`,
    {
      method: 'DELETE',
    }
  )
  if (!response.ok) {
    throw new Error('Failed to remove member')
  }
  return response.json()
}

// Hooks
export function useStudyGroups(filters: StudyGroupFilters = {}) {
  return useQuery({
    queryKey: ['study-groups', filters],
    queryFn: () => fetchStudyGroups(filters),
  })
}

export function useStudyGroup(id: string) {
  return useQuery({
    queryKey: ['study-group', id],
    queryFn: () => fetchStudyGroup(id),
    enabled: !!id,
  })
}

export function useCreateStudyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createStudyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] })
      toast({
        title: 'Success',
        description: 'Study group created successfully!',
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

export function useUpdateStudyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudyGroupData }) =>
      updateStudyGroup(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['study-group', id] })
      queryClient.invalidateQueries({ queryKey: ['study-groups'] })
      toast({
        title: 'Success',
        description: 'Study group updated successfully!',
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

export function useDeleteStudyGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteStudyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] })
      toast({
        title: 'Success',
        description: 'Study group deleted successfully!',
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

export function useJoinGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateJoinRequestData }) =>
      joinGroup(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['study-group', id] })
      queryClient.invalidateQueries({ queryKey: ['study-groups'] })
      toast({
        title: 'Success',
        description: response.message,
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

export function useLeaveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['study-group', id] })
      queryClient.invalidateQueries({ queryKey: ['study-groups'] })
      toast({
        title: 'Success',
        description: response.message,
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

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => fetchGroupMembers(groupId),
    enabled: !!groupId,
  })
}

export function useJoinRequests(groupId: string) {
  return useQuery({
    queryKey: ['join-requests', groupId],
    queryFn: () => fetchJoinRequests(groupId),
    enabled: !!groupId,
  })
}

export function useUpdateJoinRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      groupId,
      requestId,
      data,
    }: {
      groupId: string
      requestId: string
      data: UpdateJoinRequestData
    }) => updateJoinRequest(groupId, requestId, data),
    onSuccess: (response, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      toast({
        title: 'Success',
        description: response.message,
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

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      groupId,
      memberId,
      role,
    }: {
      groupId: string
      memberId: string
      role: 'ADMIN' | 'MEMBER'
    }) => updateMemberRole(groupId, memberId, role),
    onSuccess: (response, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      toast({
        title: 'Success',
        description: response.message,
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

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      groupId,
      memberId,
    }: {
      groupId: string
      memberId: string
    }) => removeMember(groupId, memberId),
    onSuccess: (response, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      toast({
        title: 'Success',
        description: response.message,
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
