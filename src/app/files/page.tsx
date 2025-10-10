'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { FileManager } from '@/components/files/file-manager'
import { DashboardLayout } from '@/components/layout'
import { useAuth } from '@/hooks/use-auth'

function FilesContent() {
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
      <div className="container mx-auto px-4 py-8">
        <FileManager />
      </div>
    </DashboardLayout>
  )
}

export default function FilesPage() {
  return (
    <ProtectedRoute>
      <FilesContent />
    </ProtectedRoute>
  )
}
