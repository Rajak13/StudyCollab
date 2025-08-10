/**
 * Platform Detection and Configuration System
 * Identifies web vs desktop environment and provides platform-specific configuration
 */

export interface PlatformInfo {
  isElectron: boolean
  isWeb: boolean
  platform: 'web' | 'desktop'
  os?: 'windows' | 'macos' | 'linux'
  userAgent?: string
}

export interface PlatformConfig {
  showLanding: boolean
  enableOfflineSync: boolean
  useNativeNotifications: boolean
  enableSystemTray: boolean
  customWindowControls: boolean
  enableGlobalShortcuts: boolean
  enableFileAssociations: boolean
}

export class PlatformDetection {
  private static _platformInfo: PlatformInfo | null = null
  private static _config: PlatformConfig | null = null

  /**
   * Detect the current platform environment
   */
  static detect(): PlatformInfo {
    if (this._platformInfo) {
      return this._platformInfo
    }

    // Check if we're in Electron environment
    const isElectron = this.isElectron()
    const isWeb = !isElectron

    let os: 'windows' | 'macos' | 'linux' | undefined

    if (typeof window !== 'undefined') {
      // Browser environment
      const userAgent = window.navigator.userAgent.toLowerCase()
      
      if (userAgent.includes('win')) {
        os = 'windows'
      } else if (userAgent.includes('mac')) {
        os = 'macos'
      } else if (userAgent.includes('linux')) {
        os = 'linux'
      }

      this._platformInfo = {
        isElectron,
        isWeb,
        platform: isElectron ? 'desktop' : 'web',
        os,
        userAgent: window.navigator.userAgent
      }
    } else {
      // Server-side environment
      this._platformInfo = {
        isElectron: false,
        isWeb: true,
        platform: 'web',
        os: undefined
      }
    }

    return this._platformInfo
  }

  /**
   * Check if running in Electron environment
   */
  static isElectron(): boolean {
    if (typeof window !== 'undefined') {
      // Check for Electron-specific globals
      return !!(
        (window as any).electronAPI ||
        (window as any).isElectron ||
        (window as any).process?.versions?.electron
      )
    }
    return false
  }

  /**
   * Get the operating system
   */
  static getOS(): string | undefined {
    const platformInfo = this.detect()
    return platformInfo.os
  }

  /**
   * Check if the landing page should be shown
   * Desktop users skip the landing page and go directly to the app
   */
  static shouldShowLanding(): boolean {
    const platformInfo = this.detect()
    const config = this.getConfig()
    
    // Desktop users skip landing page by default
    if (platformInfo.isElectron) {
      return false
    }
    
    return config.showLanding
  }

  /**
   * Check if running on desktop platform
   */
  static isDesktop(): boolean {
    return this.detect().platform === 'desktop'
  }

  /**
   * Check if running on web platform
   */
  static isWeb(): boolean {
    return this.detect().platform === 'web'
  }

  /**
   * Get platform-specific configuration
   */
  static getConfig(): PlatformConfig {
    if (this._config) {
      return this._config
    }

    const platformInfo = this.detect()

    // Default configuration based on platform
    this._config = {
      showLanding: platformInfo.isWeb, // Web shows landing, desktop skips it
      enableOfflineSync: platformInfo.isElectron, // Only desktop has offline sync
      useNativeNotifications: platformInfo.isElectron, // Desktop uses native notifications
      enableSystemTray: platformInfo.isElectron, // Only desktop has system tray
      customWindowControls: platformInfo.isElectron, // Desktop has custom window controls
      enableGlobalShortcuts: platformInfo.isElectron, // Desktop supports global shortcuts
      enableFileAssociations: platformInfo.isElectron, // Desktop supports file associations
    }

    return this._config
  }

  /**
   * Update platform configuration
   */
  static updateConfig(updates: Partial<PlatformConfig>): void {
    const currentConfig = this.getConfig()
    this._config = { ...currentConfig, ...updates }
  }

  /**
   * Reset cached platform information (useful for testing)
   */
  static reset(): void {
    this._platformInfo = null
    this._config = null
  }

  /**
   * Get platform-specific feature availability
   */
  static getFeatureAvailability() {
    const config = this.getConfig()
    const platformInfo = this.detect()

    return {
      // Core features available on both platforms
      taskManagement: true,
      notesTaking: true,
      studyGroups: true,
      resourceSharing: true,
      
      // Platform-specific features
      offlineSync: config.enableOfflineSync,
      nativeNotifications: config.useNativeNotifications,
      systemTray: config.enableSystemTray,
      globalShortcuts: config.enableGlobalShortcuts,
      fileAssociations: config.enableFileAssociations,
      customWindowControls: config.customWindowControls,
      
      // Web-specific features
      pwaInstall: platformInfo.isWeb,
      webNotifications: platformInfo.isWeb,
      
      // Desktop-specific features
      autoUpdater: platformInfo.isElectron,
      fileSystemAccess: platformInfo.isElectron,
      deepSystemIntegration: platformInfo.isElectron,
    }
  }

  /**
   * Get platform-specific routing configuration
   */
  static getRoutingConfig() {
    const platformInfo = this.detect()
    
    return {
      // Desktop users skip landing page
      skipLanding: platformInfo.isElectron,
      
      // Default route for each platform
      defaultRoute: platformInfo.isElectron ? '/dashboard' : '/',
      
      // Routes that should be disabled on certain platforms
      disabledRoutes: platformInfo.isElectron ? ['/download'] : [],
      
      // Platform-specific redirects
      redirects: platformInfo.isElectron ? {
        '/': '/dashboard',
        '/download': '/dashboard'
      } : {}
    }
  }
}

/**
 * React hook for platform detection
 */
export function usePlatformDetection() {
  const platformInfo = PlatformDetection.detect()
  const config = PlatformDetection.getConfig()
  const features = PlatformDetection.getFeatureAvailability()
  const routing = PlatformDetection.getRoutingConfig()

  return {
    platformInfo,
    config,
    features,
    routing,
    isElectron: platformInfo.isElectron,
    isWeb: platformInfo.isWeb,
    isDesktop: platformInfo.platform === 'desktop',
    shouldShowLanding: PlatformDetection.shouldShowLanding(),
    updateConfig: PlatformDetection.updateConfig,
  }
}

/**
 * Utility function to conditionally execute code based on platform
 */
export function withPlatform<T>(
  webCallback: () => T,
  desktopCallback: () => T
): T {
  const platformInfo = PlatformDetection.detect()
  return platformInfo.isElectron ? desktopCallback() : webCallback()
}

/**
 * Utility function to get platform-specific values
 */
export function platformValue<T>(webValue: T, desktopValue: T): T {
  const platformInfo = PlatformDetection.detect()
  return platformInfo.isElectron ? desktopValue : webValue
}