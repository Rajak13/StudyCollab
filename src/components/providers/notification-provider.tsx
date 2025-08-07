'use client'

import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { ReactNode } from 'react'

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Initialize real-time notifications
  useRealtimeNotifications()

  return <>{children}</>
}