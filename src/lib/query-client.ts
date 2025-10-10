import { QueryClient } from '@tanstack/react-query'

// Performance-aware configuration
const isElectron = typeof window !== 'undefined' && (window as any).desktopAPI?.isElectron?.()
const isBatteryMode = typeof window !== 'undefined' && (window as any).performanceMode?.batteryMode

/**
 * Creates a new QueryClient with optimized default options
 */
export function createQueryClient() {
  // Adjust cache times based on environment
  const baseStaleTime = isElectron ? 10 * 60 * 1000 : 5 * 60 * 1000 // 10min for desktop, 5min for web
  const baseGcTime = isElectron ? 20 * 60 * 1000 : 10 * 60 * 1000 // 20min for desktop, 10min for web
  
  // Reduce cache times in battery mode
  const staleTime = isBatteryMode ? baseStaleTime * 2 : baseStaleTime
  const gcTime = isBatteryMode ? baseGcTime * 0.5 : baseGcTime

  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for optimized duration based on environment
        staleTime,
        // Keep data in cache for optimized duration
        gcTime,
        // Retry failed requests with smart logic
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error && 'status' in error) {
            const status = (error as any).status
            if (status >= 400 && status < 500) {
              return false
            }
          }
          // Reduce retries in battery mode
          const maxRetries = isBatteryMode ? 1 : 2
          return failureCount < maxRetries
        },
        retryDelay: (attemptIndex) => {
          const baseDelay = isBatteryMode ? 2000 : 1000
          return Math.min(baseDelay * 2 ** attemptIndex, 30000)
        },
        // Performance optimizations
        refetchOnWindowFocus: false, // Disable for better performance
        refetchOnReconnect: !isBatteryMode, // Disable in battery mode
        refetchInterval: false, // Disable automatic refetching
        // Network mode optimizations
        networkMode: 'online',
        // Reduce concurrent queries in battery mode
        ...(isBatteryMode && {
          refetchOnMount: false,
          refetchOnReconnect: false,
        }),
      },
      mutations: {
        // Retry failed mutations with environment awareness
        retry: isBatteryMode ? 0 : 1,
        retryDelay: isBatteryMode ? 2000 : 1000,
        // Network mode for mutations
        networkMode: 'online',
      },
    },
    // Global query client configuration
    logger: {
      log: console.log,
      warn: console.warn,
      error: console.error,
    },
  })
}

/**
 * Creates a performance-optimized query client for low-memory environments
 */
export function createLowMemoryQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 1, // Single retry only
        retryDelay: 2000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchOnMount: false,
        networkMode: 'online',
      },
      mutations: {
        retry: 0, // No retries
        networkMode: 'online',
      },
    },
  })
}

/**
 * Query client instance for server-side rendering
 */
export const queryClient = createQueryClient()