/**
 * Simple Branding Configuration System
 * Allows developers to easily customize logos and branding
 */

export interface BrandingConfig {
  appName: string
  windowTitle: string
  description: string
  assets: {
    navbar: string
    favicon: string
    hero: string
    window: string
    tray: string
    splash: string
  }
  theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
  }
}

// Default configuration - modify these values to customize your branding
const DEFAULT_CONFIG: BrandingConfig = {
  appName: 'StudyCollab',
  windowTitle: 'StudyCollab - Collaborative Study Platform',
  description: 'A comprehensive study platform for students',
  assets: {
    navbar: '/STUDY.svg',
    favicon: '/favicon.ico',
    hero: '/STUDY.svg',
    window: '/STUDY.svg',
    tray: '/STUDY.svg',
    splash: '/splash.svg'
  },
  theme: {
    primaryColor: '#3b82f6',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff'
  }
}

class BrandingManager {
  private config: BrandingConfig = DEFAULT_CONFIG
  private listeners: Array<(config: BrandingConfig) => void> = []
  private isClient = false

  constructor() {
    // Only load config on client-side to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      this.isClient = true
      this.loadConfig()
    }
  }

  private loadConfig() {
    if (!this.isClient) return
    
    try {
      const saved = localStorage.getItem('branding-config')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.config = { ...DEFAULT_CONFIG, ...parsed }
        
        // Fix any incorrect paths that include the full project path
        let needsFixing = false
        const fixedAssets = { ...this.config.assets }
        
        Object.keys(fixedAssets).forEach(key => {
          const path = fixedAssets[key as keyof BrandingConfig['assets']]
          if (path && path.includes('studycollab-mvp/public/')) {
            const filename = path.split('/').pop()
            if (filename) {
              fixedAssets[key as keyof BrandingConfig['assets']] = `/${filename}`
              needsFixing = true
            }
          }
        })
        
        if (needsFixing) {
          this.config.assets = fixedAssets
          this.saveConfig()
        }
      }
    } catch (error) {
      console.warn('Failed to load branding config:', error)
    }
  }

  private saveConfig() {
    if (!this.isClient) return
    
    try {
      localStorage.setItem('branding-config', JSON.stringify(this.config))
      this.notifyListeners()
    } catch (error) {
      console.warn('Failed to save branding config:', error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.config))
  }

  getConfig(): BrandingConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<BrandingConfig>) {
    this.config = {
      ...this.config,
      ...updates,
      assets: { ...this.config.assets, ...updates.assets },
      theme: { ...this.config.theme, ...updates.theme }
    }
    this.saveConfig()
  }

  updateAssets(assets: Partial<BrandingConfig['assets']>) {
    this.config.assets = { ...this.config.assets, ...assets }
    this.saveConfig()
  }

  updateTheme(theme: Partial<BrandingConfig['theme']>) {
    this.config.theme = { ...this.config.theme, ...theme }
    this.saveConfig()
  }

  getAsset(type: keyof BrandingConfig['assets']): string {
    return this.config.assets[type]
  }

  getAppName(): string {
    return this.config.appName
  }

  getWindowTitle(): string {
    return this.config.windowTitle
  }

  getDescription(): string {
    return this.config.description
  }

  resetToDefaults() {
    this.config = { ...DEFAULT_CONFIG }
    this.saveConfig()
  }

  fixIncorrectPaths() {
    let needsFixing = false
    const fixedAssets = { ...this.config.assets }
    
    Object.keys(fixedAssets).forEach(key => {
      const path = fixedAssets[key as keyof BrandingConfig['assets']]
      if (path && (path.includes('studycollab-mvp/public/') || path.includes('/admin/'))) {
        const filename = path.split('/').pop()
        if (filename) {
          fixedAssets[key as keyof BrandingConfig['assets']] = `/${filename}`
          needsFixing = true
        }
      }
    })
    
    if (needsFixing) {
      this.config.assets = fixedAssets
      this.saveConfig()
      return true
    }
    return false
  }

  subscribe(listener: (config: BrandingConfig) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

export const brandingManager = new BrandingManager()