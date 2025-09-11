'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import {
    useCacheSize,
    useIsOfflineMode,
    useLastSyncTime,
    useOfflineActions,
    usePendingChanges
} from '@/stores/offline-store'
import {
    AlertTriangle,
    Database,
    HardDrive,
    RefreshCw,
    Trash2,
    Wifi
} from 'lucide-react'
import { useState } from 'react'

interface OfflineSettingsProps {
  className?: string
}

export function OfflineSettings({ className }: OfflineSettingsProps) {
  const isOfflineMode = useIsOfflineMode()
  const cacheSize = useCacheSize()
  const pendingChanges = usePendingChanges()
  const lastSyncTime = useLastSyncTime()
  const [loading, setLoading] = useState<string | null>(null)
  
  const {
    setOfflineMode,
    triggerSync,
    clearCache,
    getCacheStats,
    clearCacheType
  } = useOfflineActions()

  const handleToggleOfflineMode = async (enabled: boolean) => {
    setOfflineMode(enabled)
  }

  const handleSync = async () => {
    setLoading('sync')
    try {
      await triggerSync()
    } finally {
      setLoading(null)
    }
  }

  const handleClearCache = async () => {
    setLoading('clear')
    try {
      await clearCache()
    } finally {
      setLoading(null)
    }
  }

  const handleClearCacheType = async (type: string) => {
    setLoading(`clear-${type}`)
    try {
      await clearCacheType(type)
    } finally {
      setLoading(null)
    }
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const getCacheSizePercentage = () => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    return Math.min((cacheSize / maxSize) * 100, 100)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline & Sync Settings
          </CardTitle>
          <CardDescription>
            Manage offline capabilities and data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Offline Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Offline Mode</div>
              <div className="text-sm text-gray-600">
                Work offline and sync changes later
              </div>
            </div>
            <Switch
              checked={isOfflineMode}
              onCheckedChange={handleToggleOfflineMode}
            />
          </div>

          <Separator />

          {/* Sync Status */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync Status
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Last Sync</div>
                <div className="font-medium">
                  {formatLastSync(lastSyncTime)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Pending Changes</div>
                <div className="flex items-center gap-2">
                  <Badge variant={pendingChanges > 0 ? 'destructive' : 'secondary'}>
                    {pendingChanges}
                  </Badge>
                  {pendingChanges > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSync}
                      disabled={loading === 'sync'}
                      className="h-6 px-2 text-xs"
                    >
                      {loading === 'sync' ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        'Sync Now'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cache Management */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Cache Management
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Cache Size</div>
                <div className="font-medium">
                  {formatBytes(cacheSize)} / 50 MB
                </div>
              </div>
              
              <Progress value={getCacheSizePercentage()} className="h-2" />
              
              {getCacheSizePercentage() > 80 && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Cache is nearly full. Consider clearing some data.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearCacheType('tasks')}
                disabled={loading?.startsWith('clear')}
              >
                {loading === 'clear-tasks' ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Clear Tasks
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearCacheType('notes')}
                disabled={loading?.startsWith('clear')}
              >
                {loading === 'clear-notes' ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Clear Notes
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearCacheType('study-groups')}
                disabled={loading?.startsWith('clear')}
              >
                {loading === 'clear-study-groups' ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Clear Groups
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
                disabled={loading === 'clear'}
              >
                {loading === 'clear' ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Clear All
              </Button>
            </div>
          </div>

          <Separator />

          {/* Data Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Cached Data Types</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Tasks & Categories
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Notes & Folders
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                Study Groups
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                Resources & Files
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Wifi className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <div className="font-medium mb-1">How it works</div>
                <ul className="space-y-1 text-xs">
                  <li>• Data is automatically cached for offline access</li>
                  <li>• Changes sync automatically when online</li>
                  <li>• Sensitive data is encrypted in cache</li>
                  <li>• Cache is cleared on logout for security</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Utility function to format bytes (add to utils if not exists)
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}