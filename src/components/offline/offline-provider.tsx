'use client'

import { createClient } from '@/lib/supabase'
import { useOfflineStore } from '@/stores/offline-store'
import { createContext, useContext, useEffect, useState } from 'react'
import { OfflineStatusBar } from './offline-indicator'

interface OfflineContextType {
  isInitialized: boolean
  error: string | null
}

const OfflineContext = createContext<OfflineContextType>({
  isInitialized: false,
  error: null
})

export function useOfflineContext() {
  return useContext(OfflineContext)
}

interface OfflineProviderProps {
  children: React.ReactNode
  showStatusBar?: boolean
}

export function OfflineProvider({ children, showStatusBar = true }: OfflineProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { initialize, setOnlineStatus, updateNetworkStatus } = useOfflineStore()

  useEffect(() => {
    let mounted = true

    const initializeOfflineCapabilities = async () => {
      try {
        const supabase = createClient()
        
        // Wait for auth to be ready
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.warn('No authenticated user, skipping offline initialization')
          if (mounted) {
            setIsInitialized(true) // Still mark as initialized to avoid blocking
          }
          return
        }

        if (user && mounted) {
          // Get session token for encryption
          const { data: { session } } = await supabase.auth.getSession()
          const sessionToken = session?.access_token

          await initialize(user.id, sessionToken)
          setIsInitialized(true)
          setError(null)
        }
      } catch (err) {
        console.error('Failed to initialize offline capabilities:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize offline capabilities')
          setIsInitialized(true) // Still mark as initialized to avoid blocking the app
        }
      }
    }

    // Setup network status listeners
    const handleOnline = () => {
      setOnlineStatus(true)
      updateNetworkStatus({ online: true })
    }

    const handleOffline = () => {
      setOnlineStatus(false)
      updateNetworkStatus({ online: false })
    }

    // Enhanced network status detection
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        updateNetworkStatus({
          online: navigator.onLine,
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          rtt: connection?.rtt,
          saveData: connection?.saveData
        })
      } else {
        updateNetworkStatus({ online: navigator.onLine })
      }
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection?.addEventListener('change', updateNetworkInfo)
    }

    // Initialize
    initializeOfflineCapabilities()
    updateNetworkInfo()

    return () => {
      mounted = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection?.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [initialize, setOnlineStatus, updateNetworkStatus])

  // Listen for auth changes
  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && !isInitialized) {
          try {
            await initialize(session.user.id, session.access_token)
            setIsInitialized(true)
            setError(null)
          } catch (err) {
            console.error('Failed to initialize offline capabilities on sign in:', err)
            setError(err instanceof Error ? err.message : 'Failed to initialize')
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear offline data on logout for security
          try {
            const { clearCache } = useOfflineStore.getState()
            await clearCache()
          } catch (err) {
            console.error('Failed to clear cache on logout:', err)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [initialize, isInitialized])

  const contextValue: OfflineContextType = {
    isInitialized,
    error
  }

  return (
    <OfflineContext.Provider value={contextValue}>
      {showStatusBar && <OfflineStatusBar />}
      {children}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
          <div className="text-sm text-red-700">
            <div className="font-medium">Offline Setup Error</div>
            <div className="mt-1">{error}</div>
          </div>
        </div>
      )}
    </OfflineContext.Provider>
  )
}