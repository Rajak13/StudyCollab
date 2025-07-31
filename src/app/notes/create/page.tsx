'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout'
import { NoteEditor } from '@/components/notes/note-editor'
import { getTemplateById } from '@/components/notes/note-templates'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function CreateNotePageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const templateId = searchParams.get('template')
  const folderId = searchParams.get('folder')
  const template = templateId ? getTemplateById(templateId) : undefined

  const displayName = user?.user_metadata?.name || user?.email || 'User'

  // Transform Supabase user to layout user format
  const layoutUser = user
    ? {
        name: displayName,
        avatar: user.user_metadata?.avatar_url,
        email: user.email,
      }
    : null

  const handleCancel = () => {
    try {
      router.push('/notes')
    } catch (error) {
      console.error('Router error:', error)
      // Fallback to window.location if router fails
      window.location.href = '/notes'
    }
  }

  return (
    <AppLayout user={layoutUser}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Notes
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Create New Note
                {template && (
                  <span className="ml-2 text-lg font-normal text-muted-foreground">
                    using {template.name} template
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Editor */}
          <Card className="border-white/20 bg-white/50 shadow-xl backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/50">
            <CardContent className="p-6">
              <NoteEditor
                template={template?.id}
                folderId={folderId || undefined}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export default function CreateNotePage() {
  return (
    <ProtectedRoute>
      <CreateNotePageContent />
    </ProtectedRoute>
  )
}
