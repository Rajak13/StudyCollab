'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { format, isPast, isToday } from 'date-fns'
import { AlertCircle, Calendar, CheckCircle, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useTasks } from '@/hooks/use-tasks'
import type { Task } from '@/types/database'

interface TasksOverviewWidgetProps {
  className?: string
}

export function TasksOverviewWidget({ className }: TasksOverviewWidgetProps) {
  const { data: tasksResponse, isLoading, error } = useTasks({
    limit: 5,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  const stats = useMemo(() => {
    const tasks = tasksResponse?.data || []
    const total = tasks.length
    const completed = tasks.filter(task => task.status === 'COMPLETED').length
    const pending = tasks.filter(task => task.status === 'TODO' || task.status === 'IN_PROGRESS').length
    const overdue = tasks.filter(task => 
      task.due_date && 
      isPast(new Date(task.due_date)) && 
      task.status !== 'COMPLETED'
    ).length

    return { total, completed, pending, overdue }
  }, [tasksResponse?.data])

  const recentTasks = (tasksResponse?.data || []).slice(0, 3)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Tasks Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">Tasks Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Failed to load tasks</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Tasks Overview</CardTitle>
        <Link href="/tasks">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No tasks yet</h3>
            <p className="text-xs text-gray-600 mb-3">Create your first task to get started.</p>
            <Link href="/tasks">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Task
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>

            {stats.overdue > 0 && (
              <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-700">{stats.overdue} overdue task{stats.overdue !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Recent Tasks</h4>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TaskItem({ task }: { task: Task }) {
  const isCompleted = task.status === 'COMPLETED'
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted
  const isDueToday = task.due_date && isToday(new Date(task.due_date))

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-gray-500' : ''}`}>
          {task.title}
        </p>
        
        <div className="flex items-center space-x-2 mt-1">
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
              task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
              task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}
          >
            {task.priority}
          </Badge>
          
          {task.due_date && (
            <div className={`flex items-center space-x-1 text-xs ${
              isOverdue ? 'text-red-600' : 
              isDueToday ? 'text-orange-600' : 
              'text-gray-500'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>
                {isDueToday ? 'Today' : 
                 isOverdue ? 'Overdue' : 
                 format(new Date(task.due_date), 'MMM d')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}