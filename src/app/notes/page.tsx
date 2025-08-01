'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout'
import { FolderDialog } from '@/components/notes/folder-dialog'
import { FolderTree } from '@/components/notes/folder-tree'
import { NoteTemplate } from '@/components/notes/note-templates'
import { TemplateSelector } from '@/components/notes/template-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  useDeleteNoteFolder,
  useMoveNoteFolder,
  useNoteFolders,
} from '@/hooks/use-note-folders'
import { useNotes } from '@/hooks/use-notes'
import { NoteFolder } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, Eye, FileText, FolderPlus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function NotesPageContent() {
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null)
  const [parentFolderId, setParentFolderId] = useState<string | undefined>()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  const { user } = useAuth()
  const router = useRouter()
  const { data: notes = [], isLoading: notesLoading } = useNotes()
  useNoteFolders() // Hook needed for folder operations
  const deleteFolder = useDeleteNoteFolder()
  const moveFolder = useMoveNoteFolder()
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

  // Filter notes based on selected folder
  const filteredNotes = selectedFolderId
    ? notes.filter((note) => note.folder_id === selectedFolderId)
    : notes

  // Get recent notes (last 10) or all notes from selected folder
  const displayNotes = selectedFolderId
    ? filteredNotes.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    : notes
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 10)

  const handleTemplateSelect = (template: NoteTemplate) => {
    // Navigate to create page with template
    router.push(`/notes/create?template=${template.id}`)
    setShowTemplateSelector(false)
  }

  const handleFolderCreate = (parentId?: string) => {
    setParentFolderId(parentId)
    setEditingFolder(null)
    setShowFolderDialog(true)
  }

  const handleFolderEdit = (folder: NoteFolder) => {
    setEditingFolder(folder)
    setParentFolderId(undefined)
    setShowFolderDialog(true)
  }

  const handleFolderDelete = async (folder: NoteFolder) => {
    if (
      confirm(
        `Are you sure you want to delete the folder &ldquo;${folder.name}&rdquo;?`
      )
    ) {
      try {
        await deleteFolder.mutateAsync(folder.id)
        toast({
          title: 'Folder deleted',
          description: 'The folder has been deleted.',
        })
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to delete folder. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleFolderMove = async (
    folderId: string,
    newParentId: string | null
  ) => {
    try {
      await moveFolder.mutateAsync({ id: folderId, parentId: newParentId })
      toast({
        title: 'Folder moved',
        description: 'The folder has been moved.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to move folder. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId)
  }

  return (
    <DashboardLayout user={layoutUser}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 text-white shadow-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-slate-300">
                  My Notes
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Organize your thoughts and study materials
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={() => setShowTemplateSelector(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Note
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFolderCreate()}
                size="lg"
              >
                <FolderPlus className="mr-2 h-5 w-5" />
                New Folder
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Folders Section */}
            <div className="lg:col-span-1">
              <Card className="border-white/20 bg-white/50 shadow-xl backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderPlus className="h-5 w-5" />
                    Folders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FolderTree
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={handleFolderSelect}
                    onFolderCreate={handleFolderCreate}
                    onFolderEdit={handleFolderEdit}
                    onFolderDelete={handleFolderDelete}
                    onFolderMove={handleFolderMove}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Recent Notes Section */}
            <div className="lg:col-span-2">
              <Card className="border-white/20 bg-white/50 shadow-xl backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {selectedFolderId ? 'Folder Notes' : 'Recent Notes'}
                    </div>
                    {selectedFolderId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFolderId(null)}
                      >
                        Show All Notes
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notesLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                          <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                        </div>
                      ))}
                    </div>
                  ) : displayNotes.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                        No notes yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Use the &ldquo;Create Note&rdquo; button above to get
                        started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayNotes.map((note) => (
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
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {note.summary || 'No summary'}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
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
                              </div>
                            </div>
                            <Eye className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          </div>
                        </Link>
                      ))}

                      {notes.length > 10 && (
                        <div className="pt-4 text-center">
                          <Link href="/notes/all">
                            <Button variant="outline">
                              View All Notes ({notes.length})
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Template Selector Dialog */}
          <TemplateSelector
            open={showTemplateSelector}
            onOpenChange={setShowTemplateSelector}
            onTemplateSelect={handleTemplateSelect}
          />

          {/* Folder Dialog */}
          <FolderDialog
            open={showFolderDialog}
            onOpenChange={setShowFolderDialog}
            folder={editingFolder}
            parentId={parentFolderId}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesPageContent />
    </ProtectedRoute>
  )
}
