'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { useDesktopFileHandling } from '@/hooks/use-desktop-file-handling'
import { useDesktopIntegration } from '@/hooks/use-desktop-integration'
import {
    CheckCircle,
    Download,
    ExternalLink,
    FileText,
    Share,
    Upload
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface StudyFileData {
  version: string
  type: 'study-session' | 'note' | 'task-list' | 'resource-collection'
  title: string
  description: string
  content: any
  metadata: {
    createdAt: string
    updatedAt: string
    author: string
    tags: string[]
    studyGroupId?: string
    isPublic: boolean
  }
  resources: Array<{
    id: string
    name: string
    type: string
    url?: string
    localPath?: string
  }>
}

interface DeepLinkData {
  protocol: string
  hostname: string
  pathname: string
  search: string
  hash: string
}

export function StudyFileHandler() {
  const [isOpen, setIsOpen] = useState(false)
  const [studyFileData, setStudyFileData] = useState<StudyFileData | null>(null)
  const [deepLinkData, setDeepLinkData] = useState<DeepLinkData | null>(null)
  const [isAssociationsRegistered, setIsAssociationsRegistered] = useState(false)
  const [newStudyFile, setNewStudyFile] = useState<Partial<StudyFileData>>({
    version: '1.0',
    type: 'study-session',
    title: '',
    description: '',
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: '',
      tags: [],
      isPublic: false
    },
    resources: []
  })

  const router = useRouter()
  const { isElectron } = useDesktopIntegration()
  const { 
    saveFile, 
    openFilePicker, 
    registerFileAssociations,
    getCachedFile,
    cacheFile
  } = useDesktopFileHandling()

  // Register file associations on mount
  useEffect(() => {
    const initializeFileAssociations = async () => {
      if (!isElectron) return

      try {
        const success = await registerFileAssociations()
        setIsAssociationsRegistered(success)
      } catch (error) {
        console.error('Failed to register file associations:', error)
      }
    }

    if (isElectron) {
      initializeFileAssociations()
    }
  }, [isElectron, registerFileAssociations])

  // Listen for deep link events
  useEffect(() => {
    if (!isElectron || !window.desktopAPI) return

    const handleDeepLink = (linkData: DeepLinkData) => {
      setDeepLinkData(linkData)
      handleDeepLinkNavigation(linkData)
    }

    window.desktopAPI.onDeepLink(handleDeepLink)

    return () => {
      if (window.desktopAPI) {
        window.desktopAPI.removeAllListeners()
      }
    }
  }, [isElectron])

  const handleDeepLinkNavigation = useCallback((linkData: DeepLinkData) => {
    try {
      // Parse StudyCollab deep links
      // Format: studycollab://action/resource?params
      const action = linkData.hostname
      const resource = linkData.pathname.substring(1) // Remove leading slash
      const params = new URLSearchParams(linkData.search)

      switch (action) {
        case 'open-study-file':
          const filePath = params.get('path')
          if (filePath) {
            openStudyFile(filePath)
          }
          break
        
        case 'join-group':
          const groupId = resource
          if (groupId) {
            router.push(`/groups/${groupId}`)
            toast({
              title: 'Joining Study Group',
              description: `Opening study group: ${groupId}`
            })
          }
          break
        
        case 'open-note':
          const noteId = resource
          if (noteId) {
            router.push(`/notes/${noteId}`)
          }
          break
        
        case 'open-task':
          const taskId = resource
          if (taskId) {
            router.push(`/tasks/${taskId}`)
          }
          break
        
        default:
          console.warn('Unknown deep link action:', action)
          toast({
            title: 'Unknown Link',
            description: 'This link type is not supported',
            variant: 'destructive'
          })
      }
    } catch (error) {
      console.error('Deep link navigation error:', error)
      toast({
        title: 'Navigation Error',
        description: 'Failed to handle the link',
        variant: 'destructive'
      })
    }
  }, [router])

  const openStudyFile = useCallback(async (filePath?: string) => {
    if (!isElectron) return

    try {
      let targetPath = filePath

      if (!targetPath) {
        const result = await openFilePicker({
          title: 'Open Study File',
          accept: ['.study']
        })

        if (result.length === 0) return
        targetPath = result[0]
      }

      // Try to get from cache first
      const cachedContent = await getCachedFile(targetPath)
      let content = cachedContent

      if (!content && window.desktopAPI) {
        // Read from file system
        const response = await window.desktopAPI.readFile(targetPath)
        if (response.success && response.data) {
          content = response.data
          // Cache for future use
          await cacheFile(targetPath, content)
        }
      }

      if (content) {
        const studyData: StudyFileData = JSON.parse(content)
        setStudyFileData(studyData)
        setIsOpen(true)

        toast({
          title: 'Study File Opened',
          description: `Loaded: ${studyData.title}`
        })
      } else {
        throw new Error('Failed to read study file')
      }
    } catch (error) {
      console.error('Open study file error:', error)
      toast({
        title: 'Error',
        description: 'Failed to open study file',
        variant: 'destructive'
      })
    }
  }, [isElectron, openFilePicker, getCachedFile, cacheFile])

  const createStudyFile = useCallback(async () => {
    if (!isElectron || !newStudyFile.title) return

    try {
      const studyData: StudyFileData = {
        version: '1.0',
        type: newStudyFile.type || 'study-session',
        title: newStudyFile.title,
        description: newStudyFile.description || '',
        content: {
          // This would contain the actual study content
          // For demo purposes, we'll use a simple structure
          sections: [],
          notes: [],
          tasks: [],
          resources: []
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: newStudyFile.metadata?.author || 'Unknown',
          tags: newStudyFile.metadata?.tags || [],
          isPublic: newStudyFile.metadata?.isPublic || false
        },
        resources: newStudyFile.resources || []
      }

      const success = await saveFile({
        content: JSON.stringify(studyData, null, 2),
        defaultName: `${studyData.title.replace(/[^a-zA-Z0-9]/g, '_')}.study`,
        title: 'Save Study File',
        filters: [
          { name: 'Study Files', extensions: ['study'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (success) {
        toast({
          title: 'Success',
          description: 'Study file created successfully'
        })
        
        // Reset form
        setNewStudyFile({
          version: '1.0',
          type: 'study-session',
          title: '',
          description: '',
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: '',
            tags: [],
            isPublic: false
          },
          resources: []
        })
      }
    } catch (error) {
      console.error('Create study file error:', error)
      toast({
        title: 'Error',
        description: 'Failed to create study file',
        variant: 'destructive'
      })
    }
  }, [isElectron, newStudyFile, saveFile])

  const generateShareLink = useCallback((studyData: StudyFileData) => {
    // Generate a shareable deep link
    const baseUrl = 'studycollab://open-study-file'
    const params = new URLSearchParams({
      title: studyData.title,
      type: studyData.type,
      author: studyData.metadata.author
    })
    
    return `${baseUrl}?${params.toString()}`
  }, [])

  const copyShareLink = useCallback(async (studyData: StudyFileData) => {
    const shareLink = generateShareLink(studyData)
    
    try {
      await navigator.clipboard.writeText(shareLink)
      toast({
        title: 'Link Copied',
        description: 'Share link copied to clipboard'
      })
    } catch (error) {
      console.error('Copy link error:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive'
      })
    }
  }, [generateShareLink])

  if (!isElectron) {
    return null
  }

  return (
    <>
      {/* Study File Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => openStudyFile()}
        >
          <FileText className="mr-2 h-4 w-4" />
          Open .study File
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Create Study File
        </Button>

        {isAssociationsRegistered && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            File Associations Active
          </Badge>
        )}
      </div>

      {/* Deep Link Indicator */}
      {deepLinkData && (
        <Card className="mt-4 border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Deep Link Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Action: {deepLinkData.hostname}
            </p>
            <p className="text-xs text-gray-500">
              {deepLinkData.protocol}//{deepLinkData.hostname}{deepLinkData.pathname}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Study File Viewer/Creator Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {studyFileData ? 'Study File Viewer' : 'Create Study File'}
            </DialogTitle>
            <DialogDescription>
              {studyFileData 
                ? 'View and manage study file content'
                : 'Create a new .study file with your content'
              }
            </DialogDescription>
          </DialogHeader>

          {studyFileData ? (
            /* Study File Viewer */
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-lg font-semibold">{studyFileData.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge variant="outline">{studyFileData.type}</Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">{studyFileData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Author</Label>
                  <p className="text-sm">{studyFileData.metadata.author}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">
                    {new Date(studyFileData.metadata.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {studyFileData.metadata.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {studyFileData.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {studyFileData.resources.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Resources</Label>
                  <div className="space-y-2 mt-2">
                    {studyFileData.resources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1">{resource.name}</span>
                        <Badge variant="outline">{resource.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyShareLink(studyFileData)}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share Link
                </Button>
                <Button onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            /* Study File Creator */
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newStudyFile.title || ''}
                    onChange={(e) => setNewStudyFile(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Enter study file title"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    className="w-full p-2 border rounded"
                    value={newStudyFile.type || 'study-session'}
                    onChange={(e) => setNewStudyFile(prev => ({
                      ...prev,
                      type: e.target.value as StudyFileData['type']
                    }))}
                  >
                    <option value="study-session">Study Session</option>
                    <option value="note">Note</option>
                    <option value="task-list">Task List</option>
                    <option value="resource-collection">Resource Collection</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newStudyFile.description || ''}
                  onChange={(e) => setNewStudyFile(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Describe your study file content"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={newStudyFile.metadata?.author || ''}
                  onChange={(e) => setNewStudyFile(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata!,
                      author: e.target.value
                    }
                  }))}
                  placeholder="Your name"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createStudyFile}
                  disabled={!newStudyFile.title}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Create & Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}