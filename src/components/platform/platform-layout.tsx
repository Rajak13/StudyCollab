'use client'

import { DesktopHomeScreen } from '@/components/desktop/desktop-home-screen'
import { useAuth } from '@/hooks/use-auth'
import { PlatformDetection } from '@/lib/platform-detection'
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

    const platformInfo = PlatformDetection.detect()
    const routingConfig = PlatformRouting.getConfig()

    // Handle desktop-specific routing
    if (platformInfo.isElectron) {
      // Desktop users should skip landing page
      if (pathname === '/') {
        const targetRoute = user ? '/dashboard' : '/desktop-home'
        router.replace(targetRoute)
        return
      }

      // Redirect disabled routes on desktop
      if (routingConfig.disabledRoutes.includes(pathname)) {
        router.replace('/dashboard')
        return
      }

      // Handle other desktop redirects
      const redirectTarget = PlatformRouting.getRedirectTarget(pathname)
      if (redirectTarget && redirectTarget !== pathname) {
        router.replace(redirectTarget)
        return
      }
    }

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

  // Handle desktop home screen
  const platformInfo = PlatformDetection.detect()
  if (platformInfo.isElectron && pathname === '/desktop-home') {
    return <DesktopHomeScreen />
  }

  // Handle landing page logic
  const shouldShowLanding = PlatformRouting.shouldShowLanding(pathname, !!user)
  if (shouldShowLanding) {
    return children // Show the landing page
  }

  // For all other routes, show the children
  return children
}

/**
 * Platform-aware navigation component
 */
export function PlatformNavigation() {
  const platformInfo = PlatformDetection.detect()
  const navigationItems = PlatformRouting.getNavigationItems()

  // Desktop uses different navigation (handled by Electron)
  if (platformInfo.isElectron) {
    return null
  }

  // Web navigation would be rendered here
  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

/**
 * Platform-specific route wrapper
 */
export function PlatformRoute({
  children,
  allowedPlatforms = ['web', 'desktop'],
  fallbackComponent,
}: {
  children: ReactNode
  allowedPlatforms?: ('web' | 'desktop')[]
  fallbackComponent?: ReactNode
}) {
  const platformInfo = PlatformDetection.detect()
  
  const isAllowed = allowedPlatforms.includes(platformInfo.platform)
  
  if (!isAllowed) {
    return fallbackComponent || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Platform Not Supported</h2>
          <p className="text-muted-foreground">
            This feature is not available on {platformInfo.platform} platform.
          </p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

/**
 * Desktop-only component wrapper
 */
export function DesktopOnly({ children }: { children: ReactNode }) {
  return (
    <PlatformRoute allowedPlatforms={['desktop']}>
      {children}
    </PlatformRoute>
  )
}

/**
 * Web-only component wrapper
 */
export function WebOnly({ children }: { children: ReactNode }) {
  return (
    <PlatformRoute allowedPlatforms={['web']}>
      {children}
    </PlatformRoute>
  )
}

/**
 * Platform-aware conditional rendering
 */
export function PlatformConditional({
  web,
  desktop,
}: {
  web?: ReactNode
  desktop?: ReactNode
}) {
  const platformInfo = PlatformDetection.detect()
  
  if (platformInfo.isElectron && desktop) {
    return <>{desktop}</>
  }
  
  if (platformInfo.isWeb && web) {
    return <>{web}</>
  }
  
  return null
}