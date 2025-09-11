import { useDesktopNotifications } from '@/components/desktop/desktop-notifications'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useCallback } from 'react'

export function useTaskNotifications() {
  const { addNotification } = useNotificationStore()
  const { showReminderNotification, showSystemNotification } = useDesktopNotifications()

  const notifyTaskDue = useCallback((taskTitle: string, dueDate: Date, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const now = new Date()
    const timeDiff = dueDate.getTime() - now.getTime()
    const hoursUntilDue = Math.floor(timeDiff / (1000 * 60 * 60))
    
    let message = ''
    let urgency: 'low' | 'normal' | 'critical' = 'normal'
    
    if (hoursUntilDue <= 1) {
      message = `Due in ${Math.max(0, Math.floor(timeDiff / (1000 * 60)))} minutes!`
      urgency = 'critical'
    } else if (hoursUntilDue <= 24) {
      message = `Due in ${hoursUntilDue} hours`
      urgency = priority === 'high' ? 'critical' : 'normal'
    } else {
      const daysUntilDue = Math.floor(hoursUntilDue / 24)
      message = `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
      urgency = 'low'
    }

    // Add to notification center
    addNotification({
      type: 'TASK_DUE_SOON' as any,
      title: '📅 Task Due Soon',
      message: `${taskTitle} - ${message}`,
      data: { taskTitle, dueDate: dueDate.toISOString(), priority },
      read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
    })

    // Show desktop notification
    showReminderNotification(
      'Task Due Soon',
      `${taskTitle} - ${message}`,
      { urgency }
    )
  }, [addNotification, showReminderNotification])

  const notifyTaskCompleted = useCallback((taskTitle: string) => {
    showSystemNotification(
      '✅ Task Completed',
      `Great job! You completed "${taskTitle}"`,
      { urgency: 'low' }
    )
  }, [showSystemNotification])

  const notifyTaskCreated = useCallback((taskTitle: string, dueDate?: Date) => {
    const message = dueDate 
      ? `New task created: ${taskTitle} (Due: ${dueDate.toLocaleDateString()})`
      : `New task created: ${taskTitle}`

    addNotification({
      type: 'TASK_CREATED' as any,
      title: '📝 New Task Created',
      message,
      data: { taskTitle, dueDate: dueDate?.toISOString() },
      read: false,
      created_at: new Date().toISOString()
    })
  }, [addNotification])

  return {
    notifyTaskDue,
    notifyTaskCompleted,
    notifyTaskCreated
  }
}