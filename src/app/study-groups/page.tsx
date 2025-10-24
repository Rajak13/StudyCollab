'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { StudyGroupsManager } from '@/components/study-groups/study-groups-manager'
import { useAuth } from '@/hooks/use-auth'
import { Users } from 'lucide-react'

function StudyGroupsPageContent() {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-slate-300">
                  Study Groups
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Join study groups to collaborate with peers, share resources, and learn together
                </p>
              </div>
            </div>
          </div>

          <StudyGroupsManager />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function StudyGroupsPage() {
  return (
    <ProtectedRoute>
      <StudyGroupsPageContent />
    </ProtectedRoute>
  )
}
