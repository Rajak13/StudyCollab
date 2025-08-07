import { QueryClient } from '@tanstack/react-query'

/**
 * Creates a new QueryClient with optimized default options
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 2 times with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error && 'status' in error) {
            const status = (error as any).status
            if (status >= 400 && status < 500) {
              return false
            }
          }
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus for better performance
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Enable background refetching for important data
        refetchInterval: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
        retryDelay: 1000,
      },
    },
  })
}

/**
 * Query client instance for server-side rendering
 */
export const queryClient = createQueryClient()