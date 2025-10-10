import { useDesktopNotifications } from '@/components/desktop/desktop-notifications'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useCallback } from 'react'

export function useNoteNotifications() {
  const { addNotification } = useNotificationStore()
  const { showSystemNotification } = useDesktopNotifications()

  const notifyNoteShared = useCallback((noteTitle: string, sharedBy: string, sharedWith: string) => {
    addNotification({
      type: 'NOTE_SHARED' as any,
      title: '📄 Note Shared',
      message: `${sharedBy} shared "${noteTitle}" with ${sharedWith}`,
      data: { noteTitle, sharedBy, sharedWith },
      read: false,
      created_at: new Date().toISOString()
    })

    showSystemNotification(
      '📄 Note Shared',
      `${sharedBy} shared "${noteTitle}" with you`,
      { urgency: 'normal' }
    )
  }, [addNotification, showSystemNotification])

  const notifyNoteCommented = useCallback((noteTitle: string, commenterName: string, comment: string) => {
    addNotification({
      type: 'NOTE_COMMENTED' as any,
      title: '💬 New Comment',
      message: `${commenterName} commented on "${noteTitle}": ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`,
      data: { noteTitle, commenterName, comment },
      read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expire after 7 days
    })

    showSystemNotification(
      '💬 New Comment',
      `${commenterName} commented on "${noteTitle}"`,
      { urgency: 'low' }
    )
  }, [addNotification, showSystemNotification])

  const notifyNoteCollaborationInvite = useCallback((noteTitle: string, inviterName: string) => {
    addNotification({
      type: 'NOTE_COLLABORATION_INVITE' as any,
      title: '🤝 Collaboration Invite',
      message: `${inviterName} invited you to collaborate on "${noteTitle}"`,
      data: { noteTitle, inviterName },
      read: false,
      created_at: new Date().toISOString()
    })

    showSystemNotification(
      '🤝 Collaboration Invite',
      `${inviterName} invited you to collaborate on "${noteTitle}"`,
      { urgency: 'normal' }
    )
  }, [addNotification, showSystemNotification])

  return {
    notifyNoteShared,
    notifyNoteCommented,
    notifyNoteCollaborationInvite
  }
}