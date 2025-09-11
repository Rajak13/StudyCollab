/**
 * React hook for branding configuration
 */

import { BrandingConfig, brandingManager } from '@/lib/branding'
import { useEffect, useState } from 'react'

export function useBranding() {
  const [config, setConfig] = useState<BrandingConfig>(brandingManager.getConfig())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side and update config
    setIsClient(true)
    setConfig(brandingManager.getConfig())
    
    const unsubscribe = brandingManager.subscribe(setConfig)
    return unsubscribe
  }, [])

  const updateConfig = async (updates: Partial<BrandingConfig>) => {
    try {
      setLoading(true)
      setError(null)
      brandingManager.updateConfig(updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config')
    } finally {
      setLoading(false)
    }
  }

  const updateAssets = async (assets: Partial<BrandingConfig['assets']>) => {
    try {
      setLoading(true)
      setError(null)
      brandingManager.updateAssets(assets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assets')
    } finally {
      setLoading(false)
    }
  }

  const updateTheme = async (theme: Partial<BrandingConfig['theme']>) => {
    try {
      setLoading(true)
      setError(null)
      brandingManager.updateTheme(theme)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme')
    } finally {
      setLoading(false)
    }
  }

  const updateBranding = async (branding: Partial<Pick<BrandingConfig, 'appName' | 'windowTitle' | 'description'>>) => {
    try {
      setLoading(true)
      setError(null)
      brandingManager.updateConfig(branding)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding')
    } finally {
      setLoading(false)
    }
  }

  const updateLogos = async (logos: Partial<BrandingConfig['assets']>) => {
    return updateAssets(logos)
  }

  const resetToDefaults = async () => {
    try {
      setLoading(true)
      setError(null)
      brandingManager.resetToDefaults()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset to defaults')
    } finally {
      setLoading(false)
    }
  }

  const fixPaths = async () => {
    try {
      setLoading(true)
      setError(null)
      const wasFixed = brandingManager.fixIncorrectPaths()
      if (wasFixed) {
        setConfig(brandingManager.getConfig())
      }
      return wasFixed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fix paths')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    config,
    loading,
    error,
    isClient,
    updateConfig,
    updateAssets,
    updateTheme,
    updateBranding,
    updateLogos,
    resetToDefaults,
    fixPaths
  }
}

/**
 * Hook to get the app name from branding config
 */
export function useAppName() {
  const { config, loading, error } = useBranding()
  
  return {
    appName: config.appName,
    loading,
    error
  }
}

/**
 * Hook to get logo paths from branding config
 */
export function useLogo(type: keyof BrandingConfig['assets'] = 'navbar') {
  const { config, loading, error } = useBranding()
  
  return {
    logoPath: config.assets[type],
    loading,
    error
  }
}