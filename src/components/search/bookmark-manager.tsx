'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bookmark,
  useBookmarkFolders,
  useBookmarks,
  useDeleteBookmark,
  useUpdateBookmark,
} from '@/hooks/use-bookmarks'
import { cn } from '@/lib/utils'
import {
  BookmarkCheck,
  Calendar,
  FileText,
  Folder,
  Hash,
  MoreVertical,
  Search,
  StickyNote,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'

interface BookmarkManagerProps {
  className?: string
  onBookmarkClick?: (bookmark: Bookmark) => void
}

export function BookmarkManager({
  className = '',
  onBookmarkClick,
}: BookmarkManagerProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [selectedType, setSelectedType] = useState<
    'task' | 'note' | 'resource' | ''
  >('')
  const [searchQuery, setSearchQuery] = useState('')
  // const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  // const [newFolderName, setNewFolderName] = useState('')

  const { data: bookmarks, isLoading } = useBookmarks({
    folder: selectedFolder || undefined,
    content_type: selectedType || undefined,
    search: searchQuery || undefined,
  })

  const { data: folders } = useBookmarkFolders()
  const deleteBookmark = useDeleteBookmark()
  const updateBookmark = useUpdateBookmark()

  const handleDeleteBookmark = useCallback(
    (bookmark: Bookmark) => {
      if (confirm('Are you sure you want to remove this bookmark?')) {
        deleteBookmark.mutate(bookmark.id)
      }
    },
    [deleteBookmark]
  )

  const handleMoveToFolder = useCallback(
    (bookmark: Bookmark, folderName: string) => {
      updateBookmark.mutate({
        id: bookmark.id,
        folder_name: folderName || undefined,
      })
      // setEditingBookmark(null)
    },
    [updateBookmark]
  )

  // const getTypeIcon = (type: string) => {
  //   switch (type) {
  //     case 'task':
  //       return <FileText className="h-4 w-4 text-blue-600" />
  //     case 'note':
  //       return <StickyNote className="h-4 w-4 text-green-600" />
  //     case 'resource':
  //       return <BookmarkCheck className="h-4 w-4 text-purple-600" />
  //     default:
  //       return <BookmarkCheck className="h-4 w-4" />
  //   }
  // }

  const groupedBookmarks = bookmarks?.reduce(
    (acc, bookmark) => {
      const folder = bookmark.folder_name || 'Unfiled'
      if (!acc[folder]) {
        acc[folder] = []
      }
      acc[folder].push(bookmark)
      return acc
    },
    {} as Record<string, Bookmark[]>
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookmarks</h2>
          <p className="text-muted-foreground">
            Manage your saved content and organize it into folders
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs
          value={selectedType}
          onValueChange={(value) =>
            setSelectedType(value as 'task' | 'note' | 'resource' | '')
          }
        >
          <TabsList>
            <TabsTrigger value="">All Types</TabsTrigger>
            <TabsTrigger value="task">Tasks</TabsTrigger>
            <TabsTrigger value="note">Notes</TabsTrigger>
            <TabsTrigger value="resource">Resources</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Folder Navigation */}
      {folders && folders.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Folders</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFolder === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder('')}
            >
              <Folder className="mr-2 h-4 w-4" />
              All Bookmarks
              {bookmarks && (
                <Badge variant="secondary" className="ml-2">
                  {bookmarks.length}
                </Badge>
              )}
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.name}
                variant={selectedFolder === folder.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFolder(folder.name)}
              >
                <Folder className="mr-2 h-4 w-4" />
                {folder.name}
                <Badge variant="secondary" className="ml-2">
                  {folder.bookmark_count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarks List */}
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

        {!isLoading && (!bookmarks || bookmarks.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookmarkCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-medium">No bookmarks found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedType || selectedFolder
                  ? 'Try adjusting your search or filters'
                  : 'Start bookmarking content to see it here'}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          groupedBookmarks &&
          Object.keys(groupedBookmarks).length > 0 && (
            <div className="space-y-6">
              {Object.entries(groupedBookmarks).map(
                ([folderName, folderBookmarks]) => (
                  <div key={folderName} className="space-y-3">
                    {!selectedFolder && (
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{folderName}</h3>
                        <Badge variant="secondary">
                          {folderBookmarks.length}
                        </Badge>
                      </div>
                    )}

                    <div className="space-y-3">
                      {folderBookmarks.map((bookmark) => (
                        <BookmarkCard
                          key={bookmark.id}
                          bookmark={bookmark}
                          onClick={() => onBookmarkClick?.(bookmark)}
                          onDelete={() => handleDeleteBookmark(bookmark)}
                          onMoveToFolder={(folderName) =>
                            handleMoveToFolder(bookmark, folderName)
                          }
                          availableFolders={folders?.map((f) => f.name) || []}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </div>
  )
}

interface BookmarkCardProps {
  bookmark: Bookmark
  onClick: () => void
  onDelete: () => void
  onMoveToFolder: (folderName: string) => void
  availableFolders: string[]
}

function BookmarkCard({
  bookmark,
  onClick,
  onDelete,
  onMoveToFolder,
  availableFolders,
}: BookmarkCardProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const getTypeIcon = () => {
    switch (bookmark.content_type) {
      case 'task':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'note':
        return <StickyNote className="h-4 w-4 text-green-600" />
      case 'resource':
        return <BookmarkCheck className="h-4 w-4 text-purple-600" />
    }
  }

  const handleMoveToNewFolder = () => {
    if (newFolderName.trim()) {
      onMoveToFolder(newFolderName.trim())
      setNewFolderName('')
      setShowMoveDialog(false)
    }
  }

  return (
    <Card className="cursor-pointer transition-colors hover:bg-accent/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2" onClick={onClick}>
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <span className="text-xs font-medium capitalize text-muted-foreground">
                {bookmark.content_type}
              </span>
              {bookmark.content_data?.priority && (
                <Badge variant="outline" className="text-xs">
                  {bookmark.content_data.priority}
                </Badge>
              )}
              {bookmark.content_data?.status && (
                <Badge variant="outline" className="text-xs">
                  {bookmark.content_data.status}
                </Badge>
              )}
              {bookmark.content_data?.subject && (
                <Badge variant="outline" className="text-xs">
                  {bookmark.content_data.subject}
                </Badge>
              )}
            </div>

            <div>
              <h3 className="line-clamp-1 font-medium">{bookmark.title}</h3>
              {bookmark.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {bookmark.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Saved {new Date(bookmark.created_at).toLocaleDateString()}
              </div>
              {bookmark.content_data?.upvotes !== undefined && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {bookmark.content_data.upvotes}
                </div>
              )}
              {bookmark.content_data?.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due{' '}
                  {new Date(
                    bookmark.content_data.due_date
                  ).toLocaleDateString()}
                </div>
              )}
            </div>

            {bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {bookmark.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Hash className="mr-1 h-2 w-2" />
                    {tag}
                  </Badge>
                ))}
                {bookmark.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{bookmark.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Folder className="mr-2 h-4 w-4" />
                    Move to folder
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Move to Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          onMoveToFolder('')
                          setShowMoveDialog(false)
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove from folder
                      </Button>
                      {availableFolders.map((folder) => (
                        <Button
                          key={folder}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            onMoveToFolder(folder)
                            setShowMoveDialog(false)
                          }}
                        >
                          <Folder className="mr-2 h-4 w-4" />
                          {folder}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Create new folder..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleMoveToNewFolder()
                          }
                        }}
                      />
                      <Button
                        onClick={handleMoveToNewFolder}
                        disabled={!newFolderName.trim()}
                        className="w-full"
                      >
                        Create and Move
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove bookmark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
