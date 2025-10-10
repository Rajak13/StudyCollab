'use client'

import { eachDayOfInterval, endOfMonth, format, isPast, isSameDay, isToday, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { Task, TaskPriority } from '@/types/database'

interface TaskCalendarViewProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
  className?: string
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
}

function CalendarDay({ 
  date, 
  tasks, 
  onTaskClick, 
  onDateClick 
}: { 
  date: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
}) {
  const dayTasks = tasks.filter(task => 
    task.due_date && isSameDay(new Date(task.due_date), date)
  )
  
  const isCurrentDay = isToday(date)
  const isPastDay = isPast(date) && !isCurrentDay
  const hasOverdueTasks = dayTasks.some(task => 
    task.status !== 'COMPLETED' && isPast(date)
  )
  
  const completedTasks = dayTasks.filter(task => task.status === 'COMPLETED').length
  const totalTasks = dayTasks.length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div 
      className={cn(
        'min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200',
        isCurrentDay && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 ring-1 ring-blue-200',
        hasOverdueTasks && 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600',
        totalTasks > 0 && completionRate === 100 && 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
      )}
      onClick={() => onDateClick?.(date)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          'text-sm font-medium',
          isCurrentDay && 'text-blue-600 dark:text-blue-400 font-bold',
          isPastDay && 'text-gray-400',
          hasOverdueTasks && 'text-red-600 dark:text-red-400'
        )}>
          {format(date, 'd')}
        </span>
        {dayTasks.length > 0 && (
          <div className="flex items-center gap-1">
            <Badge 
              variant="secondary" 
              className={cn(
                'text-xs',
                completionRate === 100 && 'bg-green-100 text-green-800',
                hasOverdueTasks && 'bg-red-100 text-red-800'
              )}
            >
              {completedTasks}/{totalTasks}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        {dayTasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className={cn(
              'text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-all duration-200',
              'bg-white dark:bg-gray-800 border-l-3 shadow-sm hover:shadow-md',
              task.status === 'COMPLETED' && 'opacity-60 line-through bg-gray-50 dark:bg-gray-700'
            )}
            style={{ borderLeftColor: priorityColors[task.priority] }}
            onClick={(e) => {
              e.stopPropagation()
              onTaskClick?.(task)
            }}
          >
            <div className="font-medium truncate flex items-center gap-1">
              {task.status === 'COMPLETED' && (
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              )}
              {task.status === 'IN_PROGRESS' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
              <span className="truncate">{task.title}</span>
            </div>
            {task.category && (
              <div className="flex items-center gap-1 mt-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className="text-gray-500 truncate text-xs">{task.category.name}</span>
              </div>
            )}
          </div>
        ))}
        
        {dayTasks.length > 3 && (
          <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 dark:bg-gray-700 rounded">
            +{dayTasks.length - 3} more
          </div>
        )}
      </div>
      
      {/* Progress indicator */}
      {totalTasks > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                completionRate === 100 ? 'bg-green-500' : 
                completionRate > 50 ? 'bg-blue-500' : 'bg-yellow-500'
              )}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function TaskCalendarView({ 
  tasks, 
  onTaskClick, 
  onDateClick, 
  className 
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Today
            </Button>
            
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {calendarDays.map((date) => (
            <CalendarDay
              key={date.toISOString()}
              date={date}
              tasks={tasks}
              onTaskClick={onTaskClick}
              onDateClick={onDateClick}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Urgent Priority</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}