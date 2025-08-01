'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useUploadFile } from '@/hooks/use-files'
import {
  formatFileSize,
  getFileIcon,
  getFileType,
  validateFile,
} from '@/lib/file-upload'
import { AlertCircle, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface FileUploadProps {
  folderId?: string
  onUploadComplete?: () => void
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  metadata: {
    name: string
    description: string
    tags: string[]
    is_public: boolean
  }
}

export function FileUpload({ folderId, onUploadComplete }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadFile()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles: UploadingFile[] = []

    files.forEach((file) => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push({
          file,
          progress: 0,
          metadata: {
            name: file.name.split('.')[0],
            description: '',
            tags: [],
            is_public: false,
          },
        })
      } else {
        validFiles.push({
          file,
          progress: 0,
          error: validation.error,
          metadata: {
            name: file.name.split('.')[0],
            description: '',
            tags: [],
            is_public: false,
          },
        })
      }
    })

    setUploadingFiles((prev) => [...prev, ...validFiles])
  }

  const updateFileMetadata = (
    index: number,
    field: string,
    value: string | boolean | string[]
  ) => {
    setUploadingFiles((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, metadata: { ...item.metadata, [field]: value } }
          : item
      )
    )
  }

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const addTag = (index: number, tag: string) => {
    if (!tag.trim()) return

    setUploadingFiles((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              metadata: {
                ...item.metadata,
                tags: [...item.metadata.tags, tag.trim()],
              },
            }
          : item
      )
    )
  }

  const removeTag = (index: number, tagIndex: number) => {
    setUploadingFiles((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              metadata: {
                ...item.metadata,
                tags: item.metadata.tags.filter((_, ti) => ti !== tagIndex),
              },
            }
          : item
      )
    )
  }

  const uploadFiles = async () => {
    const validFiles = uploadingFiles.filter((item) => !item.error)

    for (let i = 0; i < validFiles.length; i++) {
      const item = validFiles[i]

      try {
        await uploadMutation.mutateAsync({
          file: item.file,
          metadata: {
            ...item.metadata,
            file_type: getFileType(item.file.type, item.file.name),
            folder_id: folderId,
          },
        })

        // Mark as completed
        setUploadingFiles((prev) =>
          prev.map((uploadItem) =>
            uploadItem.file === item.file
              ? { ...uploadItem, progress: 100 }
              : uploadItem
          )
        )
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((uploadItem) =>
            uploadItem.file === item.file
              ? {
                  ...uploadItem,
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                }
              : uploadItem
          )
        )
      }
    }

    // Clean up completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles((prev) =>
        prev.filter((item) => item.progress < 100 && !item.error)
      )
      if (uploadingFiles.every((item) => item.progress === 100 || item.error)) {
        setIsOpen(false)
        onUploadComplete?.()
      }
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Drag and drop files here or click to browse. Maximum file size is
            100MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-lg font-medium">
              Drop files here or click to browse
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Supports PDF, images, documents, videos, and more (max 100MB each)
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              title="Choose files to upload"
            />
          </div>

          {/* File List */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Files to Upload</h3>
              {uploadingFiles.map((item, index) => (
                <Card
                  key={index}
                  className={item.error ? 'border-red-200' : ''}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getFileIcon(getFileType(item.file.type))}
                        </div>
                        <div>
                          <p className="font-medium">{item.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(item.file.size)} • {item.file.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {item.error && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{item.error}</span>
                      </div>
                    )}

                    {item.progress > 0 && (
                      <div className="space-y-2">
                        <Progress value={item.progress} />
                        <p className="text-sm text-gray-500">
                          {item.progress}% uploaded
                        </p>
                      </div>
                    )}
                  </CardHeader>

                  {!item.error && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`name-${index}`}>File Name</Label>
                          <Input
                            id={`name-${index}`}
                            value={item.metadata.name}
                            onChange={(e) =>
                              updateFileMetadata(index, 'name', e.target.value)
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={item.metadata.is_public}
                            onCheckedChange={(checked) =>
                              updateFileMetadata(index, 'is_public', checked)
                            }
                          />
                          <Label>Make Public</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`description-${index}`}>
                          Description
                        </Label>
                        <Textarea
                          id={`description-${index}`}
                          value={item.metadata.description}
                          onChange={(e) =>
                            updateFileMetadata(
                              index,
                              'description',
                              e.target.value
                            )
                          }
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Tags</Label>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {item.metadata.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary">
                              {tag}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-1 h-auto p-0"
                                onClick={() => removeTag(index, tagIndex)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <Input
                          placeholder="Add tag and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addTag(index, e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setUploadingFiles([])}>
                  Clear All
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={
                    uploadingFiles.every((item) => item.error) ||
                    uploadMutation.isPending
                  }
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
