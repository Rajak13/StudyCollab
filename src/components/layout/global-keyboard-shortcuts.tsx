'use client'

import { Keyboard } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  let keyDisplay = shortcut.key.toUpperCase()
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

export function GlobalKeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  // Global shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 't',
      altKey: true,
      description: 'Go to Tasks'
    },
    {
      key: 'n',
      altKey: true,
      description: 'Go to Notes'
    },
    {
      key: 'b',
      altKey: true,
      description: 'Go to Study Boards'
    },
    {
      key: 'd',
      altKey: true,
      description: 'Go to Dashboard'
    },
    {
      key: 'f',
      altKey: true,
      description: 'Go to Files'
    },
    {
      key: 'g',
      altKey: true,
      description: 'Go to Groups'
    },
    {
      key: 's',
      altKey: true,
      description: 'Go to Search'
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts'
    }
  ]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.isContentEditable
      ) {
        return
      }

      // Show help with Shift + ?
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Global Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate quickly around StudyCollab.
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
          <strong>Tip:</strong> Press <Badge variant="outline" className="mx-1 px-1 py-0 text-xs">Shift</Badge> + <Badge variant="outline" className="mx-1 px-1 py-0 text-xs">?</Badge> anytime to see these shortcuts.
        </div>
      </DialogContent>
    </Dialog>
  )
}