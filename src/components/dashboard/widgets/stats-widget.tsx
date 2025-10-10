'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { BarChart3, CheckCircle, Clock, Users } from 'lucide-react'
import { useMemo } from 'react'

import { useTasks } from '@/hooks/use-tasks'

interface StatsWidgetProps {
  className?: string
}

export function StatsWidget({ className }: StatsWidgetProps) {
  const { data: tasksResponse, isLoading } = useTasks({ limit: 100 })

  const taskStats = useMemo(() => {
    const tasks = tasksResponse?.data || []
    const completed = tasks.filter(task => task.status === 'COMPLETED').length
    const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length
    const total = tasks.length

    return { completed, inProgress, total }
  }, [tasksResponse?.data])

  const stats = [
    {
      label: 'Tasks Completed',
      value: taskStats.completed,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Tasks In Progress',
      value: taskStats.inProgress,
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      label: 'Total Tasks',
      value: taskStats.total,
      icon: BarChart3,
      color: 'text-purple-500',
    },
    {
      label: 'Study Groups',
      value: 0, // Placeholder for future implementation
      icon: Users,
      color: 'text-orange-500',
    },
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}