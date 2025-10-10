'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useOfflineList } from '@/hooks/use-offline-data'
import { createClient } from '@/lib/supabase'
import { useIsOfflineMode, useIsOnline } from '@/stores/offline-store'
import { Loader2, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  user_id: string
  created_at: string
  updated_at: string
}

/**
 * Example component demonstrating offline-aware task management
 * This shows how to use the offline data hooks for CRUD operations
 */
export function OfflineTasksExample() {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const isOnline = useIsOnline()
  const isOfflineMode = useIsOfflineMode()

  // Use offline-aware data hook for tasks
  const {
    items: tasks,
    loading: tasksLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    refetch,
    isFromCache,
    lastUpdated
  } = useOfflineList<Task>({
    key: 'user-tasks',
    type: 'tasks',
    fetcher: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    ttl: 30 * 60 * 1000, // 30 minutes
    enabled: true
  })

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      await addItem({
        title: newTaskTitle.trim(),
        status: 'TODO',
        priority: 'MEDIUM',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      setNewTaskTitle('')
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
    
    try {
      await updateItem(task.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await removeItem(taskId)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Offline Tasks Example
              {isFromCache && (
                <Badge variant="outline" className="text-xs">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Cached
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Demonstrating offline-aware task management with automatic sync
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <Badge variant="destructive">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            ) : isOfflineMode ? (
              <Badge variant="secondary">
                <Wifi className="h-3 w-3 mr-1" />
                Offline Mode
              </Badge>
            ) : (
              <Badge variant="default">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={tasksLoading}
            >
              {tasksLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Task Form */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            disabled={loading}
          />
          <Button
            onClick={handleAddTask}
            disabled={loading || !newTaskTitle.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-700">
              Error: {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {tasksLoading && tasks.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading tasks...
          </div>
        )}

        {/* Tasks List */}
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${
                      task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''
                    }`}>
                      {task.title}
                    </h4>
                    <Badge className={getStatusColor(task.status)} variant="secondary">
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)} variant="secondary">
                      {task.priority}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Created: {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(task)}
                  >
                    {task.status === 'COMPLETED' ? 'Undo' : 'Complete'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : !tasksLoading && (
          <div className="text-center py-8 text-gray-500">
            No tasks yet. Add one above to get started!
          </div>
        )}

        {/* Offline Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">How offline mode works:</div>
            <ul className="space-y-1 text-xs">
              <li>• Tasks are automatically cached for offline access</li>
              <li>• Changes made offline are queued and sync when online</li>
              <li>• Data is encrypted in local storage for security</li>
              <li>• Conflicts are resolved automatically when possible</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}