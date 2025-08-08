import { io, Socket } from 'socket.io-client'
import { createClient } from '../supabase'

export interface SocketUser {
  id: string
  email: string
  name: string
}

export interface UserPresence {
  userId: string
  groupId?: string
  cursor?: { x: number; y: number }
  isActive: boolean
  currentTool?: string
  lastSeen: Date
}

export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'
  error?: string
  lastConnected?: Date
  reconnectAttempts?: number
}

export type SocketEventHandler = (data: any) => void

export class RealtimeClient {
  private socket: Socket | null = null
  private connectionStatus: ConnectionStatus = { status: 'disconnected' }
  private eventHandlers = new Map<string, Set<SocketEventHandler>>()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second
  private maxReconnectDelay = 30000 // Max 30 seconds
  private currentGroupId: string | null = null

  constructor() {
    this.setupEventListeners()
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return
    }

    try {
      this.updateConnectionStatus({ status: 'connecting' })

      // Get authentication token
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        throw new Error('No valid session found')
      }

      // Create socket connection
      this.socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        auth: {
          token: session.access_token,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      })

      this.setupSocketEventHandlers()
      
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'))
          return
        }

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.socket.on('connect', () => {
          clearTimeout(timeout)
          this.onConnected()
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout)
          this.onConnectionError(error)
          reject(error)
        })
      })
    } catch (error) {
      this.onConnectionError(error as Error)
      throw error
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.updateConnectionStatus({ status: 'disconnected' })
    this.reconnectAttempts = 0
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.onConnected()
    })

    this.socket.on('disconnect', (reason) => {
      this.onDisconnected(reason)
    })

    this.socket.on('connect_error', (error) => {
      this.onConnectionError(error)
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`)
      this.reconnectAttempts = 0
      this.onConnected()
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`)
      this.updateConnectionStatus({ 
        status: 'reconnecting', 
        reconnectAttempts: attemptNumber 
      })
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed after maximum attempts')
      this.updateConnectionStatus({ 
        status: 'error', 
        error: 'Failed to reconnect after maximum attempts' 
      })
    })

    // Heartbeat response
    this.socket.on('heartbeat:ack', () => {
      // Heartbeat acknowledged
    })

    // Forward all other events to registered handlers
    this.socket.onAny((eventName, data) => {
      this.emitToHandlers(eventName, data)
    })
  }

  private onConnected(): void {
    console.log('Socket connected')
    this.updateConnectionStatus({ 
      status: 'connected', 
      lastConnected: new Date(),
      reconnectAttempts: 0 
    })
    this.reconnectAttempts = 0
    this.reconnectDelay = 1000 // Reset delay
    this.startHeartbeat()

    // Rejoin group if we were in one
    if (this.currentGroupId) {
      this.joinGroup(this.currentGroupId)
    }

    this.emitToHandlers('connection:established', {})
  }

  private onDisconnected(reason: string): void {
    console.log('Socket disconnected:', reason)
    this.updateConnectionStatus({ status: 'disconnected' })
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    this.emitToHandlers('connection:lost', { reason })

    // Attempt reconnection for certain disconnect reasons
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, don't reconnect automatically
      return
    }

    this.attemptReconnection()
  }

  private onConnectionError(error: Error): void {
    console.error('Socket connection error:', error)
    this.updateConnectionStatus({ 
      status: 'error', 
      error: error.message 
    })
    this.emitToHandlers('connection:error', { error: error.message })
  }

  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached')
      this.updateConnectionStatus({ 
        status: 'error', 
        error: 'Maximum reconnection attempts reached' 
      })
      return
    }

    this.reconnectAttempts++
    this.updateConnectionStatus({ 
      status: 'reconnecting', 
      reconnectAttempts: this.reconnectAttempts 
    })

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection attempt failed:', error)
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
        this.attemptReconnection()
      }
    }, this.reconnectDelay)
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat')
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...status }
    this.emitToHandlers('connection:status', this.connectionStatus)
  }

  private setupEventListeners(): void {
    // Listen for auth state changes to reconnect with new token
    const supabase = createClient()
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        this.disconnect()
      } else if (event === 'SIGNED_IN' && session) {
        // Reconnect with new token
        if (this.socket?.connected) {
          this.disconnect()
        }
        try {
          await this.connect()
        } catch (error) {
          console.error('Failed to reconnect after auth change:', error)
        }
      }
    })
  }

  // Event handling methods
  on(event: string, handler: SocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: SocketEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }
  }

  private emitToHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  // Presence methods
  updatePresence(presence: Partial<UserPresence>): void {
    if (this.socket?.connected) {
      this.socket.emit('presence:update', presence)
    }
  }

  updateCursor(groupId: string, cursor: { x: number; y: number }): void {
    if (this.socket?.connected) {
      this.socket.emit('cursor:update', { groupId, cursor })
    }
  }

  changeTool(groupId: string, tool: string): void {
    if (this.socket?.connected) {
      this.socket.emit('tool:change', { groupId, tool })
    }
  }

  // Group methods
  joinGroup(groupId: string): void {
    if (this.socket?.connected) {
      this.currentGroupId = groupId
      this.socket.emit('group:join', groupId)
    }
  }

  leaveGroup(groupId: string): void {
    if (this.socket?.connected) {
      this.currentGroupId = null
      this.socket.emit('group:leave', groupId)
    }
  }

  // Utility methods
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getCurrentGroupId(): string | null {
    return this.currentGroupId
  }
}

// Singleton instance
let realtimeClient: RealtimeClient | null = null

export function getRealtimeClient(): RealtimeClient {
  if (!realtimeClient) {
    realtimeClient = new RealtimeClient()
  }
  return realtimeClient
}

export function initializeRealtimeClient(): RealtimeClient {
  return getRealtimeClient()
}