'use client'

import { Filter, Search, Tag, X } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { useTaskCategories } from '@/hooks/use-tasks'
import type { TaskFiltersData, TaskPriority, TaskStatus } from '@/types/database'

interface TaskFiltersProps {
  filters: Partial<TaskFiltersData>
  onFiltersChange: (filters: Partial<TaskFiltersData>) => void
  className?: string
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const sortOptions = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
]

export function TaskFilters({ filters, onFiltersChange, className }: TaskFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tagInput, setTagInput] = useState('')
  
  const { data: categoriesResponse } = useTaskCategories()
  const categories = categoriesResponse?.data || []

  const updateFilter = (key: keyof TaskFiltersData, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const addTag = () => {
    if (tagInput.trim() && !filters.tags?.includes(tagInput.trim())) {
      const newTags = [...(filters.tags || []), tagInput.trim()]
      updateFilter('tags', newTags)
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags?.filter(tag => tag !== tagToRemove) || []
    updateFilter('tags', newTags.length > 0 ? newTags : undefined)
  }

  const clearFilters = () => {
    onFiltersChange({
      search: undefined,
      status: undefined,
      priority: undefined,
      category_id: undefined,
      tags: undefined,
      due_date_from: undefined,
      due_date_to: undefined,
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && 
    (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Search and Sort - Mobile Responsive */}
        <div className="space-y-3">
          {/* Search Bar - Full width on mobile */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
              className="pl-10 w-full"
            />
          </div>
          
          {/* Sort Controls and Filters - Responsive layout */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex gap-2 flex-1">
              <Select
                value={filters.sort_by || 'created_at'}
                onValueChange={(value) => updateFilter('sort_by', value)}
              >
                <SelectTrigger className="flex-1 sm:w-auto sm:min-w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sort_order || 'desc'}
                onValueChange={(value) => updateFilter('sort_order', value)}
              >
                <SelectTrigger className="flex-1 sm:w-auto sm:min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto sm:min-w-[100px]"
            >
              <Filter className="h-4 w-4" />
              <span className="sm:inline">Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Advanced Filters</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 min-w-0">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status?.includes(option.value) || false}
                      onCheckedChange={(checked) => {
                        const currentStatus = filters.status || []
                        if (checked) {
                          updateFilter('status', [...currentStatus, option.value])
                        } else {
                          const newStatus = currentStatus.filter(s => s !== option.value)
                          updateFilter('status', newStatus.length > 0 ? newStatus : undefined)
                        }
                      }}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm truncate">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 min-w-0">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={filters.priority?.includes(option.value) || false}
                      onCheckedChange={(checked) => {
                        const currentPriority = filters.priority || []
                        if (checked) {
                          updateFilter('priority', [...currentPriority, option.value])
                        } else {
                          const newPriority = currentPriority.filter(p => p !== option.value)
                          updateFilter('priority', newPriority.length > 0 ? newPriority : undefined)
                        }
                      }}
                    />
                    <Label htmlFor={`priority-${option.value}`} className="text-sm truncate">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category_id || 'all'}
                onValueChange={(value) => updateFilter('category_id', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Filter */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Add tag filter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addTag} className="w-full sm:w-auto">
                  Add
                </Button>
              </div>
              
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
                      <Tag className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Due Date From</Label>
                <Input
                  type="date"
                  value={filters.due_date_from?.split('T')[0] || ''}
                  onChange={(e) => updateFilter('due_date_from', e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Due Date To</Label>
                <Input
                  type="date"
                  value={filters.due_date_to?.split('T')[0] || ''}
                  onChange={(e) => updateFilter('due_date_to', e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}