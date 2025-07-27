'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout'
import { NoteEditor } from '@/components/notes/note-editor'
import { NoteList } from '@/components/notes/note-list'
import { NoteTemplate } from '@/components/notes/note-templates'
import { TemplateSelector } from '@/components/notes/template-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useDeleteNote, useNotes } from '@/hooks/use-notes'
import { Note } from '@/types/database'
import { ArrowLeft, FileText } from 'lucide-react'
import { useState } from 'react'

type ViewMode = 'list' | 'editor' | 'viewer'

function NotesPageContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)

  const { user } = useAuth()
  const { data: notes = [], isLoading } = useNotes()
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

  const handleCreateNew = (template?: NoteTemplate) => {
    setSelectedNote(null)
    setSelectedTemplate(template?.id)
    setViewMode('editor')
  }

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note)
    setViewMode('viewer')
  }

  const handleNoteEdit = (note: Note) => {
    setSelectedNote(note)
    setViewMode('editor')
  }

  const handleNoteDelete = (note: Note) => {
    setNoteToDelete(note)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!noteToDelete) return

    try {
      await deleteNote.mutateAsync(noteToDelete.id)
      toast({
        title: 'Note deleted',
        description: 'The note has been deleted successfully.',
      })
      setDeleteDialogOpen(false)
      setNoteToDelete(null)

      if (selectedNote?.id === noteToDelete.id) {
        setViewMode('list')
        setSelectedNote(null)
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleNoteSave = (note: Note) => {
    setSelectedNote(note)
    setViewMode('viewer')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedNote(null)
    setSelectedTemplate(undefined)
  }

  return (
    <AppLayout user={layoutUser}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto py-4 px-4 sm:py-6 lg:py-8">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              {viewMode !== 'list' && (
                <Button
                  variant="ghost"
                  onClick={handleBackToList}
                  className="flex items-center gap-2 hover:bg-white/50 dark:hover:bg-slate-800/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Notes</span>
                </Button>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {viewMode === 'list' ? 'My Notes' :
                      viewMode === 'editor' ? (selectedNote ? 'Edit Note' : 'Create Note') :
                        'View Note'}
                  </h1>
                  {viewMode === 'list' && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Organize your thoughts and study materials
                    </p>
                  )}
                </div>
              </div>
            </div>

            {viewMode === 'list' && (
              <div className="flex items-center gap-2">
                <TemplateSelector onTemplateSelect={handleCreateNew} />
              </div>
            )}
          </div>

          {/* Enhanced Content Area */}
          <div className="relative">
            {viewMode === 'list' && (
              <div className="backdrop-blur-sm bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl">
                <NoteList
                  notes={notes}
                  onNoteSelect={handleNoteSelect}
                  onNoteEdit={handleNoteEdit}
                  onNoteDelete={handleNoteDelete}
                  onCreateNew={() => handleCreateNew()}
                  isLoading={isLoading}
                />
              </div>
            )}

            {viewMode === 'editor' && (
              <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl overflow-hidden">
                <NoteEditor
                  note={selectedNote || undefined}
                  template={selectedTemplate}
                  onSave={handleNoteSave}
                  onCancel={handleBackToList}
                />
              </div>
            )}

            {viewMode === 'viewer' && selectedNote && (
              <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/30 shadow-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 break-words">
                        {selectedNote.title}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span>Created {new Date(selectedNote.created_at).toLocaleDateString()}</span>
                        {selectedNote.updated_at !== selectedNote.created_at && (
                          <>
                            <span>•</span>
                            <span>Updated {new Date(selectedNote.updated_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => handleNoteEdit(selectedNote)}
                        className="bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleNoteDelete(selectedNote)}
                        className="bg-red-500/90 hover:bg-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {selectedNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedNote.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full border border-blue-200/50 dark:border-blue-700/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <NoteEditor
                      note={selectedNote}
                      onSave={() => { }}
                      className="border-none bg-transparent"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{noteToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesPageContent />
    </ProtectedRoute>
  )
}