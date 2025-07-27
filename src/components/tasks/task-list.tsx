'use client'

import { format, isPast, isToday, isTomorrow } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MoreHorizontal,
  Pencil,
  Tag,
  Trash2
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import { useDeleteTask, useToggleTaskStatus } from '@/hooks/use-tasks'
import type { Task, TaskPriority, TaskStatus } from '@/types/database'

interface TaskListProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
  onView?: (task: Task) => void
  selectedTasks?: string[]
  onTaskSelect?: (taskId: string, selected: boolean) => void
  selectionMode?: boolean
  className?: string
}

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  LOW: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Low' },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium' },
  HIGH: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High' },
  URGENT: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Urgent' },
}

const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
  TODO: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'To Do' },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'In Progress' },
  COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
  CANCELLED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled' },
}

function TaskItem({
  task,
  onEdit,
  onView,
  selected = false,
  onSelect,
  selectionMode = false
}: {
  task: Task
  onEdit?: (task: Task) => void
  onView?: (task: Task) => void
  selected?: boolean
  onSelect?: (taskId: string, selected: boolean) => void
  selectionMode?: boolean
}) {
  const toggleStatus = useToggleTaskStatus()
  const deleteTask = useDeleteTask()

  const handleToggleComplete = () => {
    toggleStatus.mutate({ id: task.id, currentStatus: task.status })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id)
    }
  }

  const isCompleted = task.status === 'COMPLETED'
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted

  const getDueDateDisplay = () => {
    if (!task.due_date) return null

    const dueDate = new Date(task.due_date)

    if (isToday(dueDate)) {
      return { text: 'Today', color: 'text-orange-600' }
    } else if (isTomorrow(dueDate)) {
      return { text: 'Tomorrow', color: 'text-blue-600' }
    } else if (isPast(dueDate) && !isCompleted) {
      return { text: `Overdue (${format(dueDate, 'MMM d')})`, color: 'text-red-600' }
    } else {
      return { text: format(dueDate, 'MMM d, yyyy'), color: 'text-gray-600' }
    }
  }

  const dueDateDisplay = getDueDateDisplay()

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      isCompleted && 'opacity-75',
      isOverdue && 'border-red-200 bg-red-50/30',
      selected && 'ring-2 ring-blue-500 border-blue-300'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          {selectionMode && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked: boolean | 'indeterminate') => onSelect?.(task.id, !!checked)}
              className="mt-1"
            />
          )}

          {/* Completion Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto hover:bg-transparent"
            onClick={handleToggleComplete}
            disabled={toggleStatus.isPending}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
            )}
          </Button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    'font-medium text-sm cursor-pointer hover:text-blue-600',
                    isCompleted && 'line-through text-gray-500'
                  )}
                  onClick={() => onView?.(task)}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p className={cn(
                    'text-sm text-gray-600 mt-1 line-clamp-2',
                    isCompleted && 'text-gray-400'
                  )}>
                    {task.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 mt-2 text-xs">
                  {/* Priority */}
                  <Badge className={cn('text-xs', priorityConfig[task.priority].color)}>
                    {priorityConfig[task.priority].label}
                  </Badge>

                  {/* Status */}
                  <Badge variant="outline" className={cn('text-xs', statusConfig[task.status].color)}>
                    {statusConfig[task.status].label}
                  </Badge>

                  {/* Category */}
                  {task.category && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: task.category.color }}
                      />
                      <span className="text-gray-600">{task.category.name}</span>
                    </div>
                  )}

                  {/* Due Date */}
                  {dueDateDisplay && (
                    <div className={cn('flex items-center gap-1', dueDateDisplay.color)}>
                      {isOverdue ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      <span>{dueDateDisplay.text}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Tag className="h-3 w-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(task)}>
                      <Clock className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleToggleComplete}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskList({
  tasks,
  onEdit,
  onView,
  selectedTasks = [],
  onTaskSelect,
  selectionMode = false,
  className
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-600">Create your first task to get started with organizing your work.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEdit={onEdit}
          onView={onView}
          selected={selectedTasks.includes(task.id)}
          onSelect={onTaskSelect}
          selectionMode={selectionMode}
        />
      ))}
    </div>
  )
}