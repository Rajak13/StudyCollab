/**
 * Desktop Branding Component
 * Handles desktop-specific branding like window title and system tray
 */

'use client'

import { usePlatform } from '@/components/providers/platform-provider'
import { useBranding } from '@/hooks/use-branding'
import { useEffect } from 'react'

export function DesktopBranding() {
  const { isElectron } = usePlatform()
  const { config } = useBranding()

  useEffect(() => {
    if (!isElectron || typeof window === 'undefined' || !(window as any).electronAPI) {
      return
    }

    const updateDesktopBranding = async () => {
      try {
        const electronAPI = (window as any).electronAPI

        // Update window title
        if (config?.windowTitle) {
          await electronAPI.setWindowTitle(config.windowTitle)
        }

        // Update system tray tooltip
        if (config?.appName) {
          await electronAPI.setTrayTooltip(config.appName)
        }

        // Update system tray icon if configured
        if (config?.assets.tray) {
          await electronAPI.setTrayIcon(config.assets.tray)
        }

        // Update window icon if configured
        if (config?.assets.window) {
          await electronAPI.setWindowIcon(config.assets.window)
        }

        // Update app name in system
        if (config?.appName) {
          await electronAPI.setAppName(config.appName)
        }
      } catch (error) {
        console.warn('Failed to update desktop branding:', error)
      }
    }

    updateDesktopBranding()
  }, [isElectron, config])

  // Update document title for web compatibility
  useEffect(() => {
    if (config?.windowTitle) {
      document.title = config.windowTitle
    }
  }, [config?.windowTitle])

  // This component doesn't render anything visible
  return null
}

/**
 * Hook for desktop window title management
 */
export function useDesktopWindowTitle(pageTitle?: string) {
  const { config } = useBranding()
  const { isElectron } = usePlatform()

  useEffect(() => {
    const title = pageTitle ? `${pageTitle} - ${config.appName}` : config.windowTitle
    
    // Update document title
    document.title = title

    // Update Electron window title if available
    if (isElectron && typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        ;(window as any).electronAPI.setWindowTitle(title)
      } catch (error) {
        console.warn('Failed to update Electron window title:', error)
      }
    }
  }, [pageTitle, config, isElectron])
}

/**
 * Hook for system tray management
 */
export function useSystemTray() {
  const { config } = useBranding()
  const { isElectron } = usePlatform()

  const updateTrayIcon = async (iconPath: string) => {
    if (!isElectron || typeof window === 'undefined' || !(window as any).electronAPI) {
      return
    }

    try {
      await (window as any).electronAPI.setTrayIcon(iconPath)
    } catch (error) {
      console.warn('Failed to update tray icon:', error)
    }
  }

  const updateTrayTooltip = async (tooltip: string) => {
    if (!isElectron || typeof window === 'undefined' || !(window as any).electronAPI) {
      return
    }

    try {
      await (window as any).electronAPI.setTrayTooltip(tooltip)
    } catch (error) {
      console.warn('Failed to update tray tooltip:', error)
    }
  }

  const showTrayNotification = async (title: string, body: string) => {
    if (!isElectron || typeof window === 'undefined' || !(window as any).electronAPI) {
      return
    }

    try {
      await (window as any).electronAPI.showNotification(title, body)
    } catch (error) {
      console.warn('Failed to show tray notification:', error)
    }
  }

  return {
    updateTrayIcon,
    updateTrayTooltip,
    showTrayNotification,
    currentIcon: config?.assets.tray,
    currentTooltip: config?.appName
  }
}