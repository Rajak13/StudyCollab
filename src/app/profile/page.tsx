'use client'

import { ProfileForm } from '@/components/auth/profile-form'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { useAuth } from '@/hooks/use-auth'

function ProfileContent() {
  const { user } = useAuth()

  // Transform Supabase user to layout user format
  const layoutUser = user
    ? {
        name: user.user_metadata?.name || user.email || 'User',
        avatar: user.user_metadata?.avatar,
        email: user.email,
      }
    : null

  return (
    <DashboardLayout user={layoutUser}>
      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          <ProfileForm />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
