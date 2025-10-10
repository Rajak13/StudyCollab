'use client';

import { PlatformDetection } from './platform-detection';

export interface RouteConfig {
  path: string
  component: string
  requiresAuth?: boolean
  redirectTo?: string
}

export interface PlatformRoutingConfig {
  defaultRoute: string
  disabledRoutes: string[]
  redirects: Record<string, string>
  authRedirect: string
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

    this._config = {
      defaultRoute: '/',
      disabledRoutes: [],
      redirects: {},
      authRedirect: '/dashboard',
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
    return path === '/' && !isAuthenticated
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
    ]

    return !publicRoutes.includes(path) && !path.startsWith('/auth/')
  }

  /**
   * Get platform-specific navigation items
   */
  static getNavigationItems() {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: 'home' },
      { path: '/tasks', label: 'Tasks', icon: 'check-square' },
      { path: '/notes', label: 'Notes', icon: 'file-text' },
      { path: '/study-groups', label: 'Study Groups', icon: 'users' },
      { path: '/files', label: 'Files', icon: 'folder' },
    ]

    return baseItems
  }

  /**
   * Get breadcrumb configuration for platform
   */
  static getBreadcrumbConfig(path: string) {
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
    getPostAuthRoute: PlatformRouting.getPostAuthRoute,
    shouldShowLanding: PlatformRouting.shouldShowLanding,
    handleNavigation: PlatformRouting.handleNavigation,
    requiresAuth: PlatformRouting.requiresAuth,
    getNavigationItems: PlatformRouting.getNavigationItems,
    getBreadcrumbConfig: PlatformRouting.getBreadcrumbConfig,
  }
}