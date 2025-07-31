'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout'
import { NoteSearch } from '@/components/notes/note-search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useNotes } from '@/hooks/use-notes'
import { NoteFilters } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Calendar, Eye, FileText, Hash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function AllNotesPageContent() {
  const [filters, setFilters] = useState<NoteFilters>({})
  const { user } = useAuth()
  const router = useRouter()
  const { data: notes = [], isLoading } = useNotes(filters)

  const displayName = user?.user_metadata?.name || user?.email || 'User'

  // Transform Supabase user to layout user format
  const layoutUser = user
    ? {
        name: displayName,
        avatar: user.user_metadata?.avatar_url,
        email: user.email,
      }
    : null

  // Get all unique tags from notes for filtering
  const availableTags = Array.from(
    new Set(notes.flatMap((note) => note.tags))
  ).sort()

  return (
    <AppLayout user={layoutUser}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/notes')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Notes
            </Button>
            <div>
              <h1 className="text-2xl font-bold">All Notes</h1>
              <p className="text-sm text-muted-foreground">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} total
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Search and Filters */}
            <div className="lg:col-span-1">
              <Card className="border-white/20 bg-white/50 shadow-xl backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                  <NoteSearch
                    filters={filters}
                    onFiltersChange={setFilters}
                    availableTags={availableTags}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Notes List */}
            <div className="lg:col-span-3">
              <Card className="border-white/20 bg-white/50 shadow-xl backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                          <div className="mb-2 h-3 w-1/2 rounded bg-gray-200"></div>
                          <div className="h-3 w-1/4 rounded bg-gray-200"></div>
                        </div>
                      ))}
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                        No notes found
                      </h3>
                      <p className="mb-4 text-gray-500 dark:text-gray-400">
                        {Object.keys(filters).length > 0
                          ? 'Try adjusting your search filters'
                          : 'Create your first note to get started'}
                      </p>
                      <Link href="/notes/create">
                        <Button>Create Note</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {notes.map((note) => (
                        <Link
                          key={note.id}
                          href={`/notes/${note.id}`}
                          className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">
                                {note.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                {note.summary || 'No summary'}
                              </p>

                              {/* Tags */}
                              {note.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {note.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    >
                                      <Hash className="h-2 w-2" />
                                      {tag}
                                    </span>
                                  ))}
                                  {note.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{note.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDistanceToNow(
                                    new Date(note.updated_at),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </span>
                                {note.folder && (
                                  <span className="flex items-center gap-1">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor: note.folder.color,
                                      }}
                                    />
                                    {note.folder.name}
                                  </span>
                                )}
                                {note.is_public && (
                                  <span className="text-green-600 dark:text-green-400">
                                    Public
                                  </span>
                                )}
                              </div>
                            </div>
                            <Eye className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function AllNotesPage() {
  return (
    <ProtectedRoute>
      <AllNotesPageContent />
    </ProtectedRoute>
  )
}
