'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout'
import { NoteEditor } from '@/components/notes/note-editor'
import { NoteSharingDialog } from '@/components/notes/note-sharing-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useDeleteNote, useNote, useUpdateNote } from '@/hooks/use-notes'
import { Note } from '@/types/database'
import { ArrowLeft, Share, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

interface NotePageProps {
  params: Promise<{
    id: string
  }>
}

function NotePageContent({ params }: { params: { id: string } }) {
  const [showSharingDialog, setShowSharingDialog] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { data: note, isLoading } = useNote(params.id)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const { toast } = useToast()

  const displayName = user?.user_metadata?.name || user?.email || 'User'

  // Transform Supabase user to layout user format
  const layoutUser = user
    ? {
        name: displayName,
        avatar: user.user_metadata?.avatar_url,
        email: user.email,
      }
    : null

  const handleSave = async (updatedNote: Note) => {
    try {
      await updateNote.mutateAsync({
        id: updatedNote.id,
        data: {
          title: updatedNote.title,
          content: updatedNote.content,
          summary: updatedNote.summary ?? undefined,
          tags: updatedNote.tags,
          is_public: updatedNote.is_public,
          template: updatedNote.template || undefined,
          folder_id: updatedNote.folder_id || undefined,
        },
      })

      toast({
        title: 'Note saved',
        description: 'Your changes have been saved.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!note) return

    if (
      confirm(
        `Are you sure you want to delete "${note.title}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteNote.mutateAsync(note.id)
        toast({
          title: 'Note deleted',
          description: 'The note has been deleted.',
        })
        router.push('/notes')
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to delete note. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleBack = () => {
    router.push('/notes')
  }

  if (isLoading) {
    return (
      <AppLayout user={layoutUser}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
              <div className="h-96 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!note) {
    return (
      <AppLayout user={layoutUser}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="mb-4 text-2xl font-bold">Note not found</h1>
              <p className="mb-4 text-muted-foreground">
                The note you&apos;re looking for doesn&apos;t exist or you
                don&apos;t have permission to view it.
              </p>
              <Button onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notes
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={layoutUser}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Notes
              </Button>
              <div>
                <h1 className="max-w-md truncate text-2xl font-bold">
                  {note.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Last updated {new Date(note.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSharingDialog(true)}
              >
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Editor */}
          <Card className="border-white/20 bg-white/50 shadow-xl backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/50">
            <CardContent className="p-6">
              <NoteEditor
                note={note}
                onSave={handleSave}
                onCancel={handleBack}
              />
            </CardContent>
          </Card>

          {/* Note Sharing Dialog */}
          <NoteSharingDialog
            open={showSharingDialog}
            onOpenChange={setShowSharingDialog}
            note={note}
          />
        </div>
      </div>
    </AppLayout>
  )
}

export default function NotePage({ params }: NotePageProps) {
  return (
    <ProtectedRoute>
      <NotePageContentWrapper params={params} />
    </ProtectedRoute>
  )
}

function NotePageContentWrapper({ params }: NotePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  )

  React.useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  if (!resolvedParams) {
    return (
      <AppLayout user={null}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
              <div className="h-96 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return <NotePageContent params={resolvedParams} />
}
