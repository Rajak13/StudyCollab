'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useNoteFolders } from '@/hooks/use-note-folders'
import {
  useAutoSaveNote,
  useCreateNote,
  useUpdateNote,
} from '@/hooks/use-notes'
import { NoteFormData, noteSchema } from '@/lib/validations/notes'
import { CreateNoteData, Note } from '@/types/database'
import { zodResolver } from '@hookform/resolvers/zod'
import { JSONContent } from '@tiptap/react'
import {
  Eye,
  EyeOff,
  Folder,
  Hash,
  Maximize,
  Minimize,
  Plus,
  Save,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getDefaultTemplate, getTemplateById } from './note-templates'
import { TiptapEditor } from './tiptap-editor'

interface NoteEditorProps {
  note?: Note
  template?: string
  folderId?: string
  onSave?: (note: Note) => void
  onCancel?: () => void
  className?: string
}

export function NoteEditor({
  note,
  template,
  folderId,
  onSave,
  onCancel,
  className = '',
}: NoteEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [currentContent, setCurrentContent] = useState<JSONContent>()
  const [tagInput, setTagInput] = useState('')
  const { toast } = useToast()

  const router = useRouter()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const { autoSave, isAutoSaving } = useAutoSaveNote(note?.id || '')
  const { data: folders = [] } = useNoteFolders()

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title || '',
      content:
        note?.content ||
        (template
          ? getTemplateById(template)?.content
          : getDefaultTemplate().content) ||
        getDefaultTemplate().content,
      tags: note?.tags || [],
      is_public: note?.is_public || false,
      template:
        (note?.template as
          | 'basic'
          | 'cornell'
          | 'mindmap'
          | 'study'
          | 'meeting') ||
        (template as 'basic' | 'cornell' | 'mindmap' | 'study' | 'meeting') ||
        'basic',
      folder_id: note?.folder_id || folderId,
    },
  })

  const { watch, setValue, getValues } = form

  // Initialize content
  useEffect(() => {
    let initialContent = note?.content

    if (!initialContent && template) {
      // Use the selected template content
      const selectedTemplate = getTemplateById(template)
      initialContent = selectedTemplate?.content || getDefaultTemplate().content
    } else if (!initialContent) {
      // Fallback to default template
      initialContent = getDefaultTemplate().content
    }

    setCurrentContent(initialContent)
    setValue('content', initialContent)
  }, [note, template, setValue])

  // Auto-save functionality
  const handleContentChange = useCallback(
    (content: JSONContent) => {
      setCurrentContent(content)
      setValue('content', content)

      if (note?.id) {
        autoSave({
          content,
          title: getValues('title'),
        })
      }
    },
    [note?.id, autoSave, setValue, getValues]
  )

  // Handle manual save
  const handleSave = async () => {
    console.log('🔥 NoteEditor handleSave called', {
      isLoading,
      createNotePending: createNote.isPending,
      updateNotePending: updateNote.isPending,
      noteId: note?.id,
      timestamp: new Date().toISOString(),
    })

    if (isLoading || createNote.isPending || updateNote.isPending) {
      console.log('❌ NoteEditor handleSave blocked - already in progress')
      return // Prevent duplicate saves
    }

    try {
      const formData = getValues()

      // Ensure we have a title
      if (!formData.title || formData.title.trim() === '') {
        formData.title = 'Untitled Note'
      }

      // Ensure we have content
      if (!formData.content) {
        formData.content = getDefaultTemplate().content
      }

      console.log('📝 NoteEditor save data:', formData)

      if (note?.id) {
        console.log('✏️ NoteEditor updating existing note:', note.id)
        const updatedNote = await updateNote.mutateAsync({
          id: note.id,
          data: formData,
        })
        console.log('✅ NoteEditor note updated successfully:', updatedNote.id)
        onSave?.(updatedNote)
        toast({
          title: 'Note saved',
          description: 'Your note has been saved successfully.',
        })
      } else {
        console.log('🆕 NoteEditor creating new note')
        const createData: CreateNoteData = {
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          tags: formData.tags,
          is_public: formData.is_public,
          template: formData.template,
          folder_id: formData.folder_id,
        }
        console.log('📤 NoteEditor create data:', createData)
        const newNote = await createNote.mutateAsync(createData)
        console.log('✅ NoteEditor note created successfully:', newNote.id)
        if (onSave) {
          onSave(newNote)
        } else {
          // If no onSave callback, redirect to the created note
          try {
            router.push(`/notes/${newNote.id}`)
          } catch (error) {
            console.error('Router error:', error)
            // Fallback to window.location if router fails
            window.location.href = `/notes/${newNote.id}`
          }
        }
        toast({
          title: 'Note created',
          description: 'Your note has been created successfully.',
        })
      }
    } catch (error) {
      console.error('❌ NoteEditor save error:', error)
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !watch('tags')?.includes(tagInput.trim())) {
      const currentTags = watch('tags') || []
      setValue('tags', [...currentTags, tagInput.trim()])
      setTagInput('')
    }
  }

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || []
    setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove)
    )
  }

  // Handle key press for tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const isLoading = createNote.isPending || updateNote.isPending

  return (
    <div
      className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}
    >
      <Card className="flex h-full flex-col border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="mr-4 flex-1">
              <Input
                placeholder="Note title..."
                value={watch('title')}
                onChange={(e) => setValue('title', e.target.value)}
                className="border-none bg-transparent p-0 text-lg font-semibold text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 dark:text-white dark:placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-2">
              {isAutoSaving && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Saving...
                </span>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                title={isPreviewMode ? 'Edit mode' : 'Preview mode'}
              >
                {isPreviewMode ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>

              <Button onClick={handleSave} disabled={isLoading} size="sm">
                <Save className="mr-1 h-4 w-4" />
                {note?.id ? 'Save' : 'Create'}
              </Button>

              {onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Folder and Tags */}
          <div className="mt-2 space-y-2">
            {/* Folder Selection */}
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <Select
                value={watch('folder_id') || 'none'}
                onValueChange={(value) =>
                  setValue('folder_id', value === 'none' ? undefined : value)
                }
              >
                <SelectTrigger className="h-7 w-48 text-xs text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <SelectItem
                    value="none"
                    className="text-gray-900 dark:text-white"
                  >
                    No folder
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem
                      key={folder.id}
                      value={folder.id}
                      className="text-gray-900 dark:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: folder.color || '#6b7280' }}
                        />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              {watch('tags')?.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <Hash className="mr-1 h-3 w-3" />
                  {tag}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}

              <div className="flex items-center gap-1">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  className="h-6 w-20 border-gray-300 bg-white text-xs text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTag}
                  className="h-6 w-6 p-0 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden bg-white p-0 dark:bg-gray-800">
          <TiptapEditor
            content={currentContent}
            onChange={handleContentChange}
            editable={!isPreviewMode}
            showToolbar={!isPreviewMode}
            className="h-full"
            placeholder="Start writing your note..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
