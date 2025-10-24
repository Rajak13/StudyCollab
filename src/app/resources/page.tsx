'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { ResourceFeed } from '@/components/resources/resource-feed'
import { useAuth } from '@/hooks/use-auth'

export default function ResourcesPage() {
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
    <ProtectedRoute>
      <DashboardLayout user={layoutUser}>
        <div className="container mx-auto px-4 py-8">
          <ResourceFeed />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
