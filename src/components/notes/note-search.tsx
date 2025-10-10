'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { NoteFilters } from '@/types/database'
import { Filter, Hash, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface NoteSearchProps {
  filters: NoteFilters
  onFiltersChange: (filters: NoteFilters) => void
  availableTags: string[]
  className?: string
}

export function NoteSearch({
  filters,
  onFiltersChange,
  availableTags,
  className = '',
}: NoteSearchProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || [])
  const [showPublicOnly, setShowPublicOnly] = useState(
    filters.is_public || false
  )

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: searchQuery || undefined,
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, filters, onFiltersChange])

  // Update filters when tags change
  useEffect(() => {
    onFiltersChange({
      ...filters,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    })
  }, [selectedTags, filters, onFiltersChange])

  // Update filters when public filter changes
  useEffect(() => {
    onFiltersChange({
      ...filters,
      is_public: showPublicOnly || undefined,
    })
  }, [showPublicOnly, filters, onFiltersChange])

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setShowPublicOnly(false)
    onFiltersChange({})
  }

  const hasActiveFilters =
    searchQuery || selectedTags.length > 0 || showPublicOnly

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          placeholder="Search notes by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter controls */}
      <div className="flex items-center gap-2">
        {/* Tag filter dropdown */}
        {availableTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Hash className="mr-2 h-4 w-4" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => handleTagToggle(tag)}
                >
                  <Hash className="mr-2 h-3 w-3" />
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Additional filters dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Additional filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showPublicOnly}
              onCheckedChange={setShowPublicOnly}
            >
              Public notes only
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {(selectedTags.length > 0 || showPublicOnly) && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag)}
            >
              <Hash className="mr-1 h-3 w-3" />
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {showPublicOnly && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setShowPublicOnly(false)}
            >
              Public only
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
