'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { StudyGroupsManager } from '@/components/study-groups/study-groups-manager'
import { useAuth } from '@/hooks/use-auth'

function StudyGroupsContent() {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground">
            Join and manage your study groups and collaborative sessions
          </p>
        </div>

        <StudyGroupsManager />
      </div>
    </DashboardLayout>
  )
}

export default function StudyGroupsPage() {
  return (
    <ProtectedRoute>
      <StudyGroupsContent />
    </ProtectedRoute>
  )
}
