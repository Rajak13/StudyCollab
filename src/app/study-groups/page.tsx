'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { StudyGroupsManager } from '@/components/study-groups/study-groups-manager'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function StudyGroupsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Study Groups</h1>
            <p className="text-muted-foreground">
              Join study groups to collaborate with peers, share resources, and
              learn together.
            </p>
          </div>

          <StudyGroupsManager />

          {/* Development/Testing Links */}
          <div className="mt-8 rounded-lg bg-muted p-4">
            <h3 className="mb-2 text-sm font-semibold">
              Development & Testing
            </h3>
            <div className="flex gap-2">
              <Link href="/test-study-groups-collaboration">
                <Button variant="outline" size="sm">
                  Test Collaboration Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
