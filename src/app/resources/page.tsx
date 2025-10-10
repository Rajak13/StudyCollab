'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { ResourceFeed } from '@/components/resources/resource-feed'

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <ResourceFeed />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
