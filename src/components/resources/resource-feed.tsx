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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResources, useTrendingResources } from '@/hooks/use-resources'
import { Resource, ResourceFilters } from '@/types/database'
import { Filter, Grid, List, Plus, Search, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { ResourceCard } from './resource-card'
import { ResourceDetail } from './resource-detail'
import { ResourceEditDialog } from './resource-edit-dialog'
import { ResourceUploadForm } from './resource-upload-form'

interface ResourceFeedProps {
  showUploadButton?: boolean
  initialFilters?: Partial<ResourceFilters>
  showTrending?: boolean
}

export function ResourceFeed({
  showUploadButton = true,
  initialFilters = {},
  showTrending = true,
}: ResourceFeedProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'trending'>('all')
  const [filters, setFilters] = useState<ResourceFilters>({
    sortBy: 'recent',
    ...initialFilters,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [viewingResource, setViewingResource] = useState<Resource | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const {
    data: resourcesData,
    isLoading: isLoadingResources,
    error: resourcesError,
  } = useResources(filters)
  const {
    data: trendingResources,
    isLoading: isLoadingTrending,
    error: trendingError,
  } = useTrendingResources({
    limit: 20,
    days: 7,
  })

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
    setViewingResource(resource)
  }

  const handleResourceEdit = (resource: Resource) => {
    setEditingResource(resource)
  }

  // Get current data based on active tab
  // const currentResources = activeTab === 'trending' ? trendingResources : resourcesData?.data
  // const isLoading = activeTab === 'trending' ? isLoadingTrending : isLoadingResources
  // const error = activeTab === 'trending' ? trendingError : resourcesError

  if (showUploadForm) {
    return (
      <ResourceUploadForm
        onSuccess={() => setShowUploadForm(false)}
        onCancel={() => setShowUploadForm(false)}
      />
    )
  }

  if (viewingResource) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewingResource(null)}>
            ← Back to Feed
          </Button>
        </div>
        <ResourceDetail resourceId={viewingResource.id} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resource Feed</h1>
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'all' | 'trending')}
        >
          <TabsList>
            <TabsTrigger value="all">All Resources</TabsTrigger>
            {showTrending && (
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
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
      </div>

      {/* Filters Panel */}
      {showFilters && activeTab === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Sort By</label>
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

              <div>
                <label className="text-sm font-medium">Resource Type</label>
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

              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
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
      )}

      {/* Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'all' | 'trending')}
      >
        <TabsContent value="all" className="mt-0">
          <ResourceFeedContent
            resources={resourcesData?.data}
            isLoading={isLoadingResources}
            error={resourcesError}
            viewMode={viewMode}
            onResourceView={handleResourceView}
            onResourceEdit={handleResourceEdit}
            pagination={resourcesData?.pagination}
            onPageChange={(page) => handleFilterChange('page', page)}
            showUploadButton={showUploadButton}
            onUpload={() => setShowUploadForm(true)}
          />
        </TabsContent>

        {showTrending && (
          <TabsContent value="trending" className="mt-0">
            <ResourceFeedContent
              resources={trendingResources}
              isLoading={isLoadingTrending}
              error={trendingError}
              viewMode={viewMode}
              onResourceView={handleResourceView}
              onResourceEdit={handleResourceEdit}
              showUploadButton={false}
              emptyTitle="No Trending Resources"
              emptyDescription="No resources are trending right now. Check back later!"
            />
          </TabsContent>
        )}
      </Tabs>

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

interface ResourceFeedContentProps {
  resources?: Resource[]
  isLoading: boolean
  error: Error | null
  viewMode: 'grid' | 'list'
  onResourceView: (resource: Resource) => void
  onResourceEdit: (resource: Resource) => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  showUploadButton?: boolean
  onUpload?: () => void
  emptyTitle?: string
  emptyDescription?: string
}

function ResourceFeedContent({
  resources,
  isLoading,
  error,
  viewMode,
  onResourceView,
  onResourceEdit,
  pagination,
  onPageChange,
  showUploadButton = false,
  onUpload,
  emptyTitle = 'No Resources Found',
  emptyDescription = 'No resources have been uploaded yet. Be the first to share a resource!',
}: ResourceFeedContentProps) {
  if (isLoading) {
    return (
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
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Resources"
        description="There was an error loading the resources. Please try again."
        action={{
          label: 'Retry',
          onClick: () => window.location.reload(),
        }}
      />
    )
  }

  if (!resources || resources.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          showUploadButton && onUpload
            ? {
                label: 'Upload First Resource',
                onClick: onUpload,
              }
            : undefined
        }
      />
    )
  }

  return (
    <>
      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {resources.length}{' '}
          {pagination ? `of ${pagination.total}` : ''} resources
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
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onView={onResourceView}
            onEdit={onResourceEdit}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
