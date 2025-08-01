'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBookmarks,
  useCreateBookmark,
  useDeleteBookmark,
  useIsBookmarked,
} from '@/hooks/use-bookmarks'
import {
  SearchFilters,
  SearchResult,
  useQuickSearch,
  useSearch,
  useSearchAnalytics,
  useSearchSuggestions,
} from '@/hooks/use-search'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  Hash,
  Search,
  StickyNote,
  ThumbsUp,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface UnifiedSearchProps {
  className?: string
  placeholder?: string
  defaultFilters?: Partial<SearchFilters>
  onResultClick?: (result: SearchResult) => void
}

export function UnifiedSearch({
  className = '',
  placeholder = 'Search tasks, notes, and resources...',
  defaultFilters = {},
  onResultClick,
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    types: ['task', 'note', 'resource'],
    sort_by: 'relevance',
    page: 1,
    limit: 20,
    ...defaultFilters,
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  const { recentSearches, performSearch } = useQuickSearch()
  const { trackSearch, trackResultClick } = useSearchAnalytics()

  // Update filters when query changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, query: query || undefined }))
  }, [query])

  const { data: searchResults, isLoading, error } = useSearch(filters)
  const { data: suggestions } = useSearchSuggestions(query)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setShowSuggestions(false)
    await performSearch(filters)

    if (searchResults) {
      trackSearch(query, searchResults.data.length)
    }
  }, [query, filters, performSearch, trackSearch, searchResults])

  const handleResultClick = useCallback(
    (result: SearchResult, index: number) => {
      trackResultClick(query, result.id, result.type, index)
      onResultClick?.(result)
    },
    [query, trackResultClick, onResultClick]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (
          selectedSuggestionIndex >= 0 &&
          suggestions &&
          suggestions[selectedSuggestionIndex]
        ) {
          setQuery(suggestions[selectedSuggestionIndex])
          setShowSuggestions(false)
          setSelectedSuggestionIndex(-1)
        } else {
          handleSearch()
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          Math.min(prev + 1, (suggestions?.length || 0) - 1)
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1))
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    },
    [selectedSuggestionIndex, suggestions, handleSearch]
  )

  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: 1 }))
  }, [])

  const toggleType = useCallback(
    (type: 'task' | 'note' | 'resource') => {
      updateFilters({
        types: filters.types?.includes(type)
          ? filters.types.filter((t) => t !== type)
          : [...(filters.types || []), type],
      })
    },
    [filters.types, updateFilters]
  )

  const toggleTag = useCallback(
    (tag: string) => {
      updateFilters({
        tags: filters.tags?.includes(tag)
          ? filters.tags.filter((t) => t !== tag)
          : [...(filters.tags || []), tag],
      })
    },
    [filters.tags, updateFilters]
  )

  const clearFilters = useCallback(() => {
    setFilters({
      types: ['task', 'note', 'resource'],
      sort_by: 'relevance',
      page: 1,
      limit: 20,
    })
    setQuery('')
  }, [])

  const hasActiveFilters =
    query ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.types && filters.types.length < 3) ||
    filters.priority?.length ||
    filters.status?.length ||
    filters.subjects?.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
              setSelectedSuggestionIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              onClick={() => {
                setQuery('')
                setShowSuggestions(false)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (suggestions?.length || recentSearches.length) && (
          <Card className="absolute top-full z-50 mt-1 w-full">
            <CardContent className="p-2">
              {suggestions && suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full justify-start text-left',
                        selectedSuggestionIndex === index && 'bg-accent'
                      )}
                      onClick={() => {
                        setQuery(suggestion)
                        setShowSuggestions(false)
                        handleSearch()
                      }}
                    >
                      <Search className="mr-2 h-3 w-3" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              {recentSearches.length > 0 && (
                <div className="space-y-1">
                  {suggestions?.length && <div className="my-2 border-t" />}
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Recent Searches
                  </div>
                  {recentSearches.slice(0, 5).map((recent) => (
                    <Button
                      key={recent}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => {
                        setQuery(recent)
                        setShowSuggestions(false)
                        handleSearch()
                      }}
                    >
                      <Clock className="mr-2 h-3 w-3" />
                      {recent}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Content Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Types
              {filters.types && filters.types.length < 3 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.types.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Content Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.types?.includes('task')}
              onCheckedChange={() => toggleType('task')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Tasks
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.types?.includes('note')}
              onCheckedChange={() => toggleType('note')}
            >
              <StickyNote className="mr-2 h-4 w-4" />
              Notes
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.types?.includes('resource')}
              onCheckedChange={() => toggleType('resource')}
            >
              <Bookmark className="mr-2 h-4 w-4" />
              Resources
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort by
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={filters.sort_by === 'relevance'}
              onCheckedChange={() => updateFilters({ sort_by: 'relevance' })}
            >
              Relevance
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.sort_by === 'date'}
              onCheckedChange={() => updateFilters({ sort_by: 'date' })}
            >
              Date
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.sort_by === 'popularity'}
              onCheckedChange={() => updateFilters({ sort_by: 'popularity' })}
            >
              Popularity
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {filters.tags && filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              <Hash className="mr-1 h-3 w-3" />
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <Skeleton className="mb-1 h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              <p>Failed to search. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {searchResults && searchResults.data.length === 0 && query && (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-sm">
                Try adjusting your search terms or filters
              </p>
            </CardContent>
          </Card>
        )}

        {searchResults && searchResults.data.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {searchResults.pagination.total} results found
              </p>
            </div>

            <div className="space-y-3">
              {searchResults.data.map((result, index) => (
                <SearchResultCard
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onClick={() => handleResultClick(result, index)}
                />
              ))}
            </div>

            {/* Pagination */}
            {searchResults.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={searchResults.pagination.page === 1}
                  onClick={() =>
                    updateFilters({ page: searchResults.pagination.page - 1 })
                  }
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {searchResults.pagination.page} of{' '}
                  {searchResults.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    searchResults.pagination.page ===
                    searchResults.pagination.totalPages
                  }
                  onClick={() =>
                    updateFilters({ page: searchResults.pagination.page + 1 })
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface SearchResultCardProps {
  result: SearchResult
  onClick: () => void
}

function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  const isBookmarked = useIsBookmarked(result.type, result.id)
  const createBookmark = useCreateBookmark()
  const deleteBookmark = useDeleteBookmark()
  const { data: bookmarks } = useBookmarks()

  const bookmark = bookmarks?.find(
    (b) => b.content_type === result.type && b.content_id === result.id
  )

  const handleBookmarkToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      if (isBookmarked && bookmark) {
        deleteBookmark.mutate(bookmark.id)
      } else {
        createBookmark.mutate({
          content_type: result.type,
          content_id: result.id,
        })
      }
    },
    [isBookmarked, bookmark, createBookmark, deleteBookmark, result]
  )

  const getTypeIcon = () => {
    switch (result.type) {
      case 'task':
        return <FileText className="h-4 w-4" />
      case 'note':
        return <StickyNote className="h-4 w-4" />
      case 'resource':
        return <Bookmark className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (result.type) {
      case 'task':
        return 'text-blue-600'
      case 'note':
        return 'text-green-600'
      case 'resource':
        return 'text-purple-600'
    }
  }

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn('flex items-center gap-1', getTypeColor())}>
                {getTypeIcon()}
                <span className="text-xs font-medium capitalize">
                  {result.type}
                </span>
              </div>
              {result.priority && (
                <Badge variant="outline" className="text-xs">
                  {result.priority}
                </Badge>
              )}
              {result.status && (
                <Badge variant="outline" className="text-xs">
                  {result.status}
                </Badge>
              )}
              {result.subject && (
                <Badge variant="outline" className="text-xs">
                  {result.subject}
                </Badge>
              )}
            </div>

            <div>
              <h3 className="line-clamp-1 font-medium">{result.title}</h3>
              {result.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {result.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(result.updated_at).toLocaleDateString()}
              </div>
              {result.upvotes !== undefined && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {result.upvotes}
                </div>
              )}
              {result.due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due {new Date(result.due_date).toLocaleDateString()}
                </div>
              )}
            </div>

            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Hash className="mr-1 h-2 w-2" />
                    {tag}
                  </Badge>
                ))}
                {result.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{result.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-8 w-8 p-0"
            onClick={handleBookmarkToggle}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-yellow-600" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
