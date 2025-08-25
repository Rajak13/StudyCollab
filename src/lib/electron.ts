/**
 * Utility functions for Electron integration
 */

/**
 * Check if the app is running in Electron environment
 */
export const isElectron = (): boolean => {
  // Check if we're in a browser environment first
  if (typeof window === 'undefined') {
    return false
  }
  
  // Check for Electron-specific properties
  return !!(
    window.process &&
    window.process.type === 'renderer'
  ) || !!(
    window.navigator &&
    window.navigator.userAgent &&
    window.navigator.userAgent.toLowerCase().includes('electron')
  ) || !!(
    process.env.NEXT_PUBLIC_ELECTRON === 'true'
  )
}

/**
 * Check if the app is running in Electron development mode
 */
export const isElectronDev = (): boolean => {
  return isElectron() && process.env.NODE_ENV === 'development'
}

/**
 * Get the Electron API if available
 */
export const getElectronAPI = () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI
  }
  return null
}

/**
 * Type definitions for Electron API
 */
declare global {
  interface Window {
    electronAPI?: {
      // System Integration
      showNotification: (title: string, body: string) => void
      minimizeToTray: () => void
      setTrayBadge: (count: number) => void
      
      // File Operations
      openFile: () => Promise<string>
      saveFile: (content: string, filename: string) => Promise<void>
      watchFolder: (path: string) => Promise<void>
      
      // Window Management
      setWindowTitle: (title: string) => void
      toggleFullscreen: () => void
      getWindowBounds: () => { x: number; y: number; width: number; height: number }
      
      // App Lifecycle
      checkForUpdates: () => Promise<{ version: string; available: boolean }>
      restartApp: () => void
      getAppVersion: () => string
    }
    
    process?: {
      type: string
    }
  }
}