'use client'

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
  
  // Feature availability
  features: ReturnType<typeof PlatformDetection.getFeatureAvailability>
  
  // Routing configuration
  routing: ReturnType<typeof PlatformDetection.getRoutingConfig>
  
  // Update functions
  updatePlatformConfig: (updates: Partial<PlatformConfig>) => void
  updateEnvironmentConfig: (updates: Partial<EnvironmentConfig>) => Promise<void>
  
  // Utility functions
  isWeb: boolean
  shouldShowLanding: boolean
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platformInfo] = useState(() => PlatformDetection.detect())
  const [platformConfig, setPlatformConfig] = useState(() => PlatformDetection.getConfig())
  const [environmentConfig, setEnvironmentConfig] = useState<EnvironmentConfig | null>(null)
  const [environmentLoading, setEnvironmentLoading] = useState(true)

  // Load environment configuration
  useEffect(() => {
    EnvironmentConfigLoader.loadConfig()
      .then(setEnvironmentConfig)
      .catch(console.error)
      .finally(() => setEnvironmentLoading(false))
  }, [])

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

  // Derived values
  const features = PlatformDetection.getFeatureAvailability()
  const routing = PlatformDetection.getRoutingConfig()

  const contextValue: PlatformContextValue = {
    platformInfo,
    platformConfig,
    environmentConfig,
    environmentLoading,
    features,
    routing,
    updatePlatformConfig,
    updateEnvironmentConfig,
    isWeb: platformInfo.isWeb,
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
  const { isWeb } = usePlatform()
  
  return {
    isWeb,
    renderIf: (platform: 'web', component: ReactNode) => {
      if (platform === 'web' && isWeb) return component
      return null
    },
    renderWeb: (component: ReactNode) => isWeb ? component : null,
  }
}