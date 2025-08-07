import { Notification } from '@/types/notifications'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearExpired: () => void
  
  // Real-time subscription
  isSubscribed: boolean
  setSubscribed: (subscribed: boolean) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      isSubscribed: false,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
        }

        set((state) => {
          const notifications = [newNotification, ...state.notifications]
          const unreadCount = notifications.filter((n) => !n.read).length

          return {
            notifications,
            unreadCount,
          }
        })
      },

      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
          const unreadCount = notifications.filter((n) => !n.read).length

          return {
            notifications,
            unreadCount,
          }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      removeNotification: (id) => {
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id)
          const unreadCount = notifications.filter((n) => !n.read).length

          return {
            notifications,
            unreadCount,
          }
        })
      },

      clearExpired: () => {
        const now = new Date()
        set((state) => {
          const notifications = state.notifications.filter((n) => {
            if (!n.expires_at) return true
            return new Date(n.expires_at) > now
          })
          const unreadCount = notifications.filter((n) => !n.read).length

          return {
            notifications,
            unreadCount,
          }
        })
      },

      setSubscribed: (subscribed) => {
        set({ isSubscribed: subscribed })
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
)