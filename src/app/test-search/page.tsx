'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/app-layout'
import { BookmarkManager } from '@/components/search/bookmark-manager'
import { QuickSearch } from '@/components/search/quick-search'
import { UnifiedSearch } from '@/components/search/unified-search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { SearchResult } from '@/hooks/use-search'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export default function TestSearchPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      console.log('Result clicked:', result)
      // Navigate to the appropriate page based on result type
      switch (result.type) {
        case 'task':
          router.push(`/tasks?id=${result.id}`)
          break
        case 'note':
          router.push(`/notes/${result.id}`)
          break
        case 'resource':
          router.push(`/resources/${result.id}`)
          break
      }
    },
    [router]
  )

  const handleBookmarkClick = useCallback(
    (bookmark: { content_type: string; content_id: string }) => {
      console.log('Bookmark clicked:', bookmark)
      // Navigate to the bookmarked content
      switch (bookmark.content_type) {
        case 'task':
          router.push(`/tasks?id=${bookmark.content_id}`)
          break
        case 'note':
          router.push(`/notes/${bookmark.content_id}`)
          break
        case 'resource':
          router.push(`/resources/${bookmark.content_id}`)
          break
      }
    },
    [router]
  )

  return (
    <ProtectedRoute>
      <DashboardLayout
        user={
          user
            ? {
                name:
                  user.user_metadata?.name ||
                  user.email?.split('@')[0] ||
                  'User',
                email: user.email || '',
                avatar: user.user_metadata?.avatar_url,
              }
            : null
        }
      >
        <div className="container mx-auto space-y-8 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Search System Test</h1>
            <p className="text-muted-foreground">
              Testing the unified search and discovery system components
            </p>
          </div>

          {/* Quick Search Test */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Search Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Test the quick search dialog (Cmd/Ctrl + K)
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <QuickSearch />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Unified Search Test */}
          <Card>
            <CardHeader>
              <CardTitle>Unified Search Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Test the full search interface with filtering and results
              </p>
            </CardHeader>
            <CardContent>
              <UnifiedSearch
                onResultClick={handleResultClick}
                placeholder="Search tasks, notes, and resources..."
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Bookmark Manager Test */}
          <Card>
            <CardHeader>
              <CardTitle>Bookmark Manager Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Test the bookmark management interface
              </p>
            </CardHeader>
            <CardContent>
              <BookmarkManager onBookmarkClick={handleBookmarkClick} />
            </CardContent>
          </Card>

          {/* API Test Information */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <p className="text-sm text-muted-foreground">
                Available search and bookmark API endpoints
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Search API:</strong>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      <code>GET /api/search</code> - Unified search across all
                      content
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>Bookmark API:</strong>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      <code>GET /api/bookmarks</code> - List user bookmarks
                    </li>
                    <li>
                      <code>POST /api/bookmarks</code> - Create bookmark
                    </li>
                    <li>
                      <code>PUT /api/bookmarks/[id]</code> - Update bookmark
                    </li>
                    <li>
                      <code>DELETE /api/bookmarks/[id]</code> - Delete bookmark
                    </li>
                    <li>
                      <code>GET /api/bookmarks/folders</code> - List bookmark
                      folders
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
