'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/app-layout'
import { BookmarkManager } from '@/components/search/bookmark-manager'
import { UnifiedSearch } from '@/components/search/unified-search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { SearchResult } from '@/hooks/use-search'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export default function SearchPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleResultClick = useCallback(
    (result: SearchResult) => {
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
        <div className="container mx-auto space-y-6 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Search & Discovery</h1>
            <p className="text-muted-foreground">
              Find and organize your tasks, notes, and resources in one place
            </p>
          </div>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Unified Search</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Search across all your content with advanced filtering and
                    suggestions
                  </p>
                </CardHeader>
                <CardContent>
                  <UnifiedSearch
                    onResultClick={handleResultClick}
                    placeholder="Search tasks, notes, and resources..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookmarks" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <BookmarkManager onBookmarkClick={handleBookmarkClick} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
