'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { ResourceFeed } from '@/components/resources/resource-feed'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestResourcesPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto space-y-8 px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>
                Resource Sharing System - Community Features Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Voting System</h3>
                  <div className="space-y-1">
                    <Badge variant="outline">✅ Upvote/Downvote</Badge>
                    <Badge variant="outline">✅ Score Calculation</Badge>
                    <Badge variant="outline">✅ Ranking</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Comment System</h3>
                  <div className="space-y-1">
                    <Badge variant="outline">✅ Threaded Comments</Badge>
                    <Badge variant="outline">✅ Reply Functionality</Badge>
                    <Badge variant="outline">✅ Edit/Delete</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Resource Feed</h3>
                  <div className="space-y-1">
                    <Badge variant="outline">✅ Popularity Filter</Badge>
                    <Badge variant="outline">✅ Recency Filter</Badge>
                    <Badge variant="outline">✅ Subject Filter</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Discovery</h3>
                  <div className="space-y-1">
                    <Badge variant="outline">✅ Trending Content</Badge>
                    <Badge variant="outline">✅ Score-based Ranking</Badge>
                    <Badge variant="outline">✅ Search Integration</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-2 font-semibold">Features Implemented:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    Voting system with upvote/downvote functionality and score
                    calculation
                  </li>
                  <li>
                    Threaded comment system with reply, edit, and delete
                    capabilities
                  </li>
                  <li>
                    Resource feed with filtering by popularity, recency, and
                    subject
                  </li>
                  <li>
                    Trending resources discovery based on recent activity and
                    engagement
                  </li>
                  <li>Comprehensive API routes for comments and voting</li>
                  <li>Real-time score updates and optimistic UI updates</li>
                  <li>
                    Mobile-responsive design with grid and list view modes
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <ResourceFeed />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
