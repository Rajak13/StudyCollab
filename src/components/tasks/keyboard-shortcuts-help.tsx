'use client'

import { Keyboard } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  description: string
}

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: KeyboardShortcut[]
}

function ShortcutKey({ 
  shortcut, 
  className 
}: { 
  shortcut: KeyboardShortcut
  className?: string 
}) {
  const keys = []
  
  if (shortcut.ctrlKey || shortcut.metaKey) {
    keys.push(typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl')
  }
  if (shortcut.shiftKey) {
    keys.push('Shift')
  }
  if (shortcut.altKey) {
    keys.push('Alt')
  }
  
  // Format special keys
  let keyDisplay = shortcut.key
  if (shortcut.key === 'Enter') keyDisplay = '↵'
  if (shortcut.key === 'Delete') keyDisplay = 'Del'
  if (shortcut.key === ' ') keyDisplay = 'Space'
  if (shortcut.key === '?') keyDisplay = '?'
  
  keys.push(keyDisplay)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <Badge
          key={index}
          variant="outline"
          className="px-2 py-1 text-xs font-mono bg-gray-50 dark:bg-gray-800"
        >
          {key}
        </Badge>
      ))}
    </div>
  )
}

export function KeyboardShortcutsHelp({ 
  open, 
  onOpenChange, 
  shortcuts 
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and manage tasks more efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 py-2"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {shortcut.description}
              </span>
              <ShortcutKey shortcut={shortcut} />
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <strong>Note:</strong> Keyboard shortcuts are disabled when typing in input fields.
        </div>
      </DialogContent>
    </Dialog>
  )
}