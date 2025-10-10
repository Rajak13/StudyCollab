'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useResources } from '@/hooks/use-resources'
import { Resource, ResourceFilters } from '@/types/database'
import { Grid, List, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { ResourceCard } from './resource-card'
import { ResourceEditDialog } from './resource-edit-dialog'
import { ResourceUploadForm } from './resource-upload-form'

interface ResourceListProps {
  showUploadButton?: boolean
  initialFilters?: Partial<ResourceFilters>
}

export function ResourceList({
  showUploadButton = true,
  initialFilters = {},
}: ResourceListProps) {
  const [filters, setFilters] = useState<ResourceFilters>({
    sortBy: 'recent',
    ...initialFilters,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: resourcesData, isLoading, error } = useResources(filters)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters((prev) => ({ ...prev, search: query || undefined }))
  }

  const handleFilterChange = (
    key: keyof ResourceFilters,
    value: string | string[] | number | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({ sortBy: 'recent' })
    setSearchQuery('')
  }

  const handleResourceView = (resource: Resource) => {
    // TODO: Navigate to resource detail page or open modal
    console.log('View resource:', resource)
  }

  const handleResourceEdit = (resource: Resource) => {
    setEditingResource(resource)
  }

  if (showUploadForm) {
    return (
      <ResourceUploadForm
        onSuccess={() => setShowUploadForm(false)}
        onCancel={() => setShowUploadForm(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Discover and share study materials with the community
          </p>
        </div>
        {showUploadButton && (
          <Button onClick={() => setShowUploadForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px] flex-1">
              <Select
                value={filters.sortBy || 'recent'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="score">Highest Score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[200px] flex-1">
              <Select
                value={filters.type?.[0] || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'type',
                    value === 'all' ? undefined : [value]
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PDF">PDF Documents</SelectItem>
                  <SelectItem value="DOCX">Word Documents</SelectItem>
                  <SelectItem value="PPT">Presentations</SelectItem>
                  <SelectItem value="IMAGE">Images</SelectItem>
                  <SelectItem value="VIDEO">Videos</SelectItem>
                  <SelectItem value="LINK">Web Links</SelectItem>
                  <SelectItem value="OTHER">Other Files</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {(filters.search || filters.type || filters.subject) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters */}
          {(filters.search || filters.type || filters.subject) && (
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary">Search: {filters.search}</Badge>
              )}
              {filters.type?.map((type) => (
                <Badge key={type} variant="secondary">
                  Type: {type}
                </Badge>
              ))}
              {filters.subject?.map((subject) => (
                <Badge key={subject} variant="secondary">
                  Subject: {subject}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        {isLoading ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                : 'space-y-4'
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Error Loading Resources"
            description="There was an error loading the resources. Please try again."
            action={{
              label: 'Retry',
              onClick: () => window.location.reload(),
            }}
          />
        ) : !resourcesData?.data || resourcesData.data.length === 0 ? (
          <EmptyState
            title="No Resources Found"
            description={
              filters.search || filters.type || filters.subject
                ? 'No resources match your current filters. Try adjusting your search criteria.'
                : 'No resources have been uploaded yet. Be the first to share a resource!'
            }
            action={
              showUploadButton
                ? {
                    label: 'Upload First Resource',
                    onClick: () => setShowUploadForm(true),
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {resourcesData.data.length} of{' '}
                {resourcesData.pagination.total} resources
              </p>
            </div>

            {/* Resource Grid/List */}
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
              }
            >
              {resourcesData.data.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onView={handleResourceView}
                  onEdit={handleResourceEdit}
                />
              ))}
            </div>

            {/* Pagination */}
            {resourcesData.pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={resourcesData.pagination.page === 1}
                    onClick={() =>
                      handleFilterChange(
                        'page',
                        resourcesData.pagination.page - 1
                      )
                    }
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {resourcesData.pagination.page} of{' '}
                    {resourcesData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={
                      resourcesData.pagination.page ===
                      resourcesData.pagination.totalPages
                    }
                    onClick={() =>
                      handleFilterChange(
                        'page',
                        resourcesData.pagination.page + 1
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      {editingResource && (
        <ResourceEditDialog
          resource={editingResource}
          open={!!editingResource}
          onOpenChange={(open) => !open && setEditingResource(null)}
        />
      )}
    </div>
  )
}
