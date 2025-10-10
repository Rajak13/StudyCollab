'use client'

import { format, isPast, isToday, isTomorrow } from 'date-fns'
import {
    AlertCircle,
    CheckCircle2,
    Circle,
    Pencil,
    Tag,
    Trash2
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import { useDeleteTask, useToggleTaskStatus } from '@/hooks/use-tasks'
import type { Task, TaskPriority, TaskStatus } from '@/types/database'

interface TaskDetailProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (task: Task) => void
  className?: string
}

const priorityConfig: Record<TaskPriority, { color: string; label: string; icon: string }> = {
  LOW: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Low Priority', icon: '🟢' },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium Priority', icon: '🟡' },
  HIGH: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High Priority', icon: '🟠' },
  URGENT: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Urgent Priority', icon: '🔴' },
}

const statusConfig: Record<TaskStatus, { color: string; label: string; icon: string }> = {
  TODO: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'To Do', icon: '⏳' },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'In Progress', icon: '🔄' },
  COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed', icon: '✅' },
  CANCELLED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled', icon: '❌' },
}

export function TaskDetail({ task, open, onOpenChange, onEdit }: TaskDetailProps) {
  const toggleStatus = useToggleTaskStatus()
  const deleteTask = useDeleteTask()

  const handleToggleComplete = () => {
    toggleStatus.mutate({ id: task.id, currentStatus: task.status })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id)
      onOpenChange(false)
    }
  }

  const isCompleted = task.status === 'COMPLETED'
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted

  const getDueDateInfo = () => {
    if (!task.due_date) return null

    const dueDate = new Date(task.due_date)
    
    if (isToday(dueDate)) {
      return { 
        text: `Today at ${format(dueDate, 'h:mm a')}`, 
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: '📅'
      }
    } else if (isTomorrow(dueDate)) {
      return { 
        text: `Tomorrow at ${format(dueDate, 'h:mm a')}`, 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: '📅'
      }
    } else if (isPast(dueDate) && !isCompleted) {
      return { 
        text: `Overdue since ${format(dueDate, 'MMM d, yyyy')}`, 
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '⚠️'
      }
    } else {
      return { 
        text: format(dueDate, 'MMM d, yyyy \'at\' h:mm a'), 
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        icon: '📅'
      }
    }
  }

  const dueDateInfo = getDueDateInfo()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:bg-transparent"
              onClick={handleToggleComplete}
              disabled={toggleStatus.isPending}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <Circle className="h-6 w-6 text-gray-400 hover:text-green-600" />
              )}
            </Button>
            <span className={cn(
              'flex-1 text-left',
              isCompleted && 'line-through text-gray-500'
            )}>
              {task.title}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Task
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleComplete}
              disabled={toggleStatus.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{statusConfig[task.status].icon}</span>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={cn('mt-1', statusConfig[task.status].color)}>
                      {statusConfig[task.status].label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{priorityConfig[task.priority].icon}</span>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <Badge className={cn('mt-1', priorityConfig[task.priority].color)}>
                      {priorityConfig[task.priority].label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Due Date */}
          {dueDateInfo && (
            <Card className={cn(isOverdue && 'border-red-200')}>
              <CardContent className="p-4">
                <div className={cn('flex items-center gap-3 p-3 rounded-lg', dueDateInfo.bgColor)}>
                  <span className="text-2xl">{dueDateInfo.icon}</span>
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className={cn('font-medium', dueDateInfo.color)}>
                      {dueDateInfo.text}
                    </p>
                  </div>
                  {isOverdue && (
                    <AlertCircle className="h-5 w-5 text-red-600 ml-auto" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category */}
          {task.category && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: task.category.color }}
                  />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">{task.category.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">
                    {format(new Date(task.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(task.updated_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>
              
              {task.completed_at && (
                <>
                  <Separator />
                  <div>
                    <p className="text-gray-600 text-sm">Completed</p>
                    <p className="font-medium text-green-600">
                      {format(new Date(task.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}