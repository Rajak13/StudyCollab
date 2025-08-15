'use client'

import { LogoDisplay } from '@/components/branding/logo-display'
import { Button } from '@/components/ui/button'
import { useBranding } from '@/hooks/use-branding'
import { useElectron } from '@/hooks/use-electron'
import { PlatformDetection } from '@/lib/platform-detection'
import { cn } from '@/lib/utils'
import {
    Bell,
    Home,
    Maximize2,
    Minimize2,
    Minus,
    Search,
    Settings,
    X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DesktopNavigationProps {
  showWindowControls?: boolean
  customLogo?: string
  onMinimize?: () => void
  onMaximize?: () => void
  onClose?: () => void
  className?: string
}

export function DesktopNavigation({
  showWindowControls = true,
  customLogo,
  onMinimize,
  onMaximize,
  onClose,
  className
}: DesktopNavigationProps) {
  const { config } = useBranding()
  const { electronAPI } = useElectron()
  const pathname = usePathname()
  const [isMaximized, setIsMaximized] = useState(false)
  const [notifications, setNotifications] = useState(0)

  // Only render on desktop
  if (!PlatformDetection.isElectron()) {
    return null
  }

  useEffect(() => {
    // Listen for window state changes
    if (electronAPI) {
      const handleWindowStateChange = (state: { isMaximized: boolean }) => {
        setIsMaximized(state.isMaximized)
      }

      // Set up listeners for window state
      electronAPI.onWindowStateChange?.(handleWindowStateChange)

      // Get initial window state
      electronAPI.getWindowState?.().then((state) => {
        setIsMaximized(state.isMaximized)
      })
    }
  }, [electronAPI])

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize()
    } else if (electronAPI) {
      electronAPI.minimizeWindow?.()
    }
  }

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize()
    } else if (electronAPI) {
      if (isMaximized) {
        electronAPI.unmaximizeWindow?.()
      } else {
        electronAPI.maximizeWindow?.()
      }
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else if (electronAPI) {
      electronAPI.closeWindow?.()
    }
  }

  const quickActions = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-4 w-4" />,
      href: '/dashboard',
      shortcut: 'Ctrl+Shift+H'
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-4 w-4" />,
      href: '/search',
      shortcut: 'Ctrl+Shift+S'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      href: '/settings',
      shortcut: 'Ctrl+,'
    }
  ]

  return (
    <div 
      className={cn(
        'flex h-12 w-full items-center justify-between bg-background/95 backdrop-blur border-b border-border',
        'select-none', // Prevent text selection in title bar
        className
      )}
      style={{ 
        // Make the title bar draggable
        WebkitAppRegion: 'drag'
      }}
    >
      {/* Left side - Logo and App Name */}
      <div className="flex items-center space-x-3 px-4">
        <LogoDisplay
          type="window"
          width={24}
          height={24}
          className="rounded"
          fallback={
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          }
        />
        <span className="text-sm font-semibold text-foreground">
          {config.appName}
        </span>
      </div>

      {/* Center - Quick Actions */}
      <div 
        className="flex items-center space-x-1"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {quickActions.map((action) => {
          const isActive = pathname === action.href
          return (
            <Link key={action.id} href={action.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3 text-xs"
                title={`${action.label} (${action.shortcut})`}
              >
                {action.icon}
                <span className="ml-1 hidden sm:inline">{action.label}</span>
              </Button>
            </Link>
          )
        })}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </Button>
      </div>

      {/* Right side - Window Controls */}
      {showWindowControls && (
        <div 
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            className="h-8 w-8 p-0 hover:bg-muted rounded-none"
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMaximize}
            className="h-8 w-8 p-0 hover:bg-muted rounded-none"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white rounded-none"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Desktop-specific sidebar navigation
 */
export function DesktopSidebar({
  isOpen = true,
  onToggle,
  className
}: {
  isOpen?: boolean
  onToggle?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const { config } = useBranding()

  // Only render on desktop
  if (!PlatformDetection.isElectron()) {
    return null
  }

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      shortcut: 'Ctrl+Shift+D'
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      shortcut: 'Ctrl+Shift+T'
    },
    {
      title: 'Notes',
      href: '/notes',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      shortcut: 'Ctrl+Shift+N'
    },
    {
      title: 'Study Groups',
      href: '/study-groups',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      shortcut: 'Ctrl+Shift+G'
    },
    {
      title: 'Files',
      href: '/files',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    }
  ]

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col bg-background border-r transition-all duration-300',
        !isOpen && 'w-16',
        className
      )}
    >
      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-4 pt-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !isOpen && 'justify-center px-2'
              )}
              title={!isOpen ? `${item.title}${item.shortcut ? ` (${item.shortcut})` : ''}` : undefined}
            >
              {item.icon}
              {isOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.title}</span>
                  {item.shortcut && (
                    <span className="text-xs opacity-60">{item.shortcut}</span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sidebar Toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'w-full justify-start',
            !isOpen && 'justify-center px-2'
          )}
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <svg
            className={cn(
              'h-4 w-4 transition-transform',
              !isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {isOpen && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}