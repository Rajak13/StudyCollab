import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

export interface SearchResult {
  id: string
  type: 'task' | 'note' | 'resource'
  title: string
  description?: string
  content?: string
  tags: string[]
  created_at: string
  updated_at: string
  relevance_score: number
  // Type-specific fields
  priority?: string
  status?: string
  due_date?: string
  is_public?: boolean
  subject?: string
  upvotes?: number
  downvotes?: number
}

export interface SearchFilters {
  query?: string
  types?: ('task' | 'note' | 'resource')[]
  tags?: string[]
  date_from?: string
  date_to?: string
  categories?: string[]
  subjects?: string[]
  priority?: string[]
  status?: string[]
  is_public?: boolean
  sort_by?: 'relevance' | 'date' | 'popularity'
  page?: number
  limit?: number
}

export interface SearchResponse {
  data: SearchResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  suggestions: string[]
  error: string | null
}

// Main search hook
export function useSearch(filters: SearchFilters = {}) {
  const [isSearching, setIsSearching] = useState(false)

  return useQuery({
    queryKey: ['search', filters],
    queryFn: async (): Promise<SearchResponse> => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams()

        if (filters.query) params.append('query', filters.query)
        if (filters.types) params.append('types', filters.types.join(','))
        if (filters.tags) params.append('tags', filters.tags.join(','))
        if (filters.date_from) params.append('date_from', filters.date_from)
        if (filters.date_to) params.append('date_to', filters.date_to)
        if (filters.categories)
          params.append('categories', filters.categories.join(','))
        if (filters.subjects)
          params.append('subjects', filters.subjects.join(','))
        if (filters.priority)
          params.append('priority', filters.priority.join(','))
        if (filters.status) params.append('status', filters.status.join(','))
        if (filters.is_public !== undefined)
          params.append('is_public', filters.is_public.toString())
        if (filters.sort_by) params.append('sort_by', filters.sort_by)
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Search failed')
        }

        return response.json()
      } finally {
        setIsSearching(false)
      }
    },
    enabled: !!(filters.query && filters.query.length > 0),
    staleTime: 30 * 1000, // 30 seconds
    meta: {
      isSearching,
    },
  })
}

// Search suggestions hook
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async (): Promise<string[]> => {
      if (!query || query.length < 2) {
        return []
      }

      const params = new URLSearchParams({ query })
      const response = await fetch(`/api/search?${params.toString()}`)

      if (!response.ok) {
        return []
      }

      const data: SearchResponse = await response.json()
      return data.suggestions || []
    },
    enabled: !!(query && query.length >= 2),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Quick search hook for instant results
export function useQuickSearch() {
  const queryClient = useQueryClient()
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recent-searches')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return

    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 10)
      localStorage.setItem('recent-searches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('recent-searches')
  }, [])

  const performSearch = useCallback(
    async (filters: SearchFilters) => {
      if (filters.query) {
        addRecentSearch(filters.query)
      }

      // Prefetch search results
      return queryClient.fetchQuery({
        queryKey: ['search', filters],
        queryFn: async () => {
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                params.append(key, value.join(','))
              } else {
                params.append(key, value.toString())
              }
            }
          })

          const response = await fetch(`/api/search?${params.toString()}`)
          if (!response.ok) {
            throw new Error('Search failed')
          }
          return response.json()
        },
      })
    },
    [queryClient, addRecentSearch]
  )

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    performSearch,
  }
}

// Popular searches hook
export function usePopularSearches() {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async (): Promise<string[]> => {
      // This could be enhanced to track actual popular searches
      // For now, return some common academic terms
      return [
        'calculus',
        'physics',
        'chemistry',
        'biology',
        'computer science',
        'mathematics',
        'literature',
        'history',
        'psychology',
        'economics',
      ]
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

// Search analytics hook
export function useSearchAnalytics() {
  // const { toast } = useToast()

  const trackSearch = useCallback(
    async (query: string, resultsCount: number) => {
      try {
        // Track search for analytics (could be sent to analytics service)
        console.log('Search tracked:', {
          query,
          resultsCount,
          timestamp: new Date(),
        })
      } catch (error) {
        console.error('Failed to track search:', error)
      }
    },
    []
  )

  const trackResultClick = useCallback(
    async (
      query: string,
      resultId: string,
      resultType: string,
      position: number
    ) => {
      try {
        // Track result click for analytics
        console.log('Result click tracked:', {
          query,
          resultId,
          resultType,
          position,
          timestamp: new Date(),
        })
      } catch (error) {
        console.error('Failed to track result click:', error)
      }
    },
    []
  )

  return {
    trackSearch,
    trackResultClick,
  }
}
