import { NoteEditor } from '@/components/notes/note-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Note } from '@/types/database'
import { ArrowLeft, Calendar, Hash, User } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface SharedNotePageProps {
  params: Promise<{
    id: string
  }>
}

async function getSharedNote(id: string): Promise<Note | null> {
  const supabase = await createServerSupabaseClient()

  const { data: note, error } = await supabase
    .from('notes')
    .select(
      `
      *,
      user:profiles(name),
      folder:note_folders(id, name, color)
    `
    )
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (error || !note) {
    return null
  }

  return note
}

export default async function SharedNotePage({ params }: SharedNotePageProps) {
  const { id } = await params
  const note = await getSharedNote(id)

  if (!note) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to StudyCollab
              </Button>
            </Link>
          </div>

          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Shared by {note.user?.name || 'Anonymous'}</span>
            <span>•</span>
            <Calendar className="h-4 w-4" />
            <span>{new Date(note.created_at).toLocaleDateString()}</span>
          </div>

          <h1 className="mb-4 text-3xl font-bold">{note.title}</h1>

          {note.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Hash className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {note.summary && (
            <p className="mb-6 text-muted-foreground">{note.summary}</p>
          )}
        </div>

        {/* Note Content */}
        <Card className="border-white/20 bg-white/50 shadow-xl backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Note Content</span>
              <Badge variant="outline">Public</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <NoteEditor note={note} onSave={() => {}} />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            This note was shared from StudyCollab
          </p>
          <Link href="/signup">
            <Button>Join StudyCollab to create your own notes</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
