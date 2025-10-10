'use client'

import { cn } from '@/lib/utils'
import { useIsOnline, useOfflineStore, usePendingChanges, useSyncInProgress } from '@/stores/offline-store'
import { CheckCircle, Cloud, CloudOff, Loader2, WifiOff } from 'lucide-react'
import { useState } from 'react'

interface OfflineIndicatorProps {
  className?: string
  showDetails?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function OfflineIndicator({ 
  className, 
  showDetails = false,
  position = 'top-right'
}: OfflineIndicatorProps) {
  const isOnline = useIsOnline()
  const syncInProgress = useSyncInProgress()
  const pendingChanges = usePendingChanges()
  const [showTooltip, setShowTooltip] = useState(false)

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        message: 'Offline',
        description: 'Working offline. Changes will sync when connection is restored.'
      }
    }

    if (syncInProgress) {
      return {
        icon: Loader2,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200',
        message: 'Syncing',
        description: 'Synchronizing your data...',
        animate: true
      }
    }

    if (pendingChanges > 0) {
      return {
        icon: CloudOff,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 border-orange-200',
        message: `${pendingChanges} pending`,
        description: `${pendingChanges} changes waiting to sync`
      }
    }

    return {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 border-green-200',
      message: 'Online',
      description: 'All changes synced'
    }
  }

  const status = getStatusInfo()
  const Icon = status.icon

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  if (!showDetails) {
    return (
      <div 
        className={cn(
          'fixed z-50 flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm',
          status.bgColor,
          positionClasses[position],
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon 
          className={cn(
            'h-4 w-4',
            status.color,
            status.animate && 'animate-spin'
          )} 
        />
        <span className={cn('text-sm font-medium', status.color)}>
          {status.message}
        </span>
        
        {showTooltip && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
            {status.description}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg border',
      status.bgColor,
      className
    )}>
      <Icon 
        className={cn(
          'h-5 w-5',
          status.color,
          status.animate && 'animate-spin'
        )} 
      />
      <div className="flex-1">
        <div className={cn('font-medium', status.color)}>
          {status.message}
        </div>
        <div className="text-sm text-gray-600">
          {status.description}
        </div>
      </div>
    </div>
  )
}

export function OfflineStatusBar() {
  const isOnline = useIsOnline()
  const syncInProgress = useSyncInProgress()
  const pendingChanges = usePendingChanges()
  const { triggerSync } = useOfflineStore()

  if (isOnline && !syncInProgress && pendingChanges === 0) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                You're offline. Changes will sync when connection is restored.
              </span>
            </>
          ) : syncInProgress ? (
            <>
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-blue-700">
                Syncing your changes...
              </span>
            </>
          ) : pendingChanges > 0 ? (
            <>
              <Cloud className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                {pendingChanges} changes waiting to sync
              </span>
            </>
          ) : null}
        </div>

        {isOnline && pendingChanges > 0 && !syncInProgress && (
          <button
            onClick={() => triggerSync()}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
          >
            Sync now
          </button>
        )}
      </div>
    </div>
  )
}