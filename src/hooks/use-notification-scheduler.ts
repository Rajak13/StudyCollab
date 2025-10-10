import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'
import { useTaskNotifications } from './use-task-notifications'

interface ScheduledNotification {
  id: string
  taskId: string
  taskTitle: string
  dueDate: Date
  priority: 'low' | 'medium' | 'high'
  timeoutId: NodeJS.Timeout
}

/**
 * Hook to schedule notifications for upcoming task due dates
 * Automatically schedules notifications at appropriate intervals before due dates
 */
export function useNotificationScheduler() {
  const { user } = useAuth()
  const { notifyTaskDue } = useTaskNotifications()
  const scheduledNotifications = useRef<Map<string, ScheduledNotification[]>>(new Map())

  const scheduleTaskNotification = (
    taskId: string,
    taskTitle: string,
    dueDate: Date,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!user) return

    // Clear existing notifications for this task
    clearTaskNotifications(taskId)

    const now = new Date()
    const timeToDue = dueDate.getTime() - now.getTime()

    // Don't schedule if already past due
    if (timeToDue <= 0) return

    const notifications: ScheduledNotification[] = []

    // Schedule notifications based on priority and time remaining
    const schedulePoints = getSchedulePoints(timeToDue, priority)

    schedulePoints.forEach(({ timeBeforeDue, label }) => {
      const notificationTime = dueDate.getTime() - timeBeforeDue
      const delay = notificationTime - now.getTime()

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          notifyTaskDue(taskTitle, dueDate, priority)
        }, delay)

        notifications.push({
          id: `${taskId}-${timeBeforeDue}`,
          taskId,
          taskTitle,
          dueDate,
          priority,
          timeoutId
        })
      }
    })

    if (notifications.length > 0) {
      scheduledNotifications.current.set(taskId, notifications)
    }
  }

  const clearTaskNotifications = (taskId: string) => {
    const existing = scheduledNotifications.current.get(taskId)
    if (existing) {
      existing.forEach(notification => {
        clearTimeout(notification.timeoutId)
      })
      scheduledNotifications.current.delete(taskId)
    }
  }

  const clearAllNotifications = () => {
    scheduledNotifications.current.forEach(notifications => {
      notifications.forEach(notification => {
        clearTimeout(notification.timeoutId)
      })
    })
    scheduledNotifications.current.clear()
  }

  // Get schedule points based on time remaining and priority
  const getSchedulePoints = (timeToDue: number, priority: 'low' | 'medium' | 'high') => {
    const points: { timeBeforeDue: number; label: string }[] = []
    
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour
    const oneWeek = 7 * oneDay

    // High priority tasks get more frequent notifications
    if (priority === 'high') {
      if (timeToDue > oneWeek) {
        points.push({ timeBeforeDue: oneWeek, label: '1 week before' })
      }
      if (timeToDue > 3 * oneDay) {
        points.push({ timeBeforeDue: 3 * oneDay, label: '3 days before' })
      }
      if (timeToDue > oneDay) {
        points.push({ timeBeforeDue: oneDay, label: '1 day before' })
      }
      if (timeToDue > 4 * oneHour) {
        points.push({ timeBeforeDue: 4 * oneHour, label: '4 hours before' })
      }
      if (timeToDue > oneHour) {
        points.push({ timeBeforeDue: oneHour, label: '1 hour before' })
      }
      if (timeToDue > 15 * 60 * 1000) {
        points.push({ timeBeforeDue: 15 * 60 * 1000, label: '15 minutes before' })
      }
    } else if (priority === 'medium') {
      if (timeToDue > oneWeek) {
        points.push({ timeBeforeDue: oneWeek, label: '1 week before' })
      }
      if (timeToDue > oneDay) {
        points.push({ timeBeforeDue: oneDay, label: '1 day before' })
      }
      if (timeToDue > 2 * oneHour) {
        points.push({ timeBeforeDue: 2 * oneHour, label: '2 hours before' })
      }
      if (timeToDue > 30 * 60 * 1000) {
        points.push({ timeBeforeDue: 30 * 60 * 1000, label: '30 minutes before' })
      }
    } else {
      // Low priority - minimal notifications
      if (timeToDue > oneWeek) {
        points.push({ timeBeforeDue: oneWeek, label: '1 week before' })
      }
      if (timeToDue > oneDay) {
        points.push({ timeBeforeDue: oneDay, label: '1 day before' })
      }
    }

    return points
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAllNotifications()
    }
  }, [])

  // Clear notifications when user logs out
  useEffect(() => {
    if (!user) {
      clearAllNotifications()
    }
  }, [user])

  return {
    scheduleTaskNotification,
    clearTaskNotifications,
    clearAllNotifications,
    getScheduledCount: () => {
      let count = 0
      scheduledNotifications.current.forEach(notifications => {
        count += notifications.length
      })
      return count
    }
  }
}