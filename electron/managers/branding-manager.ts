/**
 * Electron Branding Manager
 * Handles desktop-specific branding operations
 */

import { app, BrowserWindow, nativeImage, Tray } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface BrandingManagerConfig {
  appName: string
  windowTitle: string
  windowIcon?: string
  trayIcon?: string
  trayTooltip?: string
}

export class BrandingManager {
  private mainWindow: BrowserWindow | null = null
  private tray: Tray | null = null
  private config: BrandingManagerConfig
  private configDir: string

  constructor(mainWindow?: BrowserWindow, tray?: Tray) {
    this.mainWindow = mainWindow || null
    this.tray = tray || null
    this.configDir = path.join(app.getPath('userData'), 'config')
    
    // Default configuration
    this.config = {
      appName: 'StudyCollab',
      windowTitle: 'StudyCollab - Collaborative Study Platform',
      trayTooltip: 'StudyCollab'
    }

    this.ensureConfigDirectory()
  }

  /**
   * Set the main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * Set the system tray reference
   */
  setTray(tray: Tray): void {
    this.tray = tray
  }

  /**
   * Update window title
   */
  async setWindowTitle(title: string): Promise<void> {
    this.config.windowTitle = title
    
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setTitle(title)
    }
    
    await this.saveConfig()
  }

  /**
   * Update window icon
   */
  async setWindowIcon(iconPath: string): Promise<void> {
    try {
      // Resolve the icon path
      const resolvedPath = await this.resolveAssetPath(iconPath)
      
      // Check if file exists
      await fs.access(resolvedPath)
      
      // Create native image
      const icon = nativeImage.createFromPath(resolvedPath)
      
      if (!icon.isEmpty()) {
        this.config.windowIcon = iconPath
        
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.setIcon(icon)
        }
        
        await this.saveConfig()
      } else {
        throw new Error('Invalid icon file')
      }
    } catch (error) {
      console.error('Failed to set window icon:', error)
      throw error
    }
  }

  /**
   * Update system tray icon
   */
  async setTrayIcon(iconPath: string): Promise<void> {
    try {
      // Resolve the icon path
      const resolvedPath = await this.resolveAssetPath(iconPath)
      
      // Check if file exists
      await fs.access(resolvedPath)
      
      // Create native image
      const icon = nativeImage.createFromPath(resolvedPath)
      
      if (!icon.isEmpty()) {
        this.config.trayIcon = iconPath
        
        if (this.tray && !this.tray.isDestroyed()) {
          this.tray.setImage(icon)
        }
        
        await this.saveConfig()
      } else {
        throw new Error('Invalid tray icon file')
      }
    } catch (error) {
      console.error('Failed to set tray icon:', error)
      throw error
    }
  }

  /**
   * Update system tray tooltip
   */
  async setTrayTooltip(tooltip: string): Promise<void> {
    this.config.trayTooltip = tooltip
    
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.setToolTip(tooltip)
    }
    
    await this.saveConfig()
  }

  /**
   * Update application name
   */
  async setAppName(name: string): Promise<void> {
    this.config.appName = name
    
    // Update app name in system
    app.setName(name)
    
    // Update window title if it contains the old app name
    if (this.config.windowTitle.includes(this.config.appName)) {
      const newTitle = this.config.windowTitle.replace(/^[^-]*-/, `${name} -`)
      await this.setWindowTitle(newTitle)
    }
    
    await this.saveConfig()
  }

  /**
   * Get current branding configuration
   */
  getConfig(): BrandingManagerConfig {
    return { ...this.config }
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<void> {
    try {
      const configPath = path.join(this.configDir, 'branding.json')
      const configData = await fs.readFile(configPath, 'utf-8')
      const savedConfig = JSON.parse(configData)
      
      this.config = { ...this.config, ...savedConfig }
      
      // Apply loaded configuration
      await this.applyConfig()
    } catch (error) {
      // Config file doesn't exist or is invalid, use defaults
      console.log('Using default branding configuration')
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(): Promise<void> {
    try {
      await this.ensureConfigDirectory()
      const configPath = path.join(this.configDir, 'branding.json')
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Failed to save branding configuration:', error)
    }
  }

  /**
   * Apply current configuration to the application
   */
  async applyConfig(): Promise<void> {
    try {
      // Apply window title
      if (this.config.windowTitle && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.setTitle(this.config.windowTitle)
      }

      // Apply window icon
      if (this.config.windowIcon) {
        try {
          const resolvedPath = await this.resolveAssetPath(this.config.windowIcon)
          await fs.access(resolvedPath)
          const icon = nativeImage.createFromPath(resolvedPath)
          
          if (!icon.isEmpty() && this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.setIcon(icon)
          }
        } catch (error) {
          console.warn('Failed to apply window icon:', error)
        }
      }

      // Apply tray icon
      if (this.config.trayIcon && this.tray && !this.tray.isDestroyed()) {
        try {
          const resolvedPath = await this.resolveAssetPath(this.config.trayIcon)
          await fs.access(resolvedPath)
          const icon = nativeImage.createFromPath(resolvedPath)
          
          if (!icon.isEmpty()) {
            this.tray.setImage(icon)
          }
        } catch (error) {
          console.warn('Failed to apply tray icon:', error)
        }
      }

      // Apply tray tooltip
      if (this.config.trayTooltip && this.tray && !this.tray.isDestroyed()) {
        this.tray.setToolTip(this.config.trayTooltip)
      }

      // Apply app name
      if (this.config.appName) {
        app.setName(this.config.appName)
      }
    } catch (error) {
      console.error('Failed to apply branding configuration:', error)
    }
  }

  /**
   * Read a configuration file from the config directory
   */
  async readConfigFile(fileName: string): Promise<string | null> {
    try {
      const filePath = path.join(this.configDir, fileName)
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      return null
    }
  }

  /**
   * Write a configuration file to the config directory
   */
  async writeConfigFile(fileName: string, content: string): Promise<void> {
    try {
      await this.ensureConfigDirectory()
      const filePath = path.join(this.configDir, fileName)
      await fs.writeFile(filePath, content, 'utf-8')
    } catch (error) {
      console.error('Failed to write config file:', error)
      throw error
    }
  }

  /**
   * Reset branding to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.config = {
      appName: 'StudyCollab',
      windowTitle: 'StudyCollab - Collaborative Study Platform',
      trayTooltip: 'StudyCollab'
    }
    
    await this.applyConfig()
    await this.saveConfig()
  }

  /**
   * Resolve asset path (handle both absolute and relative paths)
   */
  private async resolveAssetPath(assetPath: string): Promise<string> {
    if (path.isAbsolute(assetPath)) {
      return assetPath
    }
    
    // Try different possible locations
    const possiblePaths = [
      path.join(process.cwd(), 'public', assetPath.replace(/^\//, '')),
      path.join(process.cwd(), assetPath.replace(/^\//, '')),
      path.join(__dirname, '..', '..', 'public', assetPath.replace(/^\//, '')),
      path.join(app.getAppPath(), 'public', assetPath.replace(/^\//, '')),
    ]
    
    // Return the first path that exists, or the original path as fallback
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath)
        return possiblePath
      } catch {
        // Continue to next path
      }
    }
    
    return assetPath
  }

  /**
   * Ensure config directory exists
   */
  private async ensureConfigDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create config directory:', error)
    }
  }
}