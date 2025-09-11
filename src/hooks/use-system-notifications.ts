import { useDesktopNotifications } from '@/components/desktop/desktop-notifications'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useCallback } from 'react'

export function useSystemNotifications() {
  const { addNotification } = useNotificationStore()
  const { showSystemNotification } = useDesktopNotifications()

  const notifyError = useCallback((title: string, message: string, error?: Error) => {
    addNotification({
      type: 'SYSTEM_ERROR' as any,
      title: `❌ ${title}`,
      message,
      data: { error: error?.message },
      read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expire after 24 hours
    })

    showSystemNotification(
      `❌ ${title}`,
      message,
      { urgency: 'critical' }
    )
  }, [addNotification, showSystemNotification])

  const notifySuccess = useCallback((title: string, message: string) => {
    showSystemNotification(
      `✅ ${title}`,
      message,
      { urgency: 'low' }
    )
  }, [showSystemNotification])

  const notifyWarning = useCallback((title: string, message: string) => {
    addNotification({
      type: 'SYSTEM_WARNING' as any,
      title: `⚠️ ${title}`,
      message,
      read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

    showSystemNotification(
      `⚠️ ${title}`,
      message,
      { urgency: 'normal' }
    )
  }, [addNotification, showSystemNotification])

  const notifyOfflineMode = useCallback((isOffline: boolean) => {
    if (isOffline) {
      notifyWarning(
        'Offline Mode',
        'You are now offline. Changes will sync when connection is restored.'
      )
    } else {
      notifySuccess(
        'Back Online',
        'Connection restored. Syncing your changes...'
      )
    }
  }, [notifyWarning, notifySuccess])

  const notifySyncConflict = useCallback((itemType: string, itemName: string) => {
    addNotification({
      type: 'SYNC_CONFLICT' as any,
      title: '🔄 Sync Conflict',
      message: `Conflict detected in ${itemType}: "${itemName}". Please review and resolve.`,
      data: { itemType, itemName },
      read: false,
      created_at: new Date().toISOString()
    })

    showSystemNotification(
      '🔄 Sync Conflict',
      `Conflict detected in ${itemType}: "${itemName}"`,
      { urgency: 'normal' }
    )
  }, [addNotification, showSystemNotification])

  const notifyDataExported = useCallback((exportType: string, fileName: string) => {
    notifySuccess(
      'Export Complete',
      `${exportType} exported successfully as "${fileName}"`
    )
  }, [notifySuccess])

  const notifyBackupCreated = useCallback((backupName: string) => {
    addNotification({
      type: 'BACKUP_CREATED' as any,
      title: '💾 Backup Created',
      message: `Backup "${backupName}" created successfully`,
      data: { backupName },
      read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expire after 7 days
    })
  }, [addNotification])

  return {
    notifyError,
    notifySuccess,
    notifyWarning,
    notifyOfflineMode,
    notifySyncConflict,
    notifyDataExported,
    notifyBackupCreated
  }
}