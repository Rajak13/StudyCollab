'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { GroupDetail } from '@/components/study-groups/group-detail'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function StudyGroupDetailPageContent() {
  const params = useParams()
  const groupId = params.id as string
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
          {/* Back Navigation */}
          <div className="mb-6 flex items-center gap-4">
            <Link href="/study-groups">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Study Groups
              </Button>
            </Link>
          </div>

          {/* Group Detail */}
          <GroupDetail groupId={groupId} />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function StudyGroupDetailPage() {
  return (
    <ProtectedRoute>
      <StudyGroupDetailPageContent />
    </ProtectedRoute>
  )
}
