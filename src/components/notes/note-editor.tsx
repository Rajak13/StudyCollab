'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
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
  Hash,
  Maximize,
  Minimize,
  Plus,
  Save,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getDefaultTemplate } from './note-templates'
import { TiptapEditor } from './tiptap-editor'

interface NoteEditorProps {
  note?: Note
  template?: string
  onSave?: (note: Note) => void
  onCancel?: () => void
  className?: string
}

export function NoteEditor({
  note,
  template,
  onSave,
  onCancel,
  className = '',
}: NoteEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [currentContent, setCurrentContent] = useState<JSONContent>()
  const [tagInput, setTagInput] = useState('')
  const { toast } = useToast()

  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const { autoSave, isAutoSaving } = useAutoSaveNote(note?.id || '')

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || getDefaultTemplate().content,
      tags: note?.tags || [],
      is_public: note?.is_public || false,
      template:
        (note?.template as 'basic' | 'cornell' | 'mindmap') ||
        (template as 'basic' | 'cornell' | 'mindmap') ||
        'basic',
    },
  })

  const { watch, setValue, getValues } = form

  // Initialize content
  useEffect(() => {
    const initialContent = note?.content || getDefaultTemplate().content
    setCurrentContent(initialContent)
    setValue('content', initialContent)
  }, [note, setValue])

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

      console.log('Saving note with data:', formData)

      if (note?.id) {
        const updatedNote = await updateNote.mutateAsync({
          id: note.id,
          data: formData,
        })
        onSave?.(updatedNote)
        toast({
          title: 'Note saved',
          description: 'Your note has been saved successfully.',
        })
      } else {
        const createData: CreateNoteData = {
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          tags: formData.tags,
          is_public: formData.is_public,
          template: formData.template,
          folder_id: formData.folder_id,
        }
        const newNote = await createNote.mutateAsync(createData)
        onSave?.(newNote)
        toast({
          title: 'Note created',
          description: 'Your note has been created successfully.',
        })
      }
    } catch (error) {
      console.error('Save error:', error)
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
      className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
    >
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="mr-4 flex-1">
              <Input
                placeholder="Note title..."
                value={watch('title')}
                onChange={(e) => setValue('title', e.target.value)}
                className="border-none p-0 text-lg font-semibold focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-2">
              {isAutoSaving && (
                <span className="text-xs text-muted-foreground">Saving...</span>
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

          {/* Tags */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
                className="h-6 w-20 text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddTag}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
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
