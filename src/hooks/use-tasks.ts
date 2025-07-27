import { useToast } from '@/components/ui/use-toast'
import type {
    ApiResponse,
    PaginatedResponse,
    Task,
    TaskCategory,
    TaskCategoryFormData,
    TaskFiltersData,
    TaskFormData,
    TaskStatus,
    UpdateTaskCategoryFormData,
    UpdateTaskFormData,
} from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Task queries and mutations
export function useTasks(filters?: Partial<TaskFiltersData>) {
  const queryParams = new URLSearchParams()
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.set(key, value.join(','))
        } else {
          queryParams.set(key, String(value))
        }
      }
    })
  }

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async (): Promise<PaginatedResponse<Task>> => {
      const response = await fetch(`/api/tasks?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      return response.json()
    },
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async (): Promise<ApiResponse<Task>> => {
      const response = await fetch(`/api/tasks/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch task')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: TaskFormData): Promise<ApiResponse<Task>> => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Success',
        description: data.message || 'Task created successfully',
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

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskFormData }): Promise<ApiResponse<Task>> => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] })
      toast({
        title: 'Success',
        description: data.message || 'Task updated successfully',
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

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string): Promise<ApiResponse<null>> => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Success',
        description: data.message || 'Task deleted successfully',
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

// Quick actions
export function useCompleteTask() {
  const updateTask = useUpdateTask()

  return useMutation({
    mutationFn: async (id: string) => {
      return updateTask.mutateAsync({
        id,
        data: {
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        },
      })
    },
  })
}

export function useToggleTaskStatus() {
  const updateTask = useUpdateTask()

  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED'
      const updateData: UpdateTaskFormData = {
        status: newStatus as TaskStatus,
      }

      if (newStatus === 'COMPLETED') {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      return updateTask.mutateAsync({ id, data: updateData })
    },
  })
}

// Task categories
export function useTaskCategories() {
  return useQuery({
    queryKey: ['task-categories'],
    queryFn: async (): Promise<ApiResponse<TaskCategory[]>> => {
      const response = await fetch('/api/task-categories')
      if (!response.ok) {
        throw new Error('Failed to fetch task categories')
      }
      return response.json()
    },
  })
}

export function useCreateTaskCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: TaskCategoryFormData): Promise<ApiResponse<TaskCategory>> => {
      const response = await fetch('/api/task-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task category')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] })
      toast({
        title: 'Success',
        description: data.message || 'Task category created successfully',
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

export function useUpdateTaskCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskCategoryFormData }): Promise<ApiResponse<TaskCategory>> => {
      const response = await fetch(`/api/task-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task category')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] })
      toast({
        title: 'Success',
        description: data.message || 'Task category updated successfully',
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

export function useDeleteTaskCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string): Promise<ApiResponse<null>> => {
      const response = await fetch(`/api/task-categories/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task category')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Success',
        description: data.message || 'Task category deleted successfully',
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

// Bulk operations
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      task_ids, 
      updates 
    }: { 
      task_ids: string[]
      updates: Partial<UpdateTaskFormData>
    }): Promise<ApiResponse<Task[]>> => {
      const response = await fetch('/api/tasks/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_ids, updates }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tasks')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Success',
        description: data.message || 'Tasks updated successfully',
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

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (task_ids: string[]): Promise<ApiResponse<null>> => {
      const response = await fetch('/api/tasks/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_ids }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tasks')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Success',
        description: data.message || 'Tasks deleted successfully',
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