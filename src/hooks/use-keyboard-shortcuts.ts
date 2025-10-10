import { useCallback, useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      )
    })

    if (matchingShortcut) {
      event.preventDefault()
      matchingShortcut.callback()
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])

  return shortcuts
}

// Common keyboard shortcuts for task management
export const createTaskShortcuts = ({
  onNewTask,
  onToggleView,
  onSearch,
  onSelectAll,
  onBulkComplete,
  onBulkDelete,
  onRefresh,
}: {
  onNewTask?: () => void
  onToggleView?: () => void
  onSearch?: () => void
  onSelectAll?: () => void
  onBulkComplete?: () => void
  onBulkDelete?: () => void
  onRefresh?: () => void
}): KeyboardShortcut[] => [
  {
    key: 'n',
    ctrlKey: true,
    callback: () => onNewTask?.(),
    description: 'Create new task'
  },
  {
    key: 'v',
    ctrlKey: true,
    callback: () => onToggleView?.(),
    description: 'Toggle view mode'
  },
  {
    key: 'f',
    ctrlKey: true,
    callback: () => onSearch?.(),
    description: 'Focus search'
  },
  {
    key: 'a',
    ctrlKey: true,
    callback: () => onSelectAll?.(),
    description: 'Select all tasks'
  },
  {
    key: 'Enter',
    ctrlKey: true,
    callback: () => onBulkComplete?.(),
    description: 'Complete selected tasks'
  },
  {
    key: 'Delete',
    callback: () => onBulkDelete?.(),
    description: 'Delete selected tasks'
  },
  {
    key: 'r',
    ctrlKey: true,
    callback: () => onRefresh?.(),
    description: 'Refresh tasks'
  },
  {
    key: '?',
    shiftKey: true,
    callback: () => {
      // This will be handled by the shortcuts help dialog
    },
    description: 'Show keyboard shortcuts'
  }
]