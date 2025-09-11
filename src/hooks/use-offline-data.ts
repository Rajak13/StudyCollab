'use client'

import { cacheManager } from '@/lib/cache-manager'
import { createClient } from '@/lib/supabase'
import { syncManager } from '@/lib/sync-manager'
import { useOfflineStore } from '@/stores/offline-store'
import type { CacheableData } from '@/types/offline'
import { useCallback, useEffect, useState } from 'react'

interface UseOfflineDataOptions<T> {
  key: string
  type: CacheableData
  fetcher: () => Promise<T>
  dependencies?: string[]
  ttl?: number
  enabled?: boolean
  fallbackData?: T
}

interface UseOfflineDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (data: T) => Promise<void>
  remove: () => Promise<void>
  isFromCache: boolean
  lastUpdated: number | null
}

/**
 * Hook for offline-aware data fetching and caching
 */
export function useOfflineData<T>({
  key,
  type,
  fetcher,
  dependencies = [],
  ttl,
  enabled = true,
  fallbackData
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | null>(fallbackData || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const { isOnline, isOfflineMode } = useOfflineStore()

  // Fetch data from cache or server
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      // Try cache first (unless force refresh or online and not in offline mode)
      if (!forceRefresh && (isOfflineMode || !isOnline)) {
        const cachedData = await cacheManager.get<T>(key, type)
        if (cachedData) {
          setData(cachedData)
          setIsFromCache(true)
          setLastUpdated(Date.now())
          setLoading(false)
          return
        }
      }

      // Fetch from server if online
      if (isOnline && !isOfflineMode) {
        try {
          const freshData = await fetcher()
          
          // Cache the fresh data
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            await cacheManager.set(key, freshData, type, user.id, {
              ttl,
              dependencies
            })
          }

          setData(freshData)
          setIsFromCache(false)
          setLastUpdated(Date.now())
        } catch (fetchError) {
          // If server fetch fails, try cache as fallback
          const cachedData = await cacheManager.get<T>(key, type)
          if (cachedData) {
            setData(cachedData)
            setIsFromCache(true)
            setLastUpdated(Date.now())
            console.warn('Using cached data due to fetch error:', fetchError)
          } else {
            throw fetchError
          }
        }
      } else {
        // Offline - try cache
        const cachedData = await cacheManager.get<T>(key, type)
        if (cachedData) {
          setData(cachedData)
          setIsFromCache(true)
          setLastUpdated(Date.now())
        } else if (fallbackData) {
          setData(fallbackData)
          setIsFromCache(false)
          setLastUpdated(Date.now())
        } else {
          throw new Error('No cached data available offline')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [key, type, fetcher, dependencies, ttl, enabled, isOnline, isOfflineMode, fallbackData])

  // Mutate data (optimistic update)
  const mutate = useCallback(async (newData: T) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Update local state immediately (optimistic update)
      setData(newData)
      setIsFromCache(false)
      setLastUpdated(Date.now())

      // Cache the new data
      await cacheManager.set(key, newData, type, user.id, {
        ttl,
        dependencies
      })

      // Queue for sync if offline or in offline mode
      if (!isOnline || isOfflineMode) {
        await syncManager.queueOperation({
          type: 'UPDATE',
          table: type,
          data: newData,
          priority: 'MEDIUM',
          maxRetries: 3
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mutate data'
      setError(errorMessage)
      console.error('Failed to mutate data:', err)
      
      // Revert optimistic update on error
      await fetchData()
    }
  }, [key, type, ttl, dependencies, isOnline, isOfflineMode, fetchData])

  // Remove data
  const remove = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Remove from cache
      await cacheManager.delete(key)
      
      // Update local state
      setData(null)
      setLastUpdated(Date.now())

      // Queue for sync if offline
      if (!isOnline || isOfflineMode) {
        await syncManager.queueOperation({
          type: 'DELETE',
          table: type,
          data: { id: key },
          priority: 'MEDIUM',
          maxRetries: 3
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove data'
      setError(errorMessage)
      console.error('Failed to remove data:', err)
    }
  }, [key, type, isOnline, isOfflineMode])

  // Refetch data
  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && !isOfflineMode && isFromCache) {
      fetchData(true)
    }
  }, [isOnline, isOfflineMode, isFromCache, fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    remove,
    isFromCache,
    lastUpdated
  }
}

/**
 * Hook for offline-aware list data with CRUD operations
 */
export function useOfflineList<T extends { id: string }>({
  key,
  type,
  fetcher,
  dependencies = [],
  ttl,
  enabled = true
}: Omit<UseOfflineDataOptions<T[]>, 'fallbackData'>) {
  const baseResult = useOfflineData({
    key,
    type,
    fetcher,
    dependencies,
    ttl,
    enabled,
    fallbackData: []
  })

  const { isOnline, isOfflineMode } = useOfflineStore()

  // Add item to list
  const addItem = useCallback(async (item: Omit<T, 'id'> & { id?: string }) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Generate temporary ID for offline operations
      const tempId = item.id || `temp_${Date.now()}_${Math.random()}`
      const newItem = { ...item, id: tempId } as T

      // Update local state optimistically
      const currentData = baseResult.data || []
      const updatedData = [...currentData, newItem]
      
      // Cache updated list
      await cacheManager.set(key, updatedData, type, user.id, {
        ttl,
        dependencies
      })

      // Update state
      baseResult.mutate(updatedData)

      // Queue for sync
      await syncManager.queueOperation({
        type: 'CREATE',
        table: type,
        data: newItem,
        localId: tempId,
        priority: 'HIGH',
        maxRetries: 3
      })

      return newItem
    } catch (err) {
      console.error('Failed to add item:', err)
      throw err
    }
  }, [baseResult, key, type, ttl, dependencies])

  // Update item in list
  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const currentData = baseResult.data || []
      const updatedData = currentData.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )

      // Update cache and state
      await baseResult.mutate(updatedData)

      // Queue for sync
      const updatedItem = updatedData.find(item => item.id === id)
      if (updatedItem) {
        await syncManager.queueOperation({
          type: 'UPDATE',
          table: type,
          data: updatedItem,
          priority: 'MEDIUM',
          maxRetries: 3
        })
      }
    } catch (err) {
      console.error('Failed to update item:', err)
      throw err
    }
  }, [baseResult, type])

  // Remove item from list
  const removeItem = useCallback(async (id: string) => {
    try {
      const currentData = baseResult.data || []
      const updatedData = currentData.filter(item => item.id !== id)

      // Update cache and state
      await baseResult.mutate(updatedData)

      // Queue for sync
      await syncManager.queueOperation({
        type: 'DELETE',
        table: type,
        data: { id },
        priority: 'MEDIUM',
        maxRetries: 3
      })
    } catch (err) {
      console.error('Failed to remove item:', err)
      throw err
    }
  }, [baseResult, type])

  return {
    ...baseResult,
    addItem,
    updateItem,
    removeItem,
    items: baseResult.data || []
  }
}