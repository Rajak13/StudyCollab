/**
 * Platform-Specific Routing Logic
 * Handles routing differences between web and desktop platforms
 */

import React from 'react'
import { PlatformDetection } from './platform-detection'

export interface RouteConfig {
  path: string
  component: string
  platformRestriction?: 'web' | 'desktop' | 'both'
  requiresAuth?: boolean
  redirectTo?: string
}

export interface PlatformRoutingConfig {
  skipLanding: boolean
  defaultRoute: string
  disabledRoutes: string[]
  redirects: Record<string, string>
  authRedirect: string
  desktopHomeRoute: string
}

export class PlatformRouting {
  private static _config: PlatformRoutingConfig | null = null

  /**
   * Get platform-specific routing configuration
   */
  static getConfig(): PlatformRoutingConfig {
    if (this._config) {
      return this._config
    }

    const platformInfo = PlatformDetection.detect()
    
    this._config = {
      // Desktop users skip landing page
      skipLanding: platformInfo.isElectron,
      
      // Default route based on platform
      defaultRoute: platformInfo.isElectron ? '/dashboard' : '/',
      
      // Routes disabled on specific platforms
      disabledRoutes: platformInfo.isElectron ? ['/download', '/pricing'] : [],
      
      // Platform-specific redirects
      redirects: platformInfo.isElectron ? {
        '/': '/dashboard',
        '/download': '/dashboard',
        '/pricing': '/dashboard'
      } : {},
      
      // Where to redirect after authentication
      authRedirect: platformInfo.isElectron ? '/dashboard' : '/dashboard',
      
      // Desktop-specific home route
      desktopHomeRoute: '/desktop-home'
    }

    return this._config
  }

  /**
   * Check if a route should be accessible on current platform
   */
  static isRouteAllowed(path: string): boolean {
    const config = this.getConfig()
    return !config.disabledRoutes.includes(path)
  }

  /**
   * Get redirect target for a given path
   */
  static getRedirectTarget(path: string): string | null {
    const config = this.getConfig()
    return config.redirects[path] || null
  }

  /**
   * Get the appropriate landing route based on platform and auth status
   */
  static getLandingRoute(isAuthenticated: boolean): string {
    const config = this.getConfig()
    const platformInfo = PlatformDetection.detect()

    // Desktop users always go to dashboard or desktop home
    if (platformInfo.isElectron) {
      return isAuthenticated ? '/dashboard' : '/desktop-home'
    }

    // Web users go to landing page if not authenticated
    if (!isAuthenticated) {
      return '/'
    }

    // Authenticated web users go to dashboard
    return '/dashboard'
  }

  /**
   * Get the route to redirect to after authentication
   */
  static getPostAuthRoute(): string {
    const config = this.getConfig()
    return config.authRedirect
  }

  /**
   * Check if the current route should show the landing page
   */
  static shouldShowLanding(path: string, isAuthenticated: boolean): boolean {
    const config = this.getConfig()
    const platformInfo = PlatformDetection.detect()

    // Desktop never shows landing page
    if (platformInfo.isElectron) {
      return false
    }

    // Web shows landing page only on root path and when not authenticated
    return path === '/' && !isAuthenticated
  }

  /**
   * Get desktop-specific home route
   */
  static getDesktopHomeRoute(): string {
    const config = this.getConfig()
    return config.desktopHomeRoute
  }

  /**
   * Handle platform-specific navigation
   */
  static handleNavigation(
    currentPath: string,
    targetPath: string,
    isAuthenticated: boolean
  ): string {
    // Check if target route is allowed on current platform
    if (!this.isRouteAllowed(targetPath)) {
      return this.getConfig().defaultRoute
    }

    // Check for platform-specific redirects
    const redirectTarget = this.getRedirectTarget(targetPath)
    if (redirectTarget) {
      return redirectTarget
    }

    // Handle authentication-required routes
    if (this.requiresAuth(targetPath) && !isAuthenticated) {
      return '/login'
    }

    return targetPath
  }

  /**
   * Check if a route requires authentication
   */
  static requiresAuth(path: string): boolean {
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/privacy',
      '/terms',
      '/download',
      '/desktop-home'
    ]

    return !publicRoutes.includes(path) && !path.startsWith('/auth/')
  }

  /**
   * Get platform-specific navigation items
   */
  static getNavigationItems() {
    const platformInfo = PlatformDetection.detect()
    const features = PlatformDetection.getFeatureAvailability()

    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: 'home' },
      { path: '/tasks', label: 'Tasks', icon: 'check-square' },
      { path: '/notes', label: 'Notes', icon: 'file-text' },
      { path: '/study-groups', label: 'Study Groups', icon: 'users' },
      { path: '/files', label: 'Files', icon: 'folder' },
    ]

    // Add platform-specific items
    if (platformInfo.isWeb) {
      baseItems.push({ path: '/download', label: 'Download App', icon: 'download' })
    }

    if (features.offlineSync) {
      baseItems.push({ path: '/sync', label: 'Sync Status', icon: 'refresh-cw' })
    }

    return baseItems
  }

  /**
   * Get breadcrumb configuration for platform
   */
  static getBreadcrumbConfig(path: string) {
    const platformInfo = PlatformDetection.detect()
    
    // Desktop shows different breadcrumb structure
    if (platformInfo.isElectron) {
      return {
        showHome: false, // Desktop doesn't need "Home" breadcrumb
        homeLabel: 'Dashboard',
        separator: '/',
        maxItems: 4
      }
    }

    return {
      showHome: true,
      homeLabel: 'Home',
      separator: '/',
      maxItems: 3
    }
  }

  /**
   * Reset routing configuration (useful for testing)
   */
  static reset(): void {
    this._config = null
  }
}

/**
 * React hook for platform routing
 */
export function usePlatformRouting() {
  const config = PlatformRouting.getConfig()
  const platformInfo = PlatformDetection.detect()

  return {
    config,
    platformInfo,
    isRouteAllowed: PlatformRouting.isRouteAllowed,
    getRedirectTarget: PlatformRouting.getRedirectTarget,
    getLandingRoute: PlatformRouting.getLandingRoute,
    getPostAuthRoute: PlatformRouting.getPostAuthRoute,
    shouldShowLanding: PlatformRouting.shouldShowLanding,
    getDesktopHomeRoute: PlatformRouting.getDesktopHomeRoute,
    handleNavigation: PlatformRouting.handleNavigation,
    requiresAuth: PlatformRouting.requiresAuth,
    getNavigationItems: PlatformRouting.getNavigationItems,
    getBreadcrumbConfig: PlatformRouting.getBreadcrumbConfig,
  }
}

/**
 * Higher-order component for platform-specific routing
 */
export function withPlatformRouting<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function PlatformRoutingWrapper(props: T) {
    const routing = usePlatformRouting()
    
    return React.createElement(Component, {
      ...props,
      platformRouting: routing
    } as T & { platformRouting: ReturnType<typeof usePlatformRouting> })
  }
}

/**
 * Route guard component for platform-specific access
 */
export function PlatformRouteGuard({
  children,
  allowedPlatforms = ['web', 'desktop'],
  fallbackRoute = '/dashboard'
}: {
  children: React.ReactNode
  allowedPlatforms?: ('web' | 'desktop')[]
  fallbackRoute?: string
}) {
  const platformInfo = PlatformDetection.detect()
  
  const isAllowed = allowedPlatforms.includes(platformInfo.platform)
  
  if (!isAllowed) {
    // In a real app, this would trigger a navigation
    console.warn(`Route not allowed on ${platformInfo.platform} platform, should redirect to ${fallbackRoute}`)
    return null
  }
  
  return <>{children}</>
}

