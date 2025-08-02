'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { GroupDetail } from '@/components/study-groups/group-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function StudyGroupDetailPage() {
  const params = useParams()
  const groupId = params.id as string

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          {/* Back Navigation */}
          <div className="flex items-center gap-4">
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
    </ProtectedRoute>
  )
}
