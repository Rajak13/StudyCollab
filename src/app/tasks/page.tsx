'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { TaskManager } from '@/components/tasks'
import { useAuth } from '@/hooks/use-auth'

function TasksContent() {
  const { user } = useAuth()

  const displayName = user?.user_metadata?.name || user?.email || 'User'

  // Transform Supabase user to layout user format
  const layoutUser = user
    ? {
        name: displayName,
        avatar: user.user_metadata?.avatar_url,
        email: user.email,
      }
    : null

  return (
    <AppLayout user={layoutUser}>
      <TaskManager />
    </AppLayout>
  )
}

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <TasksContent />
    </ProtectedRoute>
  )
}