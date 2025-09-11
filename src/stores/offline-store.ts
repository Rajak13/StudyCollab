'use client'

import { cacheManager } from '@/lib/cache-manager'
import { encryptionService } from '@/lib/encryption'
import { syncManager } from '@/lib/sync-manager'
import type { NetworkStatus, OfflineState, SyncError } from '@/types/offline'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface OfflineStore extends OfflineState {
  // Actions
  initialize: (userId: string, sessionToken?: string) => Promise<void>
  setOnlineStatus: (isOnline: boolean) => void
  setOfflineMode: (enabled: boolean) => void
  triggerSync: () => Promise<{ success: boolean; errors: string[] }>
  clearCache: () => Promise<void>
  addSyncError: (error: SyncError) => void
  clearSyncErrors: () => void
  updateNetworkStatus: (status: NetworkStatus) => void
  
  // Cache operations
  getCacheStats: () => Promise<any>
  clearCacheType: (type: string) => Promise<void>
  
  // Getters
  getPendingChangesCount: () => number
  getLastSyncTime: () => number | null
  isInitialized: () => boolean
}

const INITIAL_STATE: OfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isOfflineMode: false,
  lastSyncTime: null,
  syncInProgress: false,
  pendingChanges: 0,
  cacheSize: 0,
  syncErrors: []
}

export const useOfflineStore = create<OfflineStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // Initialize offline capabilities
        initialize: async (userId: string, sessionToken?: string) => {
          try {
            // Initialize encryption
            encryptionService.initialize(userId, sessionToken)
            
            // Initialize cache manager
            await cacheManager.initialize(userId)
            
            // Initialize sync manager
            await syncManager.initialize()
            
            // Update initial state
            const stats = cacheManager.getStats()
            const syncStatus = syncManager.getSyncStatus()
            
            set({
              cacheSize: stats.totalSize,
              pendingChanges: syncStatus.pendingOperations,
              isOnline: syncStatus.isOnline,
              lastSyncTime: parseInt(localStorage.getItem('lastSyncTime') || '0') || null
            })

            console.log('Offline capabilities initialized successfully')
          } catch (error) {
            console.error('Failed to initialize offline capabilities:', error)
            throw error
          }
        },

        // Set online/offline status
        setOnlineStatus: (isOnline: boolean) => {
          set({ isOnline })
          
          // Trigger sync when coming back online
          if (isOnline && get().pendingChanges > 0) {
            get().triggerSync()
          }
        },

        // Toggle offline mode
        setOfflineMode: (enabled: boolean) => {
          set({ isOfflineMode: enabled })
        },

        // Trigger manual sync
        triggerSync: async () => {
          const state = get()
          
          if (state.syncInProgress || !state.isOnline) {
            return { success: false, errors: ['Sync already in progress or offline'] }
          }

          set({ syncInProgress: true, syncErrors: [] })

          try {
            const result = await syncManager.sync()
            
            // Update state after sync
            const syncStatus = syncManager.getSyncStatus()
            const stats = cacheManager.getStats()
            
            set({
              syncInProgress: false,
              pendingChanges: syncStatus.pendingOperations,
              cacheSize: stats.totalSize,
              lastSyncTime: Date.now()
            })

            if (!result.success && result.errors.length > 0) {
              const syncErrors = result.errors.map(error => ({
                id: `sync_${Date.now()}_${Math.random()}`,
                message: error,
                timestamp: Date.now(),
                type: 'UNKNOWN' as const
              }))
              
              set(state => ({
                syncErrors: [...state.syncErrors, ...syncErrors]
              }))
            }

            return result
          } catch (error) {
            set({ syncInProgress: false })
            
            const syncError: SyncError = {
              id: `sync_${Date.now()}`,
              message: error instanceof Error ? error.message : 'Unknown sync error',
              timestamp: Date.now(),
              type: 'UNKNOWN'
            }
            
            set(state => ({
              syncErrors: [...state.syncErrors, syncError]
            }))

            return { success: false, errors: [syncError.message] }
          }
        },

        // Clear all cache
        clearCache: async () => {
          try {
            await cacheManager.clear()
            
            const stats = cacheManager.getStats()
            set({ 
              cacheSize: stats.totalSize,
              lastSyncTime: null
            })
            
            // Clear last sync time
            localStorage.removeItem('lastSyncTime')
          } catch (error) {
            console.error('Failed to clear cache:', error)
            throw error
          }
        },

        // Add sync error
        addSyncError: (error: SyncError) => {
          set(state => ({
            syncErrors: [...state.syncErrors, error]
          }))
        },

        // Clear sync errors
        clearSyncErrors: () => {
          set({ syncErrors: [] })
        },

        // Update network status
        updateNetworkStatus: (status: NetworkStatus) => {
          set({ isOnline: status.online })
        },

        // Get cache statistics
        getCacheStats: async () => {
          return cacheManager.getStats()
        },

        // Clear specific cache type
        clearCacheType: async (type: string) => {
          try {
            await cacheManager.clearType(type as any)
            
            const stats = cacheManager.getStats()
            set({ cacheSize: stats.totalSize })
          } catch (error) {
            console.error('Failed to clear cache type:', error)
            throw error
          }
        },

        // Get pending changes count
        getPendingChangesCount: () => {
          return syncManager.getSyncStatus().pendingOperations
        },

        // Get last sync time
        getLastSyncTime: () => {
          return get().lastSyncTime
        },

        // Check if initialized
        isInitialized: () => {
          return encryptionService.isInitialized()
        }
      }),
      {
        name: 'offline-store',
        partialize: (state) => ({
          isOfflineMode: state.isOfflineMode,
          lastSyncTime: state.lastSyncTime,
          syncErrors: state.syncErrors
        })
      }
    ),
    {
      name: 'offline-store'
    }
  )
)

// Selector hooks for better performance
export const useIsOnline = () => useOfflineStore(state => state.isOnline)
export const useIsOfflineMode = () => useOfflineStore(state => state.isOfflineMode)
export const useSyncInProgress = () => useOfflineStore(state => state.syncInProgress)
export const usePendingChanges = () => useOfflineStore(state => state.pendingChanges)
export const useCacheSize = () => useOfflineStore(state => state.cacheSize)
export const useSyncErrors = () => useOfflineStore(state => state.syncErrors)
export const useLastSyncTime = () => useOfflineStore(state => state.lastSyncTime)

// Action hooks
export const useOfflineActions = () => {
  const store = useOfflineStore()
  return {
    initialize: store.initialize,
    setOnlineStatus: store.setOnlineStatus,
    setOfflineMode: store.setOfflineMode,
    triggerSync: store.triggerSync,
    clearCache: store.clearCache,
    clearSyncErrors: store.clearSyncErrors,
    getCacheStats: store.getCacheStats,
    clearCacheType: store.clearCacheType
  }
}