/**
 * Platform Detection and Configuration System
 * Identifies web environment and provides platform-specific configuration
 */

export interface PlatformInfo {
  isWeb: boolean
  platform: 'web'
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
        isWeb: true,
        platform: 'web',
        os,
        userAgent: window.navigator.userAgent
      }
    } else {
      // Server-side environment
      this._platformInfo = {
        isWeb: true,
        platform: 'web',
        os: undefined
      }
    }

    return this._platformInfo
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
   */
  static shouldShowLanding(): boolean {
    const config = this.getConfig()
    return config.showLanding
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

    // Default configuration for web platform
    this._config = {
      showLanding: true, // Web shows landing page
      enableOfflineSync: false, // Web doesn't have offline sync
      useNativeNotifications: false, // Web uses web notifications
      enableSystemTray: false, // Web doesn't have system tray
      customWindowControls: false, // Web doesn't have custom window controls
      enableGlobalShortcuts: false, // Web doesn't support global shortcuts
      enableFileAssociations: false, // Web doesn't support file associations
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
      // Core features available on web platform
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
      
      // Desktop-specific features (disabled for web)
      autoUpdater: false,
      fileSystemAccess: false,
      deepSystemIntegration: false,
    }
  }

  /**
   * Get platform-specific routing configuration
   */
  static getRoutingConfig() {
    return {
      // Web shows landing page
      skipLanding: false,
      
      // Default route for web
      defaultRoute: '/',
      
      // Routes that should be disabled on web
      disabledRoutes: [],
      
      // Platform-specific redirects
      redirects: {}
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
    isWeb: platformInfo.isWeb,
    shouldShowLanding: PlatformDetection.shouldShowLanding(),
    updateConfig: PlatformDetection.updateConfig,
  }
}