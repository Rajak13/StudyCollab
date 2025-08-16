'use client'

import { useAuth } from '@/hooks/use-auth'
import { PlatformDetection } from '@/lib/platform-detection'
import { cn } from '@/lib/utils'
import { ReactNode, useState } from 'react'
import { DesktopNavigation, DesktopSidebar } from './desktop-navigation'

interface DesktopLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  showNavigation?: boolean
  className?: string
}

export function DesktopLayout({
  children,
  showSidebar = true,
  showNavigation = true,
  className
}: DesktopLayoutProps) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Only render on desktop
  if (!PlatformDetection.isElectron()) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Desktop Navigation Bar */}
      {showNavigation && (
        <DesktopNavigation 
          showWindowControls={true}
          className="flex-shrink-0"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <DesktopSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0"
          />
        )}

        {/* Page Content */}
        <main className={cn(
          'flex-1 overflow-auto',
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * Desktop-specific app layout wrapper
 */
export function DesktopAppLayout({
  children,
  user
}: {
  children: ReactNode
  user?: { name: string; avatar?: string; email?: string } | null
}) {
  // Only render desktop layout on desktop platform
  if (!PlatformDetection.isElectron()) {
    return <>{children}</>
  }

  return (
    <DesktopLayout showSidebar={false} showNavigation={true}>
      <div className="p-6">
        {children}
      </div>
    </DesktopLayout>
  )
}

/**
 * Desktop home layout (no sidebar, just navigation)
 */
export function DesktopHomeLayout({
  children
}: {
  children: ReactNode
}) {
  // Only render desktop layout on desktop platform
  if (!PlatformDetection.isElectron()) {
    return <>{children}</>
  }

  return (
    <DesktopLayout showSidebar={false} showNavigation={true}>
      {children}
    </DesktopLayout>
  )
}

/**
 * Full-screen desktop layout (no navigation or sidebar)
 */
export function DesktopFullscreenLayout({
  children
}: {
  children: ReactNode
}) {
  // Only render desktop layout on desktop platform
  if (!PlatformDetection.isElectron()) {
    return <>{children}</>
  }

  return (
    <DesktopLayout showSidebar={false} showNavigation={false}>
      {children}
    </DesktopLayout>
  )
}