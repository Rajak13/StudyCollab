'use client'

import { ConnectionStatus, getRealtimeClient, UserPresence } from '@/lib/realtime'
import { useCallback, useEffect, useState } from 'react'

export interface UseRealtimeOptions {
  groupId?: string
  autoConnect?: boolean
}

export interface UseRealtimeReturn {
  isConnected: boolean
  connectionStatus: ConnectionStatus
  connect: () => Promise<void>
  disconnect: () => void
  joinGroup: (groupId: string) => void
  leaveGroup: (groupId: string) => void
  updatePresence: (presence: Partial<UserPresence>) => void
  updateCursor: (groupId: string, cursor: { x: number; y: number }) => void
  changeTool: (groupId: string, tool: string) => void
  emit: (event: string, data: any) => void
  on: (event: string, handler: (data: any) => void) => void
  off: (event: string, handler: (data: any) => void) => void
  currentGroupId: string | null
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const { groupId, autoConnect = true } = options
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'disconnected' })
  const [realtimeClient] = useState(() => getRealtimeClient())

  // Update connection status when it changes
  useEffect(() => {
    const handleConnectionStatus = (status: ConnectionStatus) => {
      setConnectionStatus(status)
    }

    realtimeClient.on('connection:status', handleConnectionStatus)

    return () => {
      realtimeClient.off('connection:status', handleConnectionStatus)
    }
  }, [realtimeClient])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && !realtimeClient.isConnected()) {
      realtimeClient.connect().catch(error => {
        console.error('Failed to auto-connect realtime client:', error)
      })
    }
  }, [realtimeClient, autoConnect])

  // Auto-join group if provided
  useEffect(() => {
    if (groupId && realtimeClient.isConnected()) {
      realtimeClient.joinGroup(groupId)

      return () => {
        realtimeClient.leaveGroup(groupId)
      }
    }
  }, [realtimeClient, groupId])

  const connect = useCallback(async () => {
    try {
      await realtimeClient.connect()
    } catch (error) {
      console.error('Failed to connect realtime client:', error)
      throw error
    }
  }, [realtimeClient])

  const disconnect = useCallback(() => {
    realtimeClient.disconnect()
  }, [realtimeClient])

  const joinGroup = useCallback((groupId: string) => {
    realtimeClient.joinGroup(groupId)
  }, [realtimeClient])

  const leaveGroup = useCallback((groupId: string) => {
    realtimeClient.leaveGroup(groupId)
  }, [realtimeClient])

  const updatePresence = useCallback((presence: Partial<UserPresence>) => {
    realtimeClient.updatePresence(presence)
  }, [realtimeClient])

  const updateCursor = useCallback((groupId: string, cursor: { x: number; y: number }) => {
    realtimeClient.updateCursor(groupId, cursor)
  }, [realtimeClient])

  const changeTool = useCallback((groupId: string, tool: string) => {
    realtimeClient.changeTool(groupId, tool)
  }, [realtimeClient])

  const emit = useCallback((event: string, data: any) => {
    realtimeClient.emit(event, data)
  }, [realtimeClient])

  const on = useCallback((event: string, handler: (data: any) => void) => {
    realtimeClient.on(event, handler)
  }, [realtimeClient])

  const off = useCallback((event: string, handler: (data: any) => void) => {
    realtimeClient.off(event, handler)
  }, [realtimeClient])

  const getCurrentGroupId = useCallback(() => {
    return realtimeClient.getCurrentGroupId()
  }, [realtimeClient])

  return {
    isConnected: connectionStatus.status === 'connected',
    connectionStatus,
    connect,
    disconnect,
    joinGroup,
    leaveGroup,
    updatePresence,
    updateCursor,
    changeTool,
    emit,
    on,
    off,
    currentGroupId: getCurrentGroupId(),
  }
}

export function usePresence(groupId?: string) {
  const [presence, setPresence] = useState<Map<string, UserPresence & { user: any }>>(new Map())
  const { on, off, isConnected } = useRealtime({ groupId })

  useEffect(() => {
    const handleUserJoined = (data: { userId: string; user: any; presence: UserPresence }) => {
      setPresence(prev => new Map(prev.set(data.userId, { ...data.presence, user: data.user })))
    }

    const handleUserLeft = (data: { userId: string }) => {
      setPresence(prev => {
        const newPresence = new Map(prev)
        newPresence.delete(data.userId)
        return newPresence
      })
    }

    const handlePresenceUpdated = (data: UserPresence & { user?: any }) => {
      setPresence(prev => {
        const existing = prev.get(data.userId)
        const updated = { ...data, user: data.user || existing?.user }
        return new Map(prev.set(data.userId, updated))
      })
    }

    const handleGroupPresence = (members: Array<{ userId: string; user: any; presence: UserPresence }>) => {
      const newPresence = new Map<string, UserPresence & { user: any }>()
      members.forEach(member => {
        newPresence.set(member.userId, { ...member.presence, user: member.user })
      })
      setPresence(newPresence)
    }

    if (isConnected) {
      on('user:joined', handleUserJoined)
      on('user:left', handleUserLeft)
      on('presence:updated', handlePresenceUpdated)
      on('group:presence', handleGroupPresence)
    }

    return () => {
      off('user:joined', handleUserJoined)
      off('user:left', handleUserLeft)
      off('presence:updated', handlePresenceUpdated)
      off('group:presence', handleGroupPresence)
    }
  }, [on, off, isConnected])

  return {
    presence,
    isConnected,
    userCount: presence.size,
    isActive: isConnected,
    groupMembers: Array.from(presence.values()),
    userCursors: presence,
  }
}

export function useGroupRealtime(groupId: string) {
  const realtime = useRealtime({ groupId })
  const presence = usePresence(groupId)

  return {
    ...realtime,
    ...presence,
  }
}