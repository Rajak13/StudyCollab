'use client'

import { useAuth } from '@/hooks/use-auth'
import { PlatformRouting } from '@/lib/platform-routing'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

interface PlatformLayoutProps {
  children: ReactNode
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while auth is loading
    if (authLoading) return

    // Handle authentication-required routes
    if (PlatformRouting.requiresAuth(pathname) && !user && !authLoading) {
      router.replace('/login')
      return
    }

    // Handle authenticated users on public routes
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const targetRoute = PlatformRouting.getPostAuthRoute()
      router.replace(targetRoute)
      return
    }
  }, [pathname, user, authLoading, router])

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}