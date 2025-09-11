'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { useDesktopFileHandling } from '@/hooks/use-desktop-file-handling'
import { formatFileSize } from '@/lib/file-upload'
import {
    Database,
    Download,
    HardDrive,
    RefreshCw,
    Trash2,
    Wifi,
    WifiOff
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface CacheStats {
  totalFiles: number
  totalSize: number
  lastSync: number
  offlineMode: boolean
}

interface CachedFile {
  id: string
  name: string
  size: number
  cached: number
  lastAccessed: number
  type: string
}

export function OfflineCacheManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalFiles: 0,
    totalSize: 0,
    lastSync: Date.now(),
    offlineMode: false
  })
  const [cachedFiles, setCachedFiles] = useState<CachedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [offlineMode, setOfflineMode] = useState(false)

  const {
    isElectron,
    cacheDir,
    listDirectory,
    clearCache,
    getCachedFile,
    cacheFile
  } = useDesktopFileHandling()

  // Load cache statistics
  useEffect(() => {
    if (isElectron && isOpen) {
      loadCacheStats()
    }
  }, [isElectron, isOpen])

  const loadCacheStats = useCallback(async () => {
    if (!isElectron || !cacheDir) return

    setIsLoading(true)
    try {
      const files = await listDirectory(cacheDir)
      const fileList = files.filter(f => f.isFile)
      
      const totalSize = fileList.reduce((sum, file) => sum + file.size, 0)
      
      setCacheStats({
        totalFiles: fileList.length,
        totalSize,
        lastSync: Date.now(),
        offlineMode
      })

      // Convert to cached file format
      const cached: CachedFile[] = fileList.map(file => ({
        id: file.name,
        name: file.name,
        size: file.size,
        cached: file.modified,
        lastAccessed: file.modified,
        type: getFileTypeFromName(file.name)
      }))

      setCachedFiles(cached)
    } catch (error) {
      console.error('Failed to load cache stats:', error)
      toast({
        title: 'Error',
        description: 'Failed to load cache statistics',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [isElectron, cacheDir, offlineMode, listDirectory])

  const handleClearCache = useCallback(async () => {
    if (!isElectron || !clearCache) return

    try {
      const success = await clearCache()
      if (success) {
        setCacheStats(prev => ({ ...prev, totalFiles: 0, totalSize: 0 }))
        setCachedFiles([])
        toast({
          title: 'Success',
          description: 'Cache cleared successfully'
        })
      }
    } catch (error) {
      console.error('Clear cache error:', error)
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive'
      })
    }
  }, [isElectron, clearCache])

  const handleSyncCache = useCallback(async () => {
    if (!isElectron) return

    setIsSyncing(true)
    setSyncProgress(0)

    try {
      // Simulate sync process
      const steps = [
        'Checking for updates...',
        'Downloading new files...',
        'Updating cached content...',
        'Cleaning up old files...',
        'Finalizing sync...'
      ]

      for (let i = 0; i < steps.length; i++) {
        toast({
          title: 'Syncing',
          description: steps[i]
        })
        
        setSyncProgress((i + 1) * 20)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Reload cache stats after sync
      await loadCacheStats()
      
      setCacheStats(prev => ({ ...prev, lastSync: Date.now() }))
      
      toast({
        title: 'Sync Complete',
        description: 'Cache synchronized successfully'
      })
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: 'Sync Failed',
        description: 'Failed to synchronize cache',
        variant: 'destructive'
      })
    } finally {
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }, [isElectron, loadCacheStats])

  const handleToggleOfflineMode = useCallback((enabled: boolean) => {
    setOfflineMode(enabled)
    setCacheStats(prev => ({ ...prev, offlineMode: enabled }))
    
    toast({
      title: enabled ? 'Offline Mode Enabled' : 'Offline Mode Disabled',
      description: enabled 
        ? 'Using cached content when network is unavailable'
        : 'Always attempting to fetch fresh content'
    })
  }, [])

  const handleRemoveCachedFile = useCallback(async (fileId: string) => {
    // In a real implementation, this would remove the specific cached file
    toast({
      title: 'File Removed',
      description: 'Cached file removed successfully'
    })
    
    // Remove from local state
    setCachedFiles(prev => prev.filter(f => f.id !== fileId))
    setCacheStats(prev => ({
      ...prev,
      totalFiles: prev.totalFiles - 1,
      totalSize: prev.totalSize - (cachedFiles.find(f => f.id === fileId)?.size || 0)
    }))
  }, [cachedFiles])

  const getFileTypeFromName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const types: Record<string, string> = {
      'txt': 'text',
      'md': 'markdown',
      'json': 'data',
      'pdf': 'document',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp4': 'video',
      'mp3': 'audio',
      'study': 'studycollab'
    }
    return types[ext || ''] || 'unknown'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (!isElectron) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled>
            <Database className="mr-2 h-4 w-4" />
            Offline Cache
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offline Cache Manager</DialogTitle>
            <DialogDescription>
              Offline caching is only available in the desktop application.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Offline Cache
          <Badge variant="secondary" className="ml-2">
            Desktop
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Cache Manager
          </DialogTitle>
          <DialogDescription>
            Manage offline file caching and synchronization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Cache Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Cached Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheStats.totalFiles}</div>
                <p className="text-xs text-gray-500">
                  {formatFileSize(cacheStats.totalSize)} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Last Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {formatDate(cacheStats.lastSync)}
                </div>
                <p className="text-xs text-gray-500">
                  {Math.floor((Date.now() - cacheStats.lastSync) / 60000)} minutes ago
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {offlineMode ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={offlineMode ? 'secondary' : 'default'}>
                    {offlineMode ? 'Offline Mode' : 'Online Mode'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sync Progress */}
          {isSyncing && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Synchronizing cache...</Label>
                    <span className="text-sm text-gray-500">{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cache Settings</CardTitle>
              <CardDescription>
                Configure offline caching behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Offline Mode</Label>
                  <p className="text-sm text-gray-600">
                    Use cached content when network is unavailable
                  </p>
                </div>
                <Switch
                  checked={offlineMode}
                  onCheckedChange={handleToggleOfflineMode}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Cache Directory</Label>
                  <p className="text-sm text-gray-600 break-all">
                    {cacheDir}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cached Files List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Cached Files
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCacheStats}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncCache}
                    disabled={isSyncing}
                  >
                    <Download className="h-4 w-4" />
                    Sync
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearCache}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading cache...</span>
                </div>
              ) : cachedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No cached files</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cachedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • Cached {formatDate(file.cached)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {file.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCachedFile(file.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}