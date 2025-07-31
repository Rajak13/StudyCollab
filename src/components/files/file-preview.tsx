'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDownloadFile } from '@/hooks/use-files'
import { canPreviewFile, formatFileSize } from '@/lib/file-upload'
import { FileRecord } from '@/types/database'
import {
  Archive,
  Download,
  ExternalLink,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
} from 'lucide-react'
import { useState } from 'react'

interface FilePreviewProps {
  file: FileRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilePreview({ file, open, onOpenChange }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false)
  const downloadMutation = useDownloadFile()

  const handleDownload = () => {
    downloadMutation.mutate({ fileId: file.id })
  }

  const renderPreview = () => {
    if (!canPreviewFile(file.mime_type)) {
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-gray-50">
          <FileIcon className="mb-4 h-16 w-16 text-gray-400" />
          <p className="mb-2 text-gray-600">Preview not available</p>
          <p className="text-sm text-gray-500">
            Download the file to view its contents
          </p>
        </div>
      )
    }

    // Image preview
    if (file.mime_type.startsWith('image/')) {
      return (
        <div className="relative">
          {!imageError ? (
            <img
              src={file.file_url}
              alt={file.name}
              className="mx-auto max-h-96 max-w-full rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-gray-50">
              <ImageIcon className="mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-600">Failed to load image</p>
            </div>
          )}
        </div>
      )
    }

    // PDF preview
    if (file.mime_type === 'application/pdf') {
      return (
        <div className="h-96">
          <iframe
            src={`${file.file_url}#toolbar=0`}
            className="h-full w-full rounded-lg border"
            title={file.name}
          />
        </div>
      )
    }

    // Video preview
    if (file.mime_type.startsWith('video/')) {
      return (
        <video
          controls
          className="mx-auto max-h-96 max-w-full rounded-lg"
          preload="metadata"
        >
          <source src={file.file_url} type={file.mime_type} />
          Your browser does not support the video tag.
        </video>
      )
    }

    // Audio preview
    if (file.mime_type.startsWith('audio/')) {
      return (
        <div className="flex h-32 flex-col items-center justify-center rounded-lg bg-gray-50">
          <Music className="mb-4 h-12 w-12 text-gray-400" />
          <audio controls className="w-full max-w-md">
            <source src={file.file_url} type={file.mime_type} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    // Text preview
    if (file.mime_type.startsWith('text/')) {
      return (
        <div className="h-64 overflow-auto">
          <iframe
            src={file.file_url}
            className="h-full w-full rounded-lg border"
            title={file.name}
          />
        </div>
      )
    }

    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-gray-50">
        <FileText className="mb-4 h-16 w-16 text-gray-400" />
        <p className="text-gray-600">Preview not supported</p>
      </div>
    )
  }

  const getFileIcon = () => {
    if (file.mime_type.startsWith('image/'))
      return <ImageIcon className="h-5 w-5" />
    if (file.mime_type === 'application/pdf')
      return <FileText className="h-5 w-5" />
    if (file.mime_type.startsWith('video/'))
      return <Video className="h-5 w-5" />
    if (file.mime_type.startsWith('audio/'))
      return <Music className="h-5 w-5" />
    if (file.mime_type.includes('zip') || file.mime_type.includes('rar'))
      return <Archive className="h-5 w-5" />
    return <FileIcon className="h-5 w-5" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon()}
              <div>
                <DialogTitle className="text-left">{file.name}</DialogTitle>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.file_size)} • {file.mime_type}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.file_url, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Preview */}
          <div className="rounded-lg border p-4">{renderPreview()}</div>

          {/* File Details */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-medium">File Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Original Name:</span>
                  <span>{file.original_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Size:</span>
                  <span>{formatFileSize(file.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span>{file.file_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">MIME Type:</span>
                  <span className="font-mono text-xs">{file.mime_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uploaded:</span>
                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Downloads:</span>
                  <span>{file.download_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Visibility:</span>
                  <Badge variant={file.is_public ? 'default' : 'secondary'}>
                    {file.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-medium">Details</h3>
              <div className="space-y-3">
                {file.description && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Description:</p>
                    <p className="text-sm">{file.description}</p>
                  </div>
                )}

                {file.tags.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm text-gray-500">Tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {file.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {file.folder && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Folder:</p>
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: file.folder.color }}
                      />
                      <span className="text-sm">{file.folder.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
