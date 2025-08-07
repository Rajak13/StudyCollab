/**
 * Loading state management utilities for better UX
 */

import { create } from 'zustand'

interface LoadingState {
  [key: string]: boolean
}

interface LoadingStore {
  loadingStates: LoadingState
  setLoading: (key: string, loading: boolean) => void
  isLoading: (key: string) => boolean
  isAnyLoading: () => boolean
  clearAll: () => void
}

/**
 * Global loading state store
 */
export const useLoadingStore = create<LoadingStore>((set, get) => ({
  loadingStates: {},
  
  setLoading: (key: string, loading: boolean) =>
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading,
      },
    })),
  
  isLoading: (key: string) => get().loadingStates[key] || false,
  
  isAnyLoading: () => Object.values(get().loadingStates).some(Boolean),
  
  clearAll: () => set({ loadingStates: {} }),
}))

/**
 * Loading state manager for async operations
 */
export class LoadingManager {
  private static instance: LoadingManager
  private loadingStates = new Map<string, boolean>()
  private listeners = new Map<string, Set<(loading: boolean) => void>>()

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager()
    }
    return LoadingManager.instance
  }

  /**
   * Set loading state for a specific key
   */
  setLoading(key: string, loading: boolean): void {
    this.loadingStates.set(key, loading)
    this.notifyListeners(key, loading)
  }

  /**
   * Check if a specific key is loading
   */
  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  /**
   * Check if any operation is loading
   */
  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(Boolean)
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(key: string, listener: (loading: boolean) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    
    this.listeners.get(key)!.add(listener)
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key)
      if (keyListeners) {
        keyListeners.delete(listener)
        if (keyListeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  /**
   * Wrap async operation with loading state
   */
  async withLoading<T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      minDuration?: number
      onStart?: () => void
      onComplete?: () => void
      onError?: (error: any) => void
    } = {}
  ): Promise<T> {
    const { minDuration = 0, onStart, onComplete, onError } = options
    
    this.setLoading(key, true)
    onStart?.()
    
    const startTime = Date.now()
    
    try {
      const result = await operation()
      
      // Ensure minimum loading duration for better UX
      if (minDuration > 0) {
        const elapsed = Date.now() - startTime
        if (elapsed < minDuration) {
          await new Promise(resolve => setTimeout(resolve, minDuration - elapsed))
        }
      }
      
      onComplete?.()
      return result
    } catch (error) {
      onError?.(error)
      throw error
    } finally {
      this.setLoading(key, false)
    }
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingStates.clear()
    // Notify all listeners
    for (const [key, listeners] of this.listeners.entries()) {
      listeners.forEach(listener => listener(false))
    }
  }

  private notifyListeners(key: string, loading: boolean): void {
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach(listener => listener(loading))
    }
  }
}

/**
 * React hook for managing loading states
 */
export function useLoading(key: string) {
  const { setLoading, isLoading } = useLoadingStore()
  
  const startLoading = () => setLoading(key, true)
  const stopLoading = () => setLoading(key, false)
  const loading = isLoading(key)
  
  return {
    loading,
    startLoading,
    stopLoading,
    withLoading: async <T>(operation: () => Promise<T>) => {
      startLoading()
      try {
        return await operation()
      } finally {
        stopLoading()
      }
    }
  }
}

/**
 * Hook for managing multiple loading states
 */
export function useMultipleLoading(keys: string[]) {
  const { setLoading, isLoading } = useLoadingStore()
  
  const loadingStates = keys.reduce((acc, key) => {
    acc[key] = isLoading(key)
    return acc
  }, {} as Record<string, boolean>)
  
  const isAnyLoading = Object.values(loadingStates).some(Boolean)
  
  const setLoadingState = (key: string, loading: boolean) => {
    setLoading(key, loading)
  }
  
  return {
    loadingStates,
    isAnyLoading,
    setLoadingState,
  }
}

/**
 * Debounced loading state for search/filter operations
 */
export function useDebouncedLoading(key: string, delay: number = 300) {
  const { setLoading, isLoading } = useLoadingStore()
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  
  const debouncedSetLoading = React.useCallback((loading: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (loading) {
      // Start loading immediately
      setLoading(key, true)
    } else {
      // Delay stopping loading to prevent flickering
      timeoutRef.current = setTimeout(() => {
        setLoading(key, false)
      }, delay)
    }
  }, [key, delay, setLoading])
  
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return {
    loading: isLoading(key),
    setLoading: debouncedSetLoading,
  }
}

/**
 * Loading state for optimistic updates
 */
export function useOptimisticLoading<T>(
  initialData: T,
  key: string
) {
  const [optimisticData, setOptimisticData] = React.useState<T>(initialData)
  const [originalData, setOriginalData] = React.useState<T>(initialData)
  const { loading, withLoading } = useLoading(key)
  
  const performOptimisticUpdate = React.useCallback(
    async (
      updateFn: (data: T) => T,
      asyncOperation: () => Promise<T>
    ) => {
      // Store original data for rollback
      setOriginalData(optimisticData)
      
      // Apply optimistic update
      const newData = updateFn(optimisticData)
      setOptimisticData(newData)
      
      try {
        // Perform actual operation
        const result = await withLoading(asyncOperation)
        setOptimisticData(result)
        return result
      } catch (error) {
        // Rollback on error
        setOptimisticData(originalData)
        throw error
      }
    },
    [optimisticData, originalData, withLoading]
  )
  
  return {
    data: optimisticData,
    loading,
    performOptimisticUpdate,
  }
}

// Export singleton instance
export const loadingManager = LoadingManager.getInstance()

// Import React for hooks
import React from 'react'
