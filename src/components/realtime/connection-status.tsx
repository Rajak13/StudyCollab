'use client'

import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRealtime } from '../../hooks/use-realtime'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

interface ConnectionStatusProps {
  className?: string
  showDetails?: boolean
  showReconnectButton?: boolean
}

export function ConnectionStatusIndicator({ 
  className, 
  showDetails = false,
  showReconnectButton = true 
}: ConnectionStatusProps) {
  const { isConnected, connectionStatus, connect } = useRealtime({ autoConnect: true })
  const [isReconnecting, setIsReconnecting] = useState(false)

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return `Reconnecting... (${connectionStatus.reconnectAttempts || 0})`
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection Error'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'text-green-600'
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-600'
      case 'disconnected':
        return 'text-gray-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleReconnect = async () => {
    setIsReconnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error('Manual reconnect failed:', error)
    } finally {
      setIsReconnecting(false)
    }
  }

  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {getStatusIcon()}
        <span className={cn('text-sm font-medium', getStatusColor())}>
          {getStatusText()}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={cn('text-sm font-medium', getStatusColor())}>
            {getStatusText()}
          </span>
        </div>
        
        {showReconnectButton && !isConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            disabled={isReconnecting || connectionStatus.status === 'connecting'}
            className="h-8"
          >
            {isReconnecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span className="ml-1">Reconnect</span>
          </Button>
        )}
      </div>

      {connectionStatus.error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {connectionStatus.error}
        </div>
      )}

      {connectionStatus.lastConnected && (
        <div className="text-xs text-gray-500">
          Last connected: {connectionStatus.lastConnected.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// Compact version for header/status bar
export function ConnectionStatusBadge({ className }: { className?: string }) {
  const { isConnected, connectionStatus } = useRealtime({ autoConnect: true })

  const getBadgeColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
      getBadgeColor(),
      className
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        isConnected ? 'bg-green-500' : 'bg-gray-400'
      )} />
      {connectionStatus.status === 'reconnecting' && connectionStatus.reconnectAttempts
        ? `Reconnecting (${connectionStatus.reconnectAttempts})`
        : connectionStatus.status.charAt(0).toUpperCase() + connectionStatus.status.slice(1)
      }
    </div>
  )
}

// Hook for connection status notifications
export function useConnectionNotifications() {
  const { connectionStatus } = useRealtime()
  const [lastStatus, setLastStatus] = useState<string>('')

  useEffect(() => {
    if (connectionStatus.status !== lastStatus) {
      // You can integrate with your notification system here
      switch (connectionStatus.status) {
        case 'connected':
          if (lastStatus === 'reconnecting' || lastStatus === 'disconnected') {
            console.log('✅ Reconnected to real-time server')
          }
          break
        case 'disconnected':
          console.log('⚠️ Lost connection to real-time server')
          break
        case 'error':
          console.error('❌ Real-time connection error:', connectionStatus.error)
          break
      }
      setLastStatus(connectionStatus.status)
    }
  }, [connectionStatus.status, connectionStatus.error, lastStatus])
}