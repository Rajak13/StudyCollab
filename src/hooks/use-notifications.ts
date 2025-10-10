import { useNotificationStore } from '@/lib/stores/notification-store'
import { useNoteNotifications } from './use-note-notifications'
import { useSystemNotifications } from './use-system-notifications'
import { useTaskNotifications } from './use-task-notifications'

/**
 * Comprehensive notification hook that provides access to all notification types
 * This is the main hook that components should use for notifications
 */
export function useNotifications() {
  const taskNotifications = useTaskNotifications()
  const noteNotifications = useNoteNotifications()
  const systemNotifications = useSystemNotifications()
  const notificationStore = useNotificationStore()

  return {
    // Task notifications
    ...taskNotifications,
    
    // Note notifications
    ...noteNotifications,
    
    // System notifications
    ...systemNotifications,
    
    // Store methods
    ...notificationStore,
    
    // Convenience methods
    clearAll: () => {
      notificationStore.notifications.forEach(notification => {
        notificationStore.removeNotification(notification.id)
      })
    },
    
    getUnreadCount: () => notificationStore.unreadCount,
    
    hasUnreadNotifications: () => notificationStore.unreadCount > 0
  }
}

// Export individual hooks for specific use cases
export { useNoteNotifications } from './use-note-notifications'
export { useSystemNotifications } from './use-system-notifications'
export { useTaskNotifications } from './use-task-notifications'
