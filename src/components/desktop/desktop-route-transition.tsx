'use client'

import { PlatformDetection } from '@/lib/platform-detection'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

interface DesktopRouteTransitionProps {
  children: ReactNode
  className?: string
}

export function DesktopRouteTransition({
  children,
  className
}: DesktopRouteTransitionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [previousPath, setPreviousPath] = useState<string | null>(null)

  // Only handle transitions on desktop
  if (!PlatformDetection.isElectron()) {
    return <>{children}</>
  }

  useEffect(() => {
    if (previousPath && previousPath !== pathname) {
      setIsTransitioning(true)
      
      // Add transition effect
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 200)

      return () => clearTimeout(timer)
    }
    
    setPreviousPath(pathname)
  }, [pathname, previousPath])

  return (
    <div className={cn(
      'transition-all duration-200 ease-in-out',
      isTransitioning ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Hook for handling desktop navigation with transitions
 */
export function useDesktopNavigation() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const navigateWithTransition = async (route: string) => {
    // Check if we're on client side
    if (typeof window === 'undefined') {
      return
    }

    if (!PlatformDetection.isElectron()) {
      router.push(route)
      return
    }

    setIsTransitioning(true)
    
    // Add a small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 150))
    
    router.push(route)
    
    // Reset transition state after navigation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 200)
  }

  const navigateBack = async () => {
    // Check if we're on client side
    if (typeof window === 'undefined') {
      return
    }

    if (!PlatformDetection.isElectron()) {
      router.back()
      return
    }

    setIsTransitioning(true)
    
    await new Promise(resolve => setTimeout(resolve, 150))
    
    router.back()
    
    setTimeout(() => {
      setIsTransitioning(false)
    }, 200)
  }

  return {
    navigateWithTransition,
    navigateBack,
    isTransitioning
  }
}

/**
 * Desktop breadcrumb navigation component
 */
export function DesktopBreadcrumb({
  items,
  className
}: {
  items: Array<{ label: string; href?: string }>
  className?: string
}) {
  const { navigateWithTransition } = useDesktopNavigation()

  // Only render on desktop
  if (!PlatformDetection.isElectron()) {
    return null
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm text-muted-foreground', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href ? (
            <button
              onClick={() => navigateWithTransition(item.href!)}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

/**
 * Desktop page header with navigation
 */
export function DesktopPageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className
}: {
  title: string
  description?: string
  breadcrumb?: Array<{ label: string; href?: string }>
  actions?: ReactNode
  className?: string
}) {
  // Only render on desktop
  if (!PlatformDetection.isElectron()) {
    return null
  }

  return (
    <div className={cn('space-y-4 pb-6', className)}>
      {breadcrumb && <DesktopBreadcrumb items={breadcrumb} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}