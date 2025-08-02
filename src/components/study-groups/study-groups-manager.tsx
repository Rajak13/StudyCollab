'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStudyGroups } from '@/hooks/use-study-groups'
import { StudyGroupFilters as StudyGroupFiltersType } from '@/types/database'
import { Filter, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { CreateStudyGroupDialog } from './create-study-group-dialog'
import { StudyGroupFilters } from './study-group-filters'
import { StudyGroupsList } from './study-groups-list'

export function StudyGroupsManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<StudyGroupFiltersType>({
    page: 1,
    limit: 20,
  })

  // Combine search query with filters
  const queryFilters = {
    ...filters,
    search: searchQuery || undefined,
  }

  const {
    data: studyGroupsData,
    isLoading,
    error,
  } = useStudyGroups(queryFilters)

  const handleFiltersChange = (newFilters: Partial<StudyGroupFiltersType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search study groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <StudyGroupFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <StudyGroupsList
            data={studyGroupsData}
            isLoading={isLoading}
            error={error}
            onPageChange={handlePageChange}
            showJoinActions={true}
          />
        </TabsContent>

        <TabsContent value="my-groups" className="mt-6">
          <StudyGroupsList
            data={studyGroupsData}
            isLoading={isLoading}
            error={error}
            onPageChange={handlePageChange}
            showJoinActions={false}
            filterMyGroups={true}
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="rounded-lg border bg-card p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Join Requests</h3>
            <p className="text-muted-foreground">
              This section will show pending join requests for groups you
              manage.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Join request management will be implemented in the next phase.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <CreateStudyGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
