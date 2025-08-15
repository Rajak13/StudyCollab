/**
 * Branding Configuration System
 * Manages custom logos and branding elements for both web and desktop platforms
 */

import { DesktopConfigManager } from './desktop-config'
import { EnvironmentConfigLoader } from './environment-config'
import { PlatformDetection } from './platform-detection'

export interface BrandingAssets {
  navbar: string
  window: string
  tray: string
  splash: string
  favicon: string
  hero?: string
}

export interface BrandingConfig {
  appName: string
  windowTitle: string
  description: string
  assets: BrandingAssets
  theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
  }
}

export interface BrandingConfigFile {
  version: string
  branding: BrandingConfig
  lastUpdated: string
}

export class BrandingConfigManager {
  private static _config: BrandingConfig | null = null
  private static readonly CONFIG_VERSION = '1.0.0'
  private static readonly CONFIG_FILE_NAME = 'branding-config.json'

  /**
   * Load branding configuration
   */
  static async loadConfig(): Promise<BrandingConfig> {
    if (this._config) {
      return this._config
    }

    const platformInfo = PlatformDetection.detect()

    // Try to load from custom configuration file first
    const customConfig = await this.loadCustomConfig()
    if (customConfig) {
      this._config = customConfig
      return this._config
    }

    // Load from platform-specific sources
    if (platformInfo.isElectron) {
      const desktopConfig = await DesktopConfigManager.loadConfig()
      this._config = this.mapDesktopConfig(desktopConfig)
    } else {
      const envConfig = await EnvironmentConfigLoader.loadConfig()
      this._config = this.mapEnvironmentConfig(envConfig)
    }

    return this._config
  }

  /**
   * Save branding configuration
   */
  static async saveConfig(config: Partial<BrandingConfig>): Promise<void> {
    const currentConfig = await this.loadConfig()
    this._config = { ...currentConfig, ...config }

    // Save to custom configuration file
    await this.saveCustomConfig(this._config)

    // Also update platform-specific configurations
    const platformInfo = PlatformDetection.detect()
    
    if (platformInfo.isElectron) {
      await this.updateDesktopConfig(this._config)
    } else {
      await this.updateEnvironmentConfig(this._config)
    }
  }

  /**
   * Update logo assets
   */
  static async updateLogos(logos: Partial<BrandingAssets>): Promise<void> {
    const config = await this.loadConfig()
    config.assets = { ...config.assets, ...logos }
    await this.saveConfig({ assets: config.assets })
  }

  /**
   * Update app branding
   */
  static async updateBranding(branding: Partial<Pick<BrandingConfig, 'appName' | 'windowTitle' | 'description'>>): Promise<void> {
    const config = await this.loadConfig()
    await this.saveConfig({ ...config, ...branding })
  }

  /**
   * Update theme configuration
   */
  static async updateTheme(theme: Partial<BrandingConfig['theme']>): Promise<void> {
    const config = await this.loadConfig()
    config.theme = { ...config.theme, ...theme }
    await this.saveConfig({ theme: config.theme })
  }

  /**
   * Get logo path for specific type
   */
  static async getLogoPath(type: keyof BrandingAssets): Promise<string> {
    const config = await this.loadConfig()
    return config.assets[type] || this.getDefaultAssets()[type]
  }

  /**
   * Get app name
   */
  static async getAppName(): Promise<string> {
    const config = await this.loadConfig()
    return config.appName
  }

  /**
   * Get window title
   */
  static async getWindowTitle(): Promise<string> {
    const config = await this.loadConfig()
    return config.windowTitle
  }

  /**
   * Check if custom logo is configured
   */
  static async hasCustomLogo(type: keyof BrandingAssets): Promise<boolean> {
    const config = await this.loadConfig()
    const defaultAssets = this.getDefaultAssets()
    return config.assets[type] !== defaultAssets[type]
  }

  /**
   * Reset to default configuration
   */
  static async resetToDefaults(): Promise<void> {
    this._config = this.getDefaultConfig()
    await this.saveCustomConfig(this._config)
  }

  /**
   * Export configuration for backup
   */
  static async exportConfig(): Promise<string> {
    const config = await this.loadConfig()
    const configFile: BrandingConfigFile = {
      version: this.CONFIG_VERSION,
      branding: config,
      lastUpdated: new Date().toISOString()
    }
    return JSON.stringify(configFile, null, 2)
  }

  /**
   * Import configuration from backup
   */
  static async importConfig(configJson: string): Promise<void> {
    try {
      const configFile = JSON.parse(configJson) as BrandingConfigFile
      
      // Validate configuration structure
      if (!configFile.branding || !configFile.version) {
        throw new Error('Invalid configuration format')
      }

      // Merge with defaults to ensure all required fields are present
      const defaultConfig = this.getDefaultConfig()
      const validatedConfig: BrandingConfig = {
        appName: configFile.branding.appName || defaultConfig.appName,
        windowTitle: configFile.branding.windowTitle || defaultConfig.windowTitle,
        description: configFile.branding.description || defaultConfig.description,
        assets: { ...defaultConfig.assets, ...configFile.branding.assets },
        theme: { ...defaultConfig.theme, ...configFile.branding.theme }
      }

      await this.saveConfig(validatedConfig)
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load custom configuration from file system or storage
   */
  private static async loadCustomConfig(): Promise<BrandingConfig | null> {
    const platformInfo = PlatformDetection.detect()

    // Try to load from Electron file system
    if (platformInfo.isElectron && typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const configData = await (window as any).electronAPI.readConfigFile(this.CONFIG_FILE_NAME)
        if (configData) {
          const configFile = JSON.parse(configData) as BrandingConfigFile
          return configFile.branding
        }
      } catch (error) {
        console.warn('Failed to load branding config from file:', error)
      }
    }

    // Try to load from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const configData = localStorage.getItem('branding-config')
        if (configData) {
          const configFile = JSON.parse(configData) as BrandingConfigFile
          return configFile.branding
        }
      } catch (error) {
        console.warn('Failed to load branding config from localStorage:', error)
      }
    }

    return null
  }

  /**
   * Save custom configuration to file system or storage
   */
  private static async saveCustomConfig(config: BrandingConfig): Promise<void> {
    const configFile: BrandingConfigFile = {
      version: this.CONFIG_VERSION,
      branding: config,
      lastUpdated: new Date().toISOString()
    }

    const configJson = JSON.stringify(configFile, null, 2)
    const platformInfo = PlatformDetection.detect()

    // Save to Electron file system
    if (platformInfo.isElectron && typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.writeConfigFile(this.CONFIG_FILE_NAME, configJson)
      } catch (error) {
        console.warn('Failed to save branding config to file:', error)
      }
    }

    // Also save to localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('branding-config', configJson)
      } catch (error) {
        console.warn('Failed to save branding config to localStorage:', error)
      }
    }
  }

  /**
   * Update desktop configuration with branding changes
   */
  private static async updateDesktopConfig(config: BrandingConfig): Promise<void> {
    try {
      await DesktopConfigManager.setBranding({
        appName: config.appName,
        windowTitle: config.windowTitle,
        description: config.description
      })

      await DesktopConfigManager.updateLogo('navbar', config.assets.navbar)
      await DesktopConfigManager.updateLogo('window', config.assets.window)
      await DesktopConfigManager.updateLogo('tray', config.assets.tray)
      await DesktopConfigManager.updateLogo('splash', config.assets.splash)

      await DesktopConfigManager.updateTheme({
        accentColor: config.theme.accentColor
      })
    } catch (error) {
      console.warn('Failed to update desktop config:', error)
    }
  }

  /**
   * Update environment configuration with branding changes
   */
  private static async updateEnvironmentConfig(config: BrandingConfig): Promise<void> {
    try {
      await EnvironmentConfigLoader.updateBranding({
        logoUrl: config.assets.navbar,
        faviconUrl: config.assets.favicon,
        themeColor: config.theme.primaryColor,
        backgroundColor: config.theme.backgroundColor
      })
    } catch (error) {
      console.warn('Failed to update environment config:', error)
    }
  }

  /**
   * Map desktop configuration to branding configuration
   */
  private static mapDesktopConfig(desktopConfig: any): BrandingConfig {
    return {
      appName: desktopConfig.branding?.appName || 'StudyCollab',
      windowTitle: desktopConfig.branding?.windowTitle || 'StudyCollab - Collaborative Study Platform',
      description: desktopConfig.branding?.description || 'A comprehensive study platform for students',
      assets: {
        navbar: desktopConfig.logos?.navbar || '/logo.png',
        window: desktopConfig.logos?.window || '/icon.png',
        tray: desktopConfig.logos?.tray || '/tray-icon.png',
        splash: desktopConfig.logos?.splash || '/splash.png',
        favicon: '/favicon.ico',
        hero: '/hero-image.jpg'
      },
      theme: {
        primaryColor: desktopConfig.theme?.accentColor || '#3b82f6',
        accentColor: desktopConfig.theme?.accentColor || '#3b82f6',
        backgroundColor: '#ffffff'
      }
    }
  }

  /**
   * Map environment configuration to branding configuration
   */
  private static mapEnvironmentConfig(envConfig: any): BrandingConfig {
    return {
      appName: envConfig.appName || 'StudyCollab',
      windowTitle: `${envConfig.appName || 'StudyCollab'} - Collaborative Study Platform`,
      description: 'A comprehensive study platform for students',
      assets: {
        navbar: envConfig.branding?.logoUrl || '/logo.png',
        window: '/icon.png',
        tray: '/tray-icon.png',
        splash: '/splash.png',
        favicon: envConfig.branding?.faviconUrl || '/favicon.ico',
        hero: '/hero-image.jpg'
      },
      theme: {
        primaryColor: envConfig.branding?.themeColor || '#3b82f6',
        accentColor: envConfig.branding?.themeColor || '#3b82f6',
        backgroundColor: envConfig.branding?.backgroundColor || '#ffffff'
      }
    }
  }

  /**
   * Get default branding configuration
   */
  private static getDefaultConfig(): BrandingConfig {
    return {
      appName: 'StudyCollab',
      windowTitle: 'StudyCollab - Collaborative Study Platform',
      description: 'A comprehensive study platform for students',
      assets: this.getDefaultAssets(),
      theme: {
        primaryColor: '#3b82f6',
        accentColor: '#3b82f6',
        backgroundColor: '#ffffff'
      }
    }
  }

  /**
   * Get default asset paths
   */
  private static getDefaultAssets(): BrandingAssets {
    return {
      navbar: '/logo.png',
      window: '/icon.png',
      tray: '/tray-icon.png',
      splash: '/splash.png',
      favicon: '/favicon.ico',
      hero: '/hero-image.jpg'
    }
  }

  /**
   * Get current configuration (cached)
   */
  static getConfig(): BrandingConfig | null {
    return this._config
  }

  /**
   * Reset cache
   */
  static reset(): void {
    this._config = null
  }
}