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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { useUpdateNote } from '@/hooks/use-notes'
import { Note } from '@/types/database'
import { Copy, Globe, Lock } from 'lucide-react'
import { useState } from 'react'

interface NoteSharingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note | null
}

export function NoteSharingDialog({
  open,
  onOpenChange,
  note,
}: NoteSharingDialogProps) {
  const [isPublic, setIsPublic] = useState(note?.is_public || false)
  const updateNote = useUpdateNote()
  const { toast } = useToast()

  if (!note) return null

  const shareUrl = `${window.location.origin}/notes/shared/${note.id}`

  const handleVisibilityChange = async (newIsPublic: boolean) => {
    try {
      await updateNote.mutateAsync({
        id: note.id,
        data: { is_public: newIsPublic },
      })
      setIsPublic(newIsPublic)
      toast({
        title: 'Note updated',
        description: `Note is now ${newIsPublic ? 'public' : 'private'}`,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update note visibility',
        variant: 'destructive',
      })
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link copied',
        description: 'Share link copied to clipboard',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Control who can access &ldquo;{note.title}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visibility Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Visibility</Label>

            <RadioGroup
              value={isPublic ? 'public' : 'private'}
              onValueChange={(value) =>
                handleVisibilityChange(value === 'public')
              }
            >
              <div className="flex items-center space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="private" id="private" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <Label htmlFor="private" className="font-medium">
                      Private
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Only you can access this note
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="public" id="public" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <Label htmlFor="public" className="font-medium">
                      Public
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can view this note
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Share Link */}
          {isPublic && (
            <div className="space-y-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view your note
              </p>
            </div>
          )}

          {/* Additional Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Additional Settings</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Allow comments</Label>
                <p className="text-xs text-muted-foreground">
                  Let others comment on your public note
                </p>
              </div>
              <Switch disabled />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Show in public feed
                </Label>
                <p className="text-xs text-muted-foreground">
                  Make this note discoverable in the community
                </p>
              </div>
              <Switch disabled />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
