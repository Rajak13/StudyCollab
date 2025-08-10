/**
 * Environment-Specific Configuration Loader
 * Handles loading of platform and environment-specific settings
 */

import React from 'react'
import { PlatformDetection } from './platform-detection'

export interface EnvironmentConfig {
  apiUrl: string
  wsUrl: string
  appName: string
  appVersion: string
  environment: 'development' | 'production' | 'test'
  features: {
    analytics: boolean
    errorReporting: boolean
    debugMode: boolean
    hotReload: boolean
  }
  branding: {
    logoUrl: string
    faviconUrl: string
    themeColor: string
    backgroundColor: string
  }
  integrations: {
    supabaseUrl: string
    supabaseAnonKey: string
    enableRealtime: boolean
  }
  desktop?: {
    autoUpdater: {
      enabled: boolean
      checkInterval: number
      updateUrl?: string
    }
    window: {
      width: number
      height: number
      minWidth: number
      minHeight: number
    }
    features: {
      systemTray: boolean
      globalShortcuts: boolean
      fileAssociations: boolean
      nativeNotifications: boolean
    }
  }
}

export class EnvironmentConfigLoader {
  private static _config: EnvironmentConfig | null = null
  private static readonly CONFIG_CACHE_KEY = 'environment-config'

  /**
   * Load environment-specific configuration
   */
  static async loadConfig(): Promise<EnvironmentConfig> {
    if (this._config) {
      return this._config
    }

    const platformInfo = PlatformDetection.detect()
    const environment = this.getEnvironment()

    // Base configuration
    const baseConfig: EnvironmentConfig = {
      apiUrl: this.getApiUrl(),
      wsUrl: this.getWebSocketUrl(),
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'StudyCollab',
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
      environment,
      features: {
        analytics: environment === 'production',
        errorReporting: environment === 'production',
        debugMode: environment === 'development',
        hotReload: environment === 'development'
      },
      branding: {
        logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png',
        faviconUrl: process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico',
        themeColor: process.env.NEXT_PUBLIC_THEME_COLOR || '#3b82f6',
        backgroundColor: process.env.NEXT_PUBLIC_BG_COLOR || '#ffffff'
      },
      integrations: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false'
      }
    }

    // Add desktop-specific configuration
    if (platformInfo.isElectron) {
      baseConfig.desktop = {
        autoUpdater: {
          enabled: environment === 'production',
          checkInterval: 60 * 60 * 1000, // 1 hour
          updateUrl: process.env.NEXT_PUBLIC_UPDATE_URL
        },
        window: {
          width: parseInt(process.env.NEXT_PUBLIC_WINDOW_WIDTH || '1200'),
          height: parseInt(process.env.NEXT_PUBLIC_WINDOW_HEIGHT || '800'),
          minWidth: parseInt(process.env.NEXT_PUBLIC_MIN_WIDTH || '800'),
          minHeight: parseInt(process.env.NEXT_PUBLIC_MIN_HEIGHT || '600')
        },
        features: {
          systemTray: process.env.NEXT_PUBLIC_SYSTEM_TRAY !== 'false',
          globalShortcuts: process.env.NEXT_PUBLIC_GLOBAL_SHORTCUTS !== 'false',
          fileAssociations: process.env.NEXT_PUBLIC_FILE_ASSOCIATIONS !== 'false',
          nativeNotifications: process.env.NEXT_PUBLIC_NATIVE_NOTIFICATIONS !== 'false'
        }
      }
    }

    // Load custom configuration overrides
    const customConfig = await this.loadCustomConfig()
    if (customConfig) {
      this._config = this.mergeConfigs(baseConfig, customConfig)
    } else {
      this._config = baseConfig
    }

    return this._config
  }

  /**
   * Get current environment
   */
  private static getEnvironment(): 'development' | 'production' | 'test' {
    if (typeof window !== 'undefined') {
      // Client-side detection
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development'
      }
      return 'production'
    }

    // Server-side detection
    return (process.env.NODE_ENV as any) || 'development'
  }

  /**
   * Get API URL based on environment
   */
  private static getApiUrl(): string {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }

    const environment = this.getEnvironment()
    
    if (environment === 'development') {
      return 'http://localhost:3000/api'
    }

    return '/api' // Use relative URL in production
  }

  /**
   * Get WebSocket URL based on environment
   */
  private static getWebSocketUrl(): string {
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL
    }

    const environment = this.getEnvironment()
    
    if (environment === 'development') {
      return 'ws://localhost:3001'
    }

    // In production, use the same host with wss
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.host}`
    }

    return 'wss://studycollab.app'
  }

  /**
   * Load custom configuration from storage or file
   */
  private static async loadCustomConfig(): Promise<Partial<EnvironmentConfig> | null> {
    const platformInfo = PlatformDetection.detect()

    // Try to load from Electron settings first
    if (platformInfo.isElectron && typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const config = await (window as any).electronAPI.getSetting('environment-config')
        return config || null
      } catch (error) {
        console.warn('Failed to load config from Electron:', error)
      }
    }

    // Try to load from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const config = localStorage.getItem(this.CONFIG_CACHE_KEY)
        return config ? JSON.parse(config) : null
      } catch (error) {
        console.warn('Failed to load config from localStorage:', error)
      }
    }

    return null
  }

  /**
   * Save custom configuration
   */
  static async saveCustomConfig(config: Partial<EnvironmentConfig>): Promise<void> {
    const platformInfo = PlatformDetection.detect()

    // Save to Electron settings if available
    if (platformInfo.isElectron && typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.setSetting('environment-config', config)
      } catch (error) {
        console.warn('Failed to save config to Electron:', error)
      }
    }

    // Also save to localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.CONFIG_CACHE_KEY, JSON.stringify(config))
      } catch (error) {
        console.warn('Failed to save config to localStorage:', error)
      }
    }

    // Update cached config
    if (this._config) {
      this._config = this.mergeConfigs(this._config, config)
    }
  }

  /**
   * Merge configuration objects
   */
  private static mergeConfigs(
    base: EnvironmentConfig,
    override: Partial<EnvironmentConfig>
  ): EnvironmentConfig {
    return {
      ...base,
      ...override,
      features: { ...base.features, ...override.features },
      branding: { ...base.branding, ...override.branding },
      integrations: { ...base.integrations, ...override.integrations },
      desktop: base.desktop ? {
        ...base.desktop,
        ...override.desktop,
        autoUpdater: { ...base.desktop.autoUpdater, ...override.desktop?.autoUpdater },
        window: { ...base.desktop.window, ...override.desktop?.window },
        features: { ...base.desktop.features, ...override.desktop?.features }
      } : override.desktop
    }
  }

  /**
   * Get current configuration
   */
  static getConfig(): EnvironmentConfig | null {
    return this._config
  }

  /**
   * Reset configuration cache
   */
  static reset(): void {
    this._config = null
  }

  /**
   * Get platform-specific configuration
   */
  static async getPlatformConfig() {
    const config = await this.loadConfig()
    const platformInfo = PlatformDetection.detect()

    return {
      ...config,
      platform: platformInfo.platform,
      isElectron: platformInfo.isElectron,
      desktop: platformInfo.isElectron ? config.desktop : undefined
    }
  }

  /**
   * Update branding configuration
   */
  static async updateBranding(branding: Partial<EnvironmentConfig['branding']>): Promise<void> {
    const currentConfig = await this.loadConfig()
    const updatedConfig = {
      branding: { ...currentConfig.branding, ...branding }
    }
    await this.saveCustomConfig(updatedConfig)
  }

  /**
   * Update feature flags
   */
  static async updateFeatures(features: Partial<EnvironmentConfig['features']>): Promise<void> {
    const currentConfig = await this.loadConfig()
    const updatedConfig = {
      features: { ...currentConfig.features, ...features }
    }
    await this.saveCustomConfig(updatedConfig)
  }

  /**
   * Check if a feature is enabled
   */
  static async isFeatureEnabled(feature: keyof EnvironmentConfig['features']): Promise<boolean> {
    const config = await this.loadConfig()
    return config.features[feature]
  }
}

/**
 * React hook for environment configuration
 */
export function useEnvironmentConfig() {
  const [config, setConfig] = React.useState<EnvironmentConfig | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    EnvironmentConfigLoader.loadConfig()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [])

  const updateBranding = React.useCallback(async (branding: Partial<EnvironmentConfig['branding']>) => {
    await EnvironmentConfigLoader.updateBranding(branding)
    const newConfig = await EnvironmentConfigLoader.loadConfig()
    setConfig(newConfig)
  }, [])

  const updateFeatures = React.useCallback(async (features: Partial<EnvironmentConfig['features']>) => {
    await EnvironmentConfigLoader.updateFeatures(features)
    const newConfig = await EnvironmentConfigLoader.loadConfig()
    setConfig(newConfig)
  }, [])

  return {
    config,
    loading,
    updateBranding,
    updateFeatures,
    isFeatureEnabled: EnvironmentConfigLoader.isFeatureEnabled,
    saveCustomConfig: EnvironmentConfigLoader.saveCustomConfig,
  }
}

