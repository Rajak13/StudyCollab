/**
 * Desktop-specific routing utilities for Electron app
 */

import { useDesktopAPI } from '@/hooks/useDesktopAPI'
import { useRouter } from 'next/navigation'

export interface DesktopRoute {
  path: string
  title?: string
  isElectronOnly?: boolean
}

/**
 * Desktop router hook that provides enhanced navigation for Electron environment
 */
export function useDesktopRouter() {
  const router = useRouter()
  const { isElectron, desktopAPI } = useDesktopAPI()

  const navigate = async (path: string, options?: { title?: string; replace?: boolean }) => {
    // Update window title if in Electron
    if (isElectron && options?.title) {
      try {
        await desktopAPI.setWindowTitle(options.title)
      } catch (error) {
        console.warn('Failed to set window title:', error)
      }
    }

    // Navigate using Next.js router
    if (options?.replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
  }

  const navigateToDesktopLanding = () => {
    navigate('/desktop-landing', { title: 'StudyCollab - Welcome' })
  }

  const navigateToApp = () => {
    navigate('/dashboard', { title: 'StudyCollab - Dashboard' })
  }

  const navigateBack = () => {
    router.back()
  }

  const navigateForward = () => {
    router.forward()
  }

  return {
    navigate,
    navigateToDesktopLanding,
    navigateToApp,
    navigateBack,
    navigateForward,
    isElectron
  }
}

/**
 * Desktop-specific routes configuration
 */
export const desktopRoutes: DesktopRoute[] = [
  {
    path: '/desktop-landing',
    title: 'StudyCollab - Welcome',
    isElectronOnly: true
  },
  {
    path: '/dashboard',
    title: 'StudyCollab - Dashboard'
  },
  {
    path: '/study-boards',
    title: 'StudyCollab - Study Boards'
  },
  {
    path: '/files',
    title: 'StudyCollab - Files'
  },
  {
    path: '/settings',
    title: 'StudyCollab - Settings'
  }
]

/**
 * Check if a route is available in the current environment
 */
export function isRouteAvailable(route: DesktopRoute, isElectron: boolean): boolean {
  if (route.isElectronOnly && !isElectron) {
    return false
  }
  return true
}

/**
 * Get the appropriate landing route based on environment
 */
export function getLandingRoute(isElectron: boolean): string {
  return isElectron ? '/desktop-landing' : '/dashboard'
}