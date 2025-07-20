'use client'

import { cn } from '@/lib/utils'
import * as React from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showHeader?: boolean
  className?: string
  user?: {
    name: string
    avatar?: string
    email?: string
  } | null
}

export function AppLayout({
  children,
  showSidebar = true,
  showHeader = true,
  className,
  user,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {showHeader && <Header showNavigation={!showSidebar} user={user} />}

        {/* Page Content */}
        <main className={cn('flex-1 overflow-auto', className)}>
          {children}
        </main>
      </div>
    </div>
  )
}

// Layout variants for different page types
export function DashboardLayout({
  children,
  user,
}: {
  children: React.ReactNode
  user?: { name: string; avatar?: string } | null
}) {
  return (
    <AppLayout showSidebar={true} showHeader={true} user={user}>
      {children}
    </AppLayout>
  )
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      showSidebar={false}
      showHeader={false}
      className="flex items-center justify-center bg-muted/50"
    >
      {children}
    </AppLayout>
  )
}

export function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout showSidebar={false} showHeader={true}>
      {children}
    </AppLayout>
  )
}
