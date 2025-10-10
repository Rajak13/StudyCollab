'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { ResourceManagement } from '@/components/resources/resource-management'
import { useAuth } from '@/hooks/use-auth'

function ResourceManageContent() {
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
      <div className="container mx-auto p-6">
        <ResourceManagement />
      </div>
    </DashboardLayout>
  )
}

export default function ResourceManagePage() {
  return (
    <ProtectedRoute>
      <ResourceManageContent />
    </ProtectedRoute>
  )
}
