'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: () => void
  description: string
  global?: boolean // Whether this shortcut works globally or only on specific pages
}

interface KeyboardShortcutsContextType {
  registerShortcuts: (shortcuts: KeyboardShortcut[]) => void
  unregisterShortcuts: (shortcuts: KeyboardShortcut[]) => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null)

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider')
  }
  return context
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter()

  // Global shortcuts that work everywhere - using Alt key to avoid browser conflicts
  const activeGlobalShortcuts: KeyboardShortcut[] = [
    {
      key: 't',
      altKey: true,
      callback: () => router.push('/tasks'),
      description: 'Go to Tasks',
      global: true
    },
    {
      key: 'n',
      altKey: true,
      callback: () => router.push('/notes'),
      description: 'Go to Notes',
      global: true
    },
    {
      key: 'b',
      altKey: true,
      callback: () => router.push('/study-groups'),
      description: 'Go to Study Boards',
      global: true
    },
    {
      key: 'd',
      altKey: true,
      callback: () => router.push('/dashboard'),
      description: 'Go to Dashboard',
      global: true
    },
    {
      key: 'f',
      altKey: true,
      callback: () => router.push('/files'),
      description: 'Go to Files',
      global: true
    },
    {
      key: 'g',
      altKey: true,
      callback: () => router.push('/groups'),
      description: 'Go to Groups',
      global: true
    },
    {
      key: 's',
      altKey: true,
      callback: () => router.push('/search'),
      description: 'Go to Search',
      global: true
    },
  ]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.isContentEditable
      ) {
        return
      }

      // Check global shortcuts
      const matchingShortcut = activeGlobalShortcuts.find(shortcut => {
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
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const registerShortcuts = (shortcuts: KeyboardShortcut[]) => {
    // This would be used for page-specific shortcuts
    // For now, we'll keep it simple and just use the global ones
  }

  const unregisterShortcuts = (shortcuts: KeyboardShortcut[]) => {
    // This would be used to clean up page-specific shortcuts
  }

  return (
    <KeyboardShortcutsContext.Provider value={{ registerShortcuts, unregisterShortcuts }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

// Export the global shortcuts for help dialogs
export const globalShortcuts: KeyboardShortcut[] = [
  {
    key: 't',
    altKey: true,
    callback: () => {},
    description: 'Go to Tasks',
    global: true
  },
  {
    key: 'n',
    altKey: true,
    callback: () => {},
    description: 'Go to Notes',
    global: true
  },
  {
    key: 'b',
    altKey: true,
    callback: () => {},
    description: 'Go to Study Boards',
    global: true
  },
  {
    key: 'd',
    altKey: true,
    callback: () => {},
    description: 'Go to Dashboard',
    global: true
  },
  {
    key: 'f',
    altKey: true,
    callback: () => {},
    description: 'Go to Files',
    global: true
  },
  {
    key: 'g',
    altKey: true,
    callback: () => {},
    description: 'Go to Groups',
    global: true
  },
  {
    key: 's',
    altKey: true,
    callback: () => {},
    description: 'Go to Search',
    global: true
  },
]
