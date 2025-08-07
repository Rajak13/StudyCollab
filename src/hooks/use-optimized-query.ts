import { apiClient } from '@/lib/api-client'
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  endpoint: string
  queryKey: readonly unknown[]
  // Custom cache time for specific queries
  cacheTime?: number
  // Custom stale time for specific queries  
  staleTime?: number
  // Enable/disable background refetching
  backgroundRefetch?: boolean
}

/**
 * Optimized query hook with smart caching and performance optimizations
 */
export function useOptimizedQuery<T>(
  options: OptimizedQueryOptions<T>
): UseQueryResult<T> {
  const {
    endpoint,
    queryKey,
    cacheTime,
    staleTime,
    backgroundRefetch = false,
    ...queryOptions
  } = options

  return useQuery({
    queryKey,
    queryFn: () => apiClient.get<T>(endpoint),
    // Override default cache settings if provided
    ...(cacheTime && { gcTime: cacheTime }),
    ...(staleTime && { staleTime }),
    // Control background refetching
    refetchInterval: backgroundRefetch ? 30000 : false, // 30 seconds if enabled
    refetchIntervalInBackground: backgroundRefetch,
    ...queryOptions,
  })
}

/**
 * Hook for queries that need frequent updates (like notifications)
 */
export function useRealtimeQuery<T>(
  options: OptimizedQueryOptions<T>
): UseQueryResult<T> {
  return useOptimizedQuery({
    ...options,
    staleTime: 0, // Always consider stale for realtime data
    cacheTime: 1000 * 60, // Keep in cache for 1 minute
    backgroundRefetch: true,
    refetchInterval: 5000, // Refetch every 5 seconds
  })
}

/**
 * Hook for static data that rarely changes
 */
export function useStaticQuery<T>(
  options: OptimizedQueryOptions<T>
): UseQueryResult<T> {
  return useOptimizedQuery({
    ...options,
    staleTime: 1000 * 60 * 30, // Consider fresh for 30 minutes
    cacheTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    backgroundRefetch: false,
  })
}