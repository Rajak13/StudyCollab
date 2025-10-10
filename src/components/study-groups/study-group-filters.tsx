'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StudyGroupFilters as StudyGroupFiltersType } from '@/types/database'
import { X } from 'lucide-react'

interface StudyGroupFiltersProps {
  filters: StudyGroupFiltersType
  onFiltersChange: (filters: Partial<StudyGroupFiltersType>) => void
  onClose: () => void
}

export function StudyGroupFilters({
  filters,
  onFiltersChange,
  onClose,
}: StudyGroupFiltersProps) {
  const handleSubjectChange = (subject: string) => {
    onFiltersChange({
      subject: subject ? [subject] : undefined,
    })
  }

  const handleUniversityChange = (university: string) => {
    onFiltersChange({
      university: university ? [university] : undefined,
    })
  }

  const handlePrivacyChange = (isPrivate: boolean | undefined) => {
    onFiltersChange({
      is_private: isPrivate,
    })
  }

  const handleSortChange = (sortBy: 'name' | 'created_at' | 'member_count') => {
    onFiltersChange({
      sort_by: sortBy,
    })
  }

  const handleSortOrderChange = (sortOrder: 'asc' | 'desc') => {
    onFiltersChange({
      sort_order: sortOrder,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      subject: undefined,
      university: undefined,
      is_private: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Filters</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Subject Filter */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Mathematics"
              value={filters.subject?.[0] || ''}
              onChange={(e) => handleSubjectChange(e.target.value)}
            />
          </div>

          {/* University Filter */}
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              placeholder="e.g., Tribhuvan University"
              value={filters.university?.[0] || ''}
              onChange={(e) => handleUniversityChange(e.target.value)}
            />
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sort_by || 'created_at'}
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="member_count">Member Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Select
              value={filters.sort_order || 'desc'}
              onValueChange={handleSortOrderChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Privacy Filter */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Group Privacy</Label>
            <p className="text-sm text-muted-foreground">
              Filter by public or private groups
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={filters.is_private === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePrivacyChange(false)}
            >
              Public
            </Button>
            <Button
              variant={filters.is_private === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePrivacyChange(true)}
            >
              Private
            </Button>
            <Button
              variant={filters.is_private === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePrivacyChange(undefined)}
            >
              All
            </Button>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex justify-end border-t pt-4">
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
