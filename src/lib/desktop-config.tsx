/**
 * Desktop Configuration Manager
 * Handles desktop-specific configuration including branding, logos, and features
 */

import React from 'react'

export interface DesktopBrandingConfig {
  appName: string
  windowTitle: string
  description?: string
}

export interface DesktopLogoConfig {
  navbar?: string
  window?: string
  tray?: string
  splash?: string
}

export interface DesktopFeatureConfig {
  autoUpdater: boolean
  systemTray: boolean
  globalShortcuts: boolean
  fileAssociations: string[]
  customWindowControls: boolean
  offlineSync: boolean
  nativeNotifications: boolean
}

export interface DesktopWindowConfig {
  width: number
  height: number
  minWidth: number
  minHeight: number
  resizable: boolean
  maximizable: boolean
  minimizable: boolean
  fullscreenable: boolean
  titleBarStyle: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover'
  frame: boolean
  transparent: boolean
}

export interface DesktopConfig {
  branding: DesktopBrandingConfig
  logos: DesktopLogoConfig
  features: DesktopFeatureConfig
  window: DesktopWindowConfig
  shortcuts: Record<string, string>
  theme: {
    accentColor?: string
    darkMode?: boolean
  }
}

export class DesktopConfigManager {
  private static _config: DesktopConfig | null = null
  private static readonly CONFIG_KEY = 'desktop-config'

  /**
   * Load desktop configuration
   */
  static async loadConfig(): Promise<DesktopConfig> {
    if (this._config) {
      return this._config
    }

    // Try to load from Electron settings first
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const savedConfig = await (window as any).electronAPI.getSetting(this.CONFIG_KEY)
        if (savedConfig) {
          this._config = { ...this.getDefaultConfig(), ...savedConfig }
          return this._config
        }
      } catch (error) {
        console.warn('Failed to load desktop config from Electron:', error)
      }
    }

    // Fallback to localStorage for web or if Electron fails
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedConfig = localStorage.getItem(this.CONFIG_KEY)
        if (savedConfig) {
          this._config = { ...this.getDefaultConfig(), ...JSON.parse(savedConfig) }
          return this._config
        }
      } catch (error) {
        console.warn('Failed to load desktop config from localStorage:', error)
      }
    }

    // Return default configuration
    this._config = this.getDefaultConfig()
    return this._config
  }

  /**
   * Save desktop configuration
   */
  static async saveConfig(config: Partial<DesktopConfig>): Promise<void> {
    const currentConfig = await this.loadConfig()
    this._config = { ...currentConfig, ...config }

    // Save to Electron settings if available
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.setSetting(this.CONFIG_KEY, this._config)
      } catch (error) {
        console.warn('Failed to save desktop config to Electron:', error)
      }
    }

    // Also save to localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this._config))
      } catch (error) {
        console.warn('Failed to save desktop config to localStorage:', error)
      }
    }
  }

  /**
   * Get default desktop configuration
   */
  static getDefaultConfig(): DesktopConfig {
    return {
      branding: {
        appName: 'StudyCollab',
        windowTitle: 'StudyCollab - Collaborative Study Platform',
        description: 'A comprehensive study platform for students'
      },
      logos: {
        navbar: '/logo.png',
        window: '/icon.png',
        tray: '/tray-icon.png',
        splash: '/splash.png'
      },
      features: {
        autoUpdater: true,
        systemTray: true,
        globalShortcuts: true,
        fileAssociations: ['.scnote', '.sctask', '.scboard'],
        customWindowControls: true,
        offlineSync: true,
        nativeNotifications: true
      },
      window: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        maximizable: true,
        minimizable: true,
        fullscreenable: true,
        titleBarStyle: 'hidden',
        frame: false,
        transparent: false
      },
      shortcuts: {
        'CommandOrControl+Shift+S': 'quick-search',
        'CommandOrControl+Shift+N': 'new-note',
        'CommandOrControl+Shift+T': 'new-task',
        'CommandOrControl+Shift+G': 'open-groups',
        'CommandOrControl+Shift+D': 'toggle-dashboard'
      },
      theme: {
        accentColor: '#3b82f6',
        darkMode: false
      }
    }
  }

  /**
   * Update logo configuration
   */
  static async updateLogo(type: keyof DesktopLogoConfig, path: string): Promise<void> {
    const config = await this.loadConfig()
    config.logos[type] = path
    await this.saveConfig({ logos: config.logos })
  }

  /**
   * Update branding configuration
   */
  static async setBranding(branding: Partial<DesktopBrandingConfig>): Promise<void> {
    const config = await this.loadConfig()
    config.branding = { ...config.branding, ...branding }
    await this.saveConfig({ branding: config.branding })
  }

  /**
   * Update feature configuration
   */
  static async updateFeatures(features: Partial<DesktopFeatureConfig>): Promise<void> {
    const config = await this.loadConfig()
    config.features = { ...config.features, ...features }
    await this.saveConfig({ features: config.features })
  }

  /**
   * Update window configuration
   */
  static async updateWindow(window: Partial<DesktopWindowConfig>): Promise<void> {
    const config = await this.loadConfig()
    config.window = { ...config.window, ...window }
    await this.saveConfig({ window: config.window })
  }

  /**
   * Update keyboard shortcuts
   */
  static async updateShortcuts(shortcuts: Record<string, string>): Promise<void> {
    const config = await this.loadConfig()
    config.shortcuts = { ...config.shortcuts, ...shortcuts }
    await this.saveConfig({ shortcuts: config.shortcuts })
  }

  /**
   * Update theme configuration
   */
  static async updateTheme(theme: Partial<DesktopConfig['theme']>): Promise<void> {
    const config = await this.loadConfig()
    config.theme = { ...config.theme, ...theme }
    await this.saveConfig({ theme: config.theme })
  }

  /**
   * Get current configuration
   */
  static getConfig(): DesktopConfig | null {
    return this._config
  }

  /**
   * Reset configuration to defaults
   */
  static async resetConfig(): Promise<void> {
    this._config = this.getDefaultConfig()
    await this.saveConfig(this._config)
  }

  /**
   * Get logo path for specific type
   */
  static async getLogoPath(type: keyof DesktopLogoConfig): Promise<string | undefined> {
    const config = await this.loadConfig()
    return config.logos[type]
  }

  /**
   * Get branding information
   */
  static async getBranding(): Promise<DesktopBrandingConfig> {
    const config = await this.loadConfig()
    return config.branding
  }

  /**
   * Get feature configuration
   */
  static async getFeatures(): Promise<DesktopFeatureConfig> {
    const config = await this.loadConfig()
    return config.features
  }

  /**
   * Get window configuration
   */
  static async getWindowConfig(): Promise<DesktopWindowConfig> {
    const config = await this.loadConfig()
    return config.window
  }

  /**
   * Get keyboard shortcuts
   */
  static async getShortcuts(): Promise<Record<string, string>> {
    const config = await this.loadConfig()
    return config.shortcuts
  }

  /**
   * Check if a feature is enabled
   */
  static async isFeatureEnabled(feature: keyof DesktopFeatureConfig): Promise<boolean> {
    const config = await this.loadConfig()
    return config.features[feature] as boolean
  }

  /**
   * Export configuration for backup
   */
  static async exportConfig(): Promise<string> {
    const config = await this.loadConfig()
    return JSON.stringify(config, null, 2)
  }

  /**
   * Import configuration from backup
   */
  static async importConfig(configJson: string): Promise<void> {
    try {
      const config = JSON.parse(configJson) as DesktopConfig
      // Validate the configuration structure
      const defaultConfig = this.getDefaultConfig()
      const validatedConfig = {
        branding: { ...defaultConfig.branding, ...config.branding },
        logos: { ...defaultConfig.logos, ...config.logos },
        features: { ...defaultConfig.features, ...config.features },
        window: { ...defaultConfig.window, ...config.window },
        shortcuts: { ...defaultConfig.shortcuts, ...config.shortcuts },
        theme: { ...defaultConfig.theme, ...config.theme }
      }
      await this.saveConfig(validatedConfig)
    } catch (error) {
      throw new Error('Invalid configuration format')
    }
  }
}

/**
 * React hook for desktop configuration
 */
export function useDesktopConfig() {
  const [config, setConfig] = React.useState<DesktopConfig | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    DesktopConfigManager.loadConfig()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [])

  const updateConfig = React.useCallback(async (updates: Partial<DesktopConfig>) => {
    await DesktopConfigManager.saveConfig(updates)
    const newConfig = await DesktopConfigManager.loadConfig()
    setConfig(newConfig)
  }, [])

  return {
    config,
    loading,
    updateConfig,
    updateLogo: DesktopConfigManager.updateLogo,
    setBranding: DesktopConfigManager.setBranding,
    updateFeatures: DesktopConfigManager.updateFeatures,
    updateWindow: DesktopConfigManager.updateWindow,
    updateShortcuts: DesktopConfigManager.updateShortcuts,
    updateTheme: DesktopConfigManager.updateTheme,
    resetConfig: DesktopConfigManager.resetConfig,
    exportConfig: DesktopConfigManager.exportConfig,
    importConfig: DesktopConfigManager.importConfig,
  }
}



