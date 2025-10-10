'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFileFolders, useFolderBreadcrumb } from '@/hooks/use-file-folders'
import { useDeleteFile, useDownloadFile, useFiles } from '@/hooks/use-files'
import { formatFileSize, getFileIcon } from '@/lib/file-upload'
import { FileFolder, FileRecord } from '@/types/database'
import {
  ArrowLeft,
  Download,
  Edit,
  Eye,
  Folder,
  FolderPlus,
  Grid,
  List,
  MoreVertical,
  Search,
  Share,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { FileFolderDialog } from './file-folder-dialog'
import { FilePreview } from './file-preview'
import { FileShareDialog } from './file-share-dialog'
import { FileUpload } from './file-upload'

interface FileManagerProps {
  initialFolderId?: string
}

export function FileManager({ initialFolderId }: FileManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    initialFolderId
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  // const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null) // TODO: Implement file editing
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null)
  const [shareFile, setShareFile] = useState<FileRecord | null>(null)
  const [showFolderDialog, setShowFolderDialog] = useState(false)

  const { data: filesData, isLoading: filesLoading } = useFiles({
    folder_id: currentFolderId || 'root',
    search: searchQuery,
  })

  const { data: foldersData, isLoading: foldersLoading } = useFileFolders(
    currentFolderId || 'root'
  )

  const { data: breadcrumbData } = useFolderBreadcrumb(currentFolderId)

  const deleteFileMutation = useDeleteFile()
  const downloadFileMutation = useDownloadFile()

  const files = filesData?.data || []
  const folders = foldersData?.data || []
  const breadcrumb = breadcrumbData || []

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId)
  }

  const handleBackClick = () => {
    if (breadcrumb.length > 0) {
      const parentFolder = breadcrumb[breadcrumb.length - 2]
      setCurrentFolderId(parentFolder?.id)
    } else {
      setCurrentFolderId(undefined)
    }
  }

  const handleFileAction = (action: string, file: FileRecord) => {
    switch (action) {
      case 'preview':
        setPreviewFile(file)
        break
      case 'download':
        downloadFileMutation.mutate({ fileId: file.id })
        break
      case 'share':
        setShareFile(file)
        break
      case 'edit':
        // TODO: Implement file editing
        break
      case 'delete':
        if (confirm('Are you sure you want to delete this file?')) {
          deleteFileMutation.mutate(file.id)
        }
        break
    }
  }

  const renderFileCard = (file: FileRecord) => (
    <Card key={file.id} className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getFileIcon(file.file_type)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.file_size)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleFileAction('preview', file)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleFileAction('download', file)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFileAction('share', file)}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFileAction('edit', file)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleFileAction('delete', file)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {file.description && (
          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
            {file.description}
          </p>
        )}
        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {file.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{file.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(file.created_at).toLocaleDateString()}</span>
          {file.is_public && <Badge variant="outline">Public</Badge>}
        </div>
      </CardContent>
    </Card>
  )

  const renderFolderCard = (folder: FileFolder) => (
    <Card
      key={folder.id}
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => handleFolderClick(folder.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <Folder className="h-6 w-6" style={{ color: folder.color }} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{folder.name}</p>
            <p className="text-sm text-gray-500">
              {new Date(folder.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      {folder.description && (
        <CardContent>
          <p className="line-clamp-2 text-sm text-gray-600">
            {folder.description}
          </p>
        </CardContent>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentFolderId && (
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Files</h1>
            {breadcrumb.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Files</span>
                {breadcrumb.map((folder) => (
                  <span key={folder.id}>
                    /{' '}
                    <button
                      className="hover:text-gray-700"
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFolderDialog(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <FileUpload
            folderId={currentFolderId}
            onUploadComplete={() => {
              // Refresh data
            }}
          />
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filesLoading || foldersLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-medium">Folders</h3>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'space-y-2'
                    }
                  >
                    {folders.map(renderFolderCard)}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-medium">Files</h3>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'space-y-2'
                    }
                  >
                    {files.map(renderFileCard)}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {folders.length === 0 && files.length === 0 && !searchQuery && (
                <div className="py-12 text-center">
                  <Folder className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">No files yet</h3>
                  <p className="mb-4 text-gray-500">
                    Upload your first file to get started
                  </p>
                  <FileUpload folderId={currentFolderId} />
                </div>
              )}

              {/* No Search Results */}
              {folders.length === 0 && files.length === 0 && searchQuery && (
                <div className="py-12 text-center">
                  <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">No results found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <div className="py-8 text-center text-gray-500">
            Recent files feature coming soon
          </div>
        </TabsContent>

        <TabsContent value="shared">
          <div className="py-8 text-center text-gray-500">
            Shared files feature coming soon
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FileFolderDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        parentId={currentFolderId}
      />

      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onOpenChange={() => setPreviewFile(null)}
        />
      )}

      {shareFile && (
        <FileShareDialog
          file={shareFile}
          open={!!shareFile}
          onOpenChange={() => setShareFile(null)}
        />
      )}
    </div>
  )
}
