'use client'

import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useQuickSearch, useSearchSuggestions } from '@/hooks/use-search'
import { cn } from '@/lib/utils'
import {
  BookmarkCheck,
  Clock,
  FileText,
  Search,
  StickyNote,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface QuickSearchProps {
  className?: string
}

export function QuickSearch({ className = '' }: QuickSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const { recentSearches, performSearch } = useQuickSearch()
  const { data: suggestions } = useSearchSuggestions(query)

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return

      try {
        await performSearch({
          query: searchQuery,
          types: ['task', 'note', 'resource'],
          sort_by: 'relevance',
          limit: 10,
        })

        // Navigate to search page with results
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        setOpen(false)
        setQuery('')
      } catch (error) {
        console.error('Search failed:', error)
      }
    },
    [performSearch, router]
  )

  // const handleResultSelect = useCallback((result: { type: string; id: string }) => {
  //   // Navigate directly to the content
  //   switch (result.type) {
  //     case 'task':
  //       router.push(`/tasks?id=${result.id}`)
  //       break
  //     case 'note':
  //       router.push(`/notes/${result.id}`)
  //       break
  //     case 'resource':
  //       router.push(`/resources/${result.id}`)
  //       break
  //   }
  //   setOpen(false)
  //   setQuery('')
  // }, [router])

  // const getTypeIcon = (type: string) => {
  //   switch (type) {
  //     case 'task':
  //       return <FileText className="h-4 w-4 text-blue-600" />
  //     case 'note':
  //       return <StickyNote className="h-4 w-4 text-green-600" />
  //     case 'resource':
  //       return <BookmarkCheck className="h-4 w-4 text-purple-600" />
  //     default:
  //       return <Search className="h-4 w-4" />
  //   }
  // }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search everything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tasks, notes, and resources..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Search Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <CommandGroup heading="Suggestions">
              {suggestions.slice(0, 5).map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  onSelect={() => handleSearch(suggestion)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <>
              {suggestions && suggestions.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Recent Searches">
                {recentSearches.slice(0, 5).map((recent) => (
                  <CommandItem
                    key={recent}
                    onSelect={() => handleSearch(recent)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {recent}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Quick Actions */}
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => router.push('/search')}>
              <Search className="mr-2 h-4 w-4" />
              Advanced Search
            </CommandItem>
            <CommandItem onSelect={() => router.push('/search?tab=bookmarks')}>
              <BookmarkCheck className="mr-2 h-4 w-4" />
              View Bookmarks
            </CommandItem>
            <CommandItem onSelect={() => router.push('/tasks/new')}>
              <FileText className="mr-2 h-4 w-4" />
              Create Task
            </CommandItem>
            <CommandItem onSelect={() => router.push('/notes/create')}>
              <StickyNote className="mr-2 h-4 w-4" />
              Create Note
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
