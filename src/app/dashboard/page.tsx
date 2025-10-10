'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Dashboard } from '@/components/dashboard'
import { DashboardLayout } from '@/components/layout'
import { useAuth } from '@/hooks/use-auth'

function DashboardContent() {
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
    <DashboardLayout user={layoutUser}>
      <Dashboard />
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
