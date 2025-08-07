'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { cn } from '@/lib/utils'
import { Notification, NotificationType } from '@/types/notifications'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Crown,
  MessageCircle,
  Share2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearExpired,
  } = useNotificationStore()

  // Clear expired notifications on mount
  React.useEffect(() => {
    clearExpired()
  }, [clearExpired])

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'GROUP_JOIN_REQUEST':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'GROUP_JOIN_APPROVED':
        return <UserCheck className="h-4 w-4 text-green-500" />
      case 'GROUP_JOIN_REJECTED':
        return <X className="h-4 w-4 text-red-500" />
      case 'GROUP_MEMBER_JOINED':
        return <Users className="h-4 w-4 text-green-500" />
      case 'GROUP_MEMBER_LEFT':
        return <UserMinus className="h-4 w-4 text-orange-500" />
      case 'GROUP_MEMBER_PROMOTED':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'GROUP_MEMBER_REMOVED':
        return <UserMinus className="h-4 w-4 text-red-500" />
      case 'GROUP_MESSAGE':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'GROUP_RESOURCE_SHARED':
        return <Share2 className="h-4 w-4 text-purple-500" />
      case 'GROUP_ARCHIVED':
        return <Users className="h-4 w-4 text-gray-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.data?.groupId) {
      router.push(`/study-groups/${notification.data.groupId}`)
    }
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  const handleRemoveNotification = (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation()
    removeNotification(notificationId)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('relative', className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative cursor-pointer rounded-sm p-3 hover:bg-muted',
                    !notification.read && 'bg-blue-50 dark:bg-blue-950'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) =>
                              handleRemoveNotification(e, notification.id)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

