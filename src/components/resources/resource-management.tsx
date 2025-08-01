'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDeleteResource, useMyResources } from '@/hooks/use-resources'
import { Resource } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  Download,
  Edit,
  ExternalLink,
  File,
  FileText,
  Image,
  Link,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { ResourceEditDialog } from './resource-edit-dialog'
import { ResourceUploadForm } from './resource-upload-form'

const resourceTypeIcons = {
  PDF: FileText,
  DOCX: FileText,
  PPT: FileText,
  IMAGE: Image,
  VIDEO: Video,
  LINK: Link,
  OTHER: File,
}

export function ResourceManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)

  const { data: resources, isLoading, error } = useMyResources()
  const deleteResource = useDeleteResource()

  // Filter resources based on search and type
  const filteredResources =
    resources?.filter((resource) => {
      const matchesSearch =
        !searchQuery ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === 'all' || resource.type === typeFilter

      return matchesSearch && matchesType
    }) || []

  const handleDelete = async (resource: Resource) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteResource.mutateAsync(resource.id)
      } catch (error) {
        console.error('Error deleting resource:', error)
      }
    }
  }

  const handleDownload = (resource: Resource) => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
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
          <h1 className="text-3xl font-bold">My Resources</h1>
          <p className="text-muted-foreground">
            Manage your uploaded resources and track their performance
          </p>
        </div>
        <Button onClick={() => setShowUploadForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload New Resource
        </Button>
      </div>

      {/* Stats Cards */}
      {resources && resources.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resources.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Upvotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resources.reduce((sum, r) => sum + r.upvotes, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resources.reduce(
                  (sum, r) => sum + (r.comments?.length || 0),
                  0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resources.length > 0
                  ? (
                      resources.reduce((sum, r) => sum + r.score, 0) /
                      resources.length
                    ).toFixed(1)
                  : '0.0'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search your resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="min-w-[200px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
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
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resources ({filteredResources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="Error Loading Resources"
              description="There was an error loading your resources. Please try again."
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          ) : filteredResources.length === 0 ? (
            <EmptyState
              title={
                resources?.length === 0
                  ? 'No Resources Yet'
                  : 'No Matching Resources'
              }
              description={
                resources?.length === 0
                  ? "You haven't uploaded any resources yet. Upload your first resource to get started!"
                  : 'No resources match your current search criteria. Try adjusting your filters.'
              }
              action={
                resources?.length === 0
                  ? {
                      label: 'Upload First Resource',
                      onClick: () => setShowUploadForm(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => {
                    const IconComponent = resourceTypeIcons[resource.type]
                    return (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-gray-100 p-2">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium">
                                {resource.title}
                              </div>
                              <div className="line-clamp-1 text-sm text-muted-foreground">
                                {resource.description}
                              </div>
                              {resource.file_size && (
                                <div className="text-xs text-muted-foreground">
                                  {formatFileSize(resource.file_size)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{resource.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {resource.subject}
                            </div>
                            {resource.course_code && (
                              <div className="text-sm text-muted-foreground">
                                {resource.course_code}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {resource.upvotes}
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3" />
                              {resource.downvotes}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {resource.comments?.length || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {resource.score.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(
                              new Date(resource.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `/resources/${resource.id}`,
                                    '_blank'
                                  )
                                }
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Public Page
                              </DropdownMenuItem>
                              {resource.file_url && (
                                <DropdownMenuItem
                                  onClick={() => handleDownload(resource)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download File
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setEditingResource(resource)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Resource
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(resource)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Resource
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
