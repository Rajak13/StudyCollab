'use client'

import { BarChart3, Calendar, CheckSquare, Keyboard, LayoutGrid, List, Plus, Settings, Square } from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading'
import { cn } from '@/lib/utils'

import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help'
import { TaskBulkOperations } from './task-bulk-operations'
import { TaskCalendarView } from './task-calendar-view'
import { TaskCategoryManager } from './task-category-manager'
import { TaskDetail } from './task-detail'
import { TaskFilters } from './task-filters'
import { TaskForm } from './task-form'
import { TaskList } from './task-list'
import { TaskStatistics } from './task-statistics'

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useCreateTask, useTasks, useUpdateTask } from '@/hooks/use-tasks'
import type { Task, TaskFiltersData, TaskFormData } from '@/types/database'

interface TaskManagerProps {
  className?: string
}

export function TaskManager({ className }: TaskManagerProps) {
  const [filters, setFilters] = useState<Partial<TaskFiltersData>>({
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false)
  const [showStatisticsDialog, setShowStatisticsDialog] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)

  const { data: tasksResponse, isLoading, error } = useTasks(filters)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const tasks = tasksResponse?.data || []
  const pagination = tasksResponse?.pagination

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      await createTask.mutateAsync(data)
      setShowCreateDialog(false)
    } catch {
      // Error handling is done in the hook
    }
  }

  const handleEditTask = async (data: TaskFormData) => {
    if (!selectedTask) return
    
    try {
      await updateTask.mutateAsync({ id: selectedTask.id, data })
      setShowEditDialog(false)
      setSelectedTask(null)
    } catch {
      // Error handling is done in the hook
    }
  }

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task)
    setShowEditDialog(true)
  }

  const handleTaskView = (task: Task) => {
    setSelectedTask(task)
    setShowDetailDialog(true)
  }

  const handleFiltersChange = (newFilters: Partial<TaskFiltersData>) => {
    setFilters({ ...filters, ...newFilters, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, taskId])
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId))
    }
  }

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(tasks.map(task => task.id))
    }
  }

  const handleClearSelection = () => {
    setSelectedTasks([])
    setSelectionMode(false)
  }

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    if (selectionMode) {
      setSelectedTasks([])
    }
  }

  const toggleViewMode = () => {
    const modes: Array<'list' | 'grid' | 'calendar'> = ['list', 'grid', 'calendar']
    const currentIndex = modes.indexOf(viewMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setViewMode(modes[nextIndex])
  }

  // Keyboard shortcuts - using Alt key to avoid browser conflicts
  const shortcuts = [
    {
      key: 'n',
      altKey: true,
      callback: () => setShowCreateDialog(true),
      description: 'Create new task'
    },
    {
      key: 'v',
      altKey: true,
      callback: toggleViewMode,
      description: 'Toggle view mode'
    },
    {
      key: 'a',
      altKey: true,
      callback: handleSelectAll,
      description: 'Select all tasks'
    },
    {
      key: 'r',
      altKey: true,
      callback: () => window.location.reload(),
      description: 'Refresh tasks'
    },
    {
      key: 'q',
      altKey: true,
      callback: () => setShowStatisticsDialog(true),
      description: 'Show statistics'
    },
    {
      key: 'c',
      altKey: true,
      callback: () => setShowCategoriesDialog(true),
      description: 'Manage categories'
    },
    {
      key: 'Escape',
      callback: () => {
        if (selectionMode) {
          handleClearSelection()
        }
      },
      description: 'Clear selection'
    },
    {
      key: 'Enter',
      altKey: true,
      callback: () => {
        if (selectedTasks.length > 0) {
          // Quick complete selected tasks
          const incompleteTasks = selectedTasks.filter(id => {
            const task = tasks.find(t => t.id === id)
            return task && task.status !== 'COMPLETED'
          })
          if (incompleteTasks.length > 0) {
            // This would trigger bulk complete - handled by bulk operations component
          }
        }
      },
      description: 'Complete selected tasks'
    },
    {
      key: 'Delete',
      callback: () => {
        if (selectedTasks.length > 0) {
          // This would trigger bulk delete - handled by bulk operations component
        }
      },
      description: 'Delete selected tasks'
    }
  ]

  useKeyboardShortcuts({ shortcuts })

  // Handle keyboard shortcut for help
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '?' && e.shiftKey) {
      e.preventDefault()
      setShowKeyboardShortcuts(true)
    }
  }

  // Add event listener for help shortcut
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (error) {
    return (
      <EmptyState
        title="Failed to load tasks"
        description="There was an error loading your tasks. Please try again."
        action={{
          label: 'Retry',
          onClick: () => window.location.reload()
        }}
      />
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${className}`}>
      <div className="space-y-4 sm:space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 pb-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Tasks
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Organize and track your academic tasks and assignments
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowStatisticsDialog(true)}
              className="bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 backdrop-blur-sm border-white/20 dark:border-slate-600/30"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Statistics</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowCategoriesDialog(true)}
              className="bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 backdrop-blur-sm border-white/20 dark:border-slate-600/30"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Categories</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={toggleSelectionMode}
              className={cn(
                "bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 backdrop-blur-sm border-white/20 dark:border-slate-600/30",
                selectionMode && "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600"
              )}
            >
              {selectionMode ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">Select</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowKeyboardShortcuts(true)}
              className="bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 backdrop-blur-sm border-white/20 dark:border-slate-600/30"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Shortcuts</span>
            </Button>
            
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20 dark:border-slate-700/30 shadow-lg p-4">
            <TaskFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-sm bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6">
              {/* Enhanced View Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {pagination ? `${pagination.total} task${pagination.total !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectionMode && selectedTasks.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80"
                    >
                      {selectedTasks.length === tasks.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                  
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80'}
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">List</span>
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80'}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Grid</span>
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className={viewMode === 'calendar' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80'}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Calendar</span>
                  </Button>
                </div>
              </div>

              {/* Enhanced Task List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-slate-600 dark:text-slate-400">Loading your tasks...</p>
                  </div>
                </div>
              ) : viewMode === 'calendar' ? (
                <TaskCalendarView
                  tasks={tasks}
                  onTaskClick={handleTaskView}
                  onDateClick={(date: Date) => {
                    // Set due date filter for the clicked date
                    const dateStr = date.toISOString().split('T')[0]
                    handleFiltersChange({ due_date_from: dateStr, due_date_to: dateStr })
                  }}
                />
              ) : (
                <TaskList
                  tasks={tasks}
                  onEdit={handleTaskEdit}
                  onView={handleTaskView}
                  selectedTasks={selectedTasks}
                  onTaskSelect={handleTaskSelect}
                  selectionMode={selectionMode}
                />
              )}

              {/* Enhanced Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 mt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80"
                    >
                      Previous
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80"
                    >
                      Next
                    </Button>
                  </div>
                  
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      
      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={createTask.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              onSubmit={handleEditTask}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedTask(null)
              }}
              isLoading={updateTask.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onEdit={handleTaskEdit}
        />
      )}

      {/* Categories Management Dialog */}
      <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Task Categories</DialogTitle>
          </DialogHeader>
          <TaskCategoryManager />
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={showStatisticsDialog} onOpenChange={setShowStatisticsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Statistics & Analytics</DialogTitle>
          </DialogHeader>
          <TaskStatistics tasks={tasks} />
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
        shortcuts={shortcuts}
      />

      {/* Bulk Operations */}
      <TaskBulkOperations
        selectedTasks={selectedTasks.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[]}
        onSelectionChange={setSelectedTasks}
        onClearSelection={handleClearSelection}
      />
    </div>
  )
}