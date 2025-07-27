'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle, FileText, MessageSquare, Upload } from 'lucide-react'
import { useMemo } from 'react'

import { useTasks } from '@/hooks/use-tasks'
import type { Task } from '@/types/database'

interface ActivityWidgetProps {
  className?: string
}

interface ActivityItem {
  id: string
  type: 'task_completed' | 'task_created' | 'task_updated' | 'note_created' | 'resource_shared' | 'comment_added'
  title: string
  description: string
  timestamp: string
}

export function ActivityWidget({ className }: ActivityWidgetProps) {
  const { data: tasksResponse } = useTasks({ 
    limit: 10, 
    sort_by: 'created_at', 
    sort_order: 'desc' 
  })

  const activities: ActivityItem[] = useMemo(() => {
    const tasks = tasksResponse?.data || []
    const taskActivities: ActivityItem[] = []



    tasks.forEach((task: Task) => {
      // Task completion activity
      if (task.status === 'COMPLETED' && task.completed_at) {
        taskActivities.push({
          id: `${task.id}-completed`,
          type: 'task_completed',
          title: 'Task completed',
          description: `Completed "${task.title}"`,
          timestamp: task.completed_at,
        })
      }

      // Task creation activity (if recently created)
      const createdRecently = new Date(task.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
      if (createdRecently) {
        taskActivities.push({
          id: `${task.id}-created`,
          type: 'task_created',
          title: 'Task created',
          description: `Created "${task.title}"`,
          timestamp: task.created_at,
        })
      }

      // Task update activity (if updated recently and not just created)
      const updatedRecently = new Date(task.updated_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
      const wasUpdated = task.updated_at !== task.created_at
      if (updatedRecently && wasUpdated && !createdRecently) {
        taskActivities.push({
          id: `${task.id}-updated`,
          type: 'task_updated',
          title: 'Task updated',
          description: `Updated "${task.title}"`,
          timestamp: task.updated_at,
        })
      }
    })

    // Sort by timestamp (most recent first)
    return taskActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5) // Show only the 5 most recent activities
  }, [tasksResponse?.data])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'note_created':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'resource_shared':
        return <Upload className="h-4 w-4 text-purple-500" />
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <Activity className="h-4 w-4 mr-2" />
          Recent Activity
        </CardTitle>
        <Button size="sm" variant="ghost">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold">No activity yet</h3>
            <p className="mb-4 text-muted-foreground">
              Start using StudyCollab to see your activity here
            </p>
            <Button variant="outline">Get Started</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50"
              >
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}