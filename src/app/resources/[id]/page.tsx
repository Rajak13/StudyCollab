'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { ResourceDetail } from '@/components/resources/resource-detail'
import { useAuth } from '@/hooks/use-auth'
import * as React from 'react'

interface ResourceDetailPageProps {
  params: Promise<{ id: string }>
}

function ResourceDetailContent({ resourceId }: { resourceId: string }) {
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
        <ResourceDetail resourceId={resourceId} />
      </div>
    </DashboardLayout>
  )
}

export default function ResourceDetailPage({
  params,
}: ResourceDetailPageProps) {
  const [resourceId, setResourceId] = React.useState<string | null>(null)

  React.useEffect(() => {
    params.then(({ id }) => setResourceId(id))
  }, [params])

  if (!resourceId) {
    return <div>Loading...</div>
  }

  return (
    <ProtectedRoute>
      <ResourceDetailContent resourceId={resourceId} />
    </ProtectedRoute>
  )
}
