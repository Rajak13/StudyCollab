'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useNotes } from '@/hooks/use-notes'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'

interface RecentNotesWidgetProps {
  className?: string
}

export function RecentNotesWidget({ className }: RecentNotesWidgetProps) {
  const { data: allNotes = [], isLoading } = useNotes()
  
  // Get the 5 most recent notes
  const notes = allNotes.slice(0, 5)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Recent Notes</CardTitle>
          <Button size="sm" variant="outline" disabled>
            <Plus className="h-4 w-4 mr-1" />
            New Note
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-2 rounded-lg">
                <div className="h-4 w-4 mt-0.5 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Recent Notes</CardTitle>
        <Link href="/notes">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            New Note
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No notes yet"
            description="Create your first note to get started"
            action={{
              label: "Create Note",
              onClick: () => window.location.href = "/notes"
            }}
          />
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Link key={note.id} href={`/notes`}>
                <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {allNotes.length > 5 && (
              <Link href="/notes">
                <div className="text-center">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all notes ({allNotes.length})
                  </Button>
                </div>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}