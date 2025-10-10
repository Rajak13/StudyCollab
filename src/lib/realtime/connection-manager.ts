export interface ConnectionConfig {
  maxReconnectAttempts: number
  reconnectDelay: number
  maxReconnectDelay: number
  heartbeatInterval: number
  connectionTimeout: number
}

export interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  reconnectAttempts: number
  lastError?: string
  lastConnected?: Date
}

export class ConnectionManager {
  private config: ConnectionConfig
  private state: ConnectionState
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private connectionTimeout: NodeJS.Timeout | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = {
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...config,
    }

    this.state = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    }
  }

  // Event handling
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in connection manager listener for ${event}:`, error)
        }
      })
    }
  }

  // Connection state management
  async connect(connectFn: () => Promise<void>): Promise<void> {
    if (this.state.isConnected || this.state.isConnecting) {
      return
    }

    this.state.isConnecting = true
    this.emit('connecting')

    try {
      // Set connection timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        this.connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, this.config.connectionTimeout)
      })

      // Race between connection and timeout
      await Promise.race([connectFn(), timeoutPromise])

      // Clear timeout if connection succeeded
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout)
        this.connectionTimeout = null
      }

      this.onConnected()
    } catch (error) {
      this.onConnectionError(error as Error)
      throw error
    } finally {
      this.state.isConnecting = false
    }
  }

  disconnect(): void {
    this.clearTimers()
    this.state.isConnected = false
    this.state.reconnectAttempts = 0
    this.emit('disconnected')
  }

  private onConnected(): void {
    this.state.isConnected = true
    this.state.isConnecting = false
    this.state.reconnectAttempts = 0
    this.state.lastConnected = new Date()
    this.state.lastError = undefined

    this.startHeartbeat()
    this.emit('connected')
  }

  private onConnectionError(error: Error): void {
    this.state.lastError = error.message
    this.emit('error', error)

    if (this.state.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect()
    } else {
      this.emit('maxReconnectAttemptsReached')
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.state.reconnectAttempts++
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    )

    this.emit('reconnecting', { 
      attempt: this.state.reconnectAttempts, 
      delay,
      maxAttempts: this.config.maxReconnectAttempts 
    })

    this.reconnectTimer = setTimeout(() => {
      this.emit('reconnectAttempt', this.state.reconnectAttempts)
    }, delay)
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = setInterval(() => {
      this.emit('heartbeat')
    }, this.config.heartbeatInterval)
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  // Public getters
  getState(): ConnectionState {
    return { ...this.state }
  }

  isConnected(): boolean {
    return this.state.isConnected
  }

  isConnecting(): boolean {
    return this.state.isConnecting
  }

  getReconnectAttempts(): number {
    return this.state.reconnectAttempts
  }

  getLastError(): string | undefined {
    return this.state.lastError
  }

  getLastConnected(): Date | undefined {
    return this.state.lastConnected
  }

  // Configuration updates
  updateConfig(config: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): ConnectionConfig {
    return { ...this.config }
  }

  // Cleanup
  destroy(): void {
    this.clearTimers()
    this.listeners.clear()
  }
}

// Utility functions for connection health monitoring
export class ConnectionHealthMonitor {
  private latencyHistory: number[] = []
  private maxHistorySize = 10
  private lastPingTime = 0
  private connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent'

  recordPing(): void {
    this.lastPingTime = Date.now()
  }

  recordPong(): void {
    if (this.lastPingTime > 0) {
      const latency = Date.now() - this.lastPingTime
      this.latencyHistory.push(latency)
      
      if (this.latencyHistory.length > this.maxHistorySize) {
        this.latencyHistory.shift()
      }

      this.updateConnectionQuality()
      this.lastPingTime = 0
    }
  }

  private updateConnectionQuality(): void {
    if (this.latencyHistory.length === 0) return

    const avgLatency = this.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.latencyHistory.length

    if (avgLatency < 100) {
      this.connectionQuality = 'excellent'
    } else if (avgLatency < 300) {
      this.connectionQuality = 'good'
    } else if (avgLatency < 1000) {
      this.connectionQuality = 'fair'
    } else {
      this.connectionQuality = 'poor'
    }
  }

  getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0
    return this.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.latencyHistory.length
  }

  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    return this.connectionQuality
  }

  getLatencyHistory(): number[] {
    return [...this.latencyHistory]
  }

  reset(): void {
    this.latencyHistory = []
    this.lastPingTime = 0
    this.connectionQuality = 'excellent'
  }
}