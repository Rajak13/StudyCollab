export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
  expires_at?: string
}

export type NotificationType =
  | 'GROUP_JOIN_REQUEST'
  | 'GROUP_JOIN_APPROVED'
  | 'GROUP_JOIN_REJECTED'
  | 'GROUP_MEMBER_JOINED'
  | 'GROUP_MEMBER_LEFT'
  | 'GROUP_MEMBER_PROMOTED'
  | 'GROUP_MEMBER_REMOVED'
  | 'GROUP_MESSAGE'
  | 'GROUP_RESOURCE_SHARED'
  | 'GROUP_ARCHIVED'
  | 'TASK_DUE_SOON'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'NOTE_SHARED'
  | 'NOTE_COMMENTED'
  | 'NOTE_COLLABORATION_INVITE'
  | 'SYSTEM_ERROR'
  | 'SYSTEM_WARNING'
  | 'SYSTEM_SUCCESS'
  | 'SYNC_CONFLICT'
  | 'BACKUP_CREATED'

export interface NotificationData {
  groupId?: string
  groupName?: string
  userId?: string
  userName?: string
  messageId?: string
  resourceId?: string
  resourceTitle?: string
  oldRole?: string
  newRole?: string
}

export interface CreateNotificationData {
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
  expires_at?: string
}