'use client'

import { DesktopConfig, DesktopConfigManager } from '@/lib/desktop-config'
import { EnvironmentConfig, EnvironmentConfigLoader } from '@/lib/environment-config'
import { PlatformConfig, PlatformDetection, PlatformInfo } from '@/lib/platform-detection'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface PlatformContextValue {
  // Platform information
  platformInfo: PlatformInfo
  platformConfig: PlatformConfig
  
  // Environment configuration
  environmentConfig: EnvironmentConfig | null
  environmentLoading: boolean
  
  // Desktop configuration (only available on desktop)
  desktopConfig: DesktopConfig | null
  desktopLoading: boolean
  
  // Feature availability
  features: ReturnType<typeof PlatformDetection.getFeatureAvailability>
  
  // Routing configuration
  routing: ReturnType<typeof PlatformDetection.getRoutingConfig>
  
  // Update functions
  updatePlatformConfig: (updates: Partial<PlatformConfig>) => void
  updateEnvironmentConfig: (updates: Partial<EnvironmentConfig>) => Promise<void>
  updateDesktopConfig: (updates: Partial<DesktopConfig>) => Promise<void>
  
  // Utility functions
  isElectron: boolean
  isWeb: boolean
  isDesktop: boolean
  shouldShowLanding: boolean
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platformInfo] = useState(() => PlatformDetection.detect())
  const [platformConfig, setPlatformConfig] = useState(() => PlatformDetection.getConfig())
  const [environmentConfig, setEnvironmentConfig] = useState<EnvironmentConfig | null>(null)
  const [environmentLoading, setEnvironmentLoading] = useState(true)
  const [desktopConfig, setDesktopConfig] = useState<DesktopConfig | null>(null)
  const [desktopLoading, setDesktopLoading] = useState(true)

  // Load environment configuration
  useEffect(() => {
    EnvironmentConfigLoader.loadConfig()
      .then(setEnvironmentConfig)
      .catch(console.error)
      .finally(() => setEnvironmentLoading(false))
  }, [])

  // Load desktop configuration (only on desktop)
  useEffect(() => {
    if (platformInfo.isElectron) {
      DesktopConfigManager.loadConfig()
        .then(setDesktopConfig)
        .catch(console.error)
        .finally(() => setDesktopLoading(false))
    } else {
      setDesktopLoading(false)
    }
  }, [platformInfo.isElectron])

  // Update functions
  const updatePlatformConfig = (updates: Partial<PlatformConfig>) => {
    PlatformDetection.updateConfig(updates)
    setPlatformConfig(PlatformDetection.getConfig())
  }

  const updateEnvironmentConfig = async (updates: Partial<EnvironmentConfig>) => {
    await EnvironmentConfigLoader.saveCustomConfig(updates)
    const newConfig = await EnvironmentConfigLoader.loadConfig()
    setEnvironmentConfig(newConfig)
  }

  const updateDesktopConfig = async (updates: Partial<DesktopConfig>) => {
    if (platformInfo.isElectron) {
      await DesktopConfigManager.saveConfig(updates)
      const newConfig = await DesktopConfigManager.loadConfig()
      setDesktopConfig(newConfig)
    }
  }

  // Derived values
  const features = PlatformDetection.getFeatureAvailability()
  const routing = PlatformDetection.getRoutingConfig()

  const contextValue: PlatformContextValue = {
    platformInfo,
    platformConfig,
    environmentConfig,
    environmentLoading,
    desktopConfig,
    desktopLoading,
    features,
    routing,
    updatePlatformConfig,
    updateEnvironmentConfig,
    updateDesktopConfig,
    isElectron: platformInfo.isElectron,
    isWeb: platformInfo.isWeb,
    isDesktop: platformInfo.platform === 'desktop',
    shouldShowLanding: PlatformDetection.shouldShowLanding(),
  }

  return (
    <PlatformContext.Provider value={contextValue}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform() {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider')
  }
  return context
}

/**
 * Hook for platform-specific feature checks
 */
export function usePlatformFeatures() {
  const { features } = usePlatform()
  return features
}

/**
 * Hook for platform-specific routing
 */
export function usePlatformRouting() {
  const { routing, platformInfo } = usePlatform()
  return { ...routing, platformInfo }
}

/**
 * Hook for desktop configuration (only works on desktop)
 */
export function useDesktopConfig() {
  const { desktopConfig, desktopLoading, updateDesktopConfig, isElectron } = usePlatform()
  
  if (!isElectron) {
    throw new Error('useDesktopConfig can only be used on desktop platform')
  }
  
  return {
    config: desktopConfig,
    loading: desktopLoading,
    updateConfig: updateDesktopConfig,
  }
}

/**
 * Hook for environment configuration
 */
export function useEnvironmentConfig() {
  const { environmentConfig, environmentLoading, updateEnvironmentConfig } = usePlatform()
  
  return {
    config: environmentConfig,
    loading: environmentLoading,
    updateConfig: updateEnvironmentConfig,
  }
}

/**
 * Hook for conditional platform rendering
 */
export function usePlatformConditional() {
  const { isElectron, isWeb, isDesktop } = usePlatform()
  
  return {
    isElectron,
    isWeb,
    isDesktop,
    renderIf: (platform: 'web' | 'desktop', component: ReactNode) => {
      if (platform === 'desktop' && isDesktop) return component
      if (platform === 'web' && isWeb) return component
      return null
    },
    renderElectron: (component: ReactNode) => isElectron ? component : null,
    renderWeb: (component: ReactNode) => isWeb ? component : null,
  }
}