'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildFolderTree,
  useCreateNoteFolder,
  useNoteFolders,
  useUpdateNoteFolder,
} from '@/hooks/use-note-folders'
import { NoteFolder } from '@/types/database'
import { useEffect, useState } from 'react'
import { JSX } from 'react/jsx-runtime'

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: NoteFolder | null
  parentId?: string
}

const FOLDER_COLORS = [
  { name: 'Gray', value: '#6B7280' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
]

export function FolderDialog({
  open,
  onOpenChange,
  folder,
  parentId,
}: FolderDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6B7280')
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(
    parentId
  )

  const { data: folders = [] } = useNoteFolders()
  const createFolder = useCreateNoteFolder()
  const updateFolder = useUpdateNoteFolder()

  const isEditing = !!folder
  const folderTree = buildFolderTree(folders)

  useEffect(() => {
    if (folder) {
      setName(folder.name)
      setColor(folder.color)
      setSelectedParentId(folder.parent_id || undefined)
    } else {
      setName('')
      setColor('#6B7280')
      setSelectedParentId(parentId)
    }
  }, [folder, parentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    try {
      if (isEditing && folder) {
        await updateFolder.mutateAsync({
          id: folder.id,
          data: {
            name: name.trim(),
            color,
            parent_id: selectedParentId || undefined,
          },
        })
      } else {
        await createFolder.mutateAsync({
          name: name.trim(),
          color,
          parent_id: selectedParentId,
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving folder:', error)
    }
  }

  const renderFolderOptions = (
    folders: (NoteFolder & { children: NoteFolder[] })[],
    level = 0
  ): JSX.Element[] => {
    return folders.flatMap((f) => {
      // Don't allow selecting the folder being edited or its descendants
      if (isEditing && folder && f.id === folder.id) {
        return []
      }

      const indent = '  '.repeat(level)
      const options: JSX.Element[] = [
        <SelectItem key={f.id} value={f.id}>
          {indent}
          {f.name}
        </SelectItem>,
      ]

      if (f.children && f.children.length > 0) {
        options.push(
          ...renderFolderOptions(
            f.children as (NoteFolder & { children: NoteFolder[] })[],
            level + 1
          )
        )
      }

      return options
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Folder' : 'Create Folder'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the folder name, color, and parent folder.'
              : 'Create a new folder to organize your notes.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 ${
                    color === colorOption.value
                      ? 'border-foreground'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  onClick={() => setColor(colorOption.value)}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Parent Folder</Label>
            <Select
              value={selectedParentId || 'root'}
              onValueChange={(value) =>
                setSelectedParentId(value === 'root' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No parent)</SelectItem>
                {renderFolderOptions(
                  folderTree as (NoteFolder & { children: NoteFolder[] })[],
                  0
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() || createFolder.isPending || updateFolder.isPending
              }
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
