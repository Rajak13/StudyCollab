export interface RealtimeEvent {
  id: string
  type: string
  data: any
  userId: string
  groupId?: string
  timestamp: Date
}

export interface EventHandler<T = any> {
  (event: RealtimeEvent & { data: T }): void | Promise<void>
}

export class RealtimeEventSystem {
  private handlers = new Map<string, Set<EventHandler>>()
  private eventHistory: RealtimeEvent[] = []
  private maxHistorySize = 100

  // Register event handler
  on<T = any>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler as EventHandler)
  }

  // Unregister event handler
  off<T = any>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      handlers.delete(handler as EventHandler)
      if (handlers.size === 0) {
        this.handlers.delete(eventType)
      }
    }
  }

  // Emit event to all registered handlers
  async emit(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: RealtimeEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    }

    // Add to history
    this.addToHistory(fullEvent)

    // Get handlers for this event type
    const handlers = this.handlers.get(event.type)
    if (!handlers || handlers.size === 0) {
      return
    }

    // Execute all handlers
    const promises: Promise<void>[] = []
    handlers.forEach(handler => {
      try {
        const result = handler(fullEvent)
        if (result instanceof Promise) {
          promises.push(result)
        }
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error)
      }
    })

    // Wait for all async handlers to complete
    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  // Get event history
  getHistory(eventType?: string, limit?: number): RealtimeEvent[] {
    let events = eventType 
      ? this.eventHistory.filter(e => e.type === eventType)
      : this.eventHistory

    if (limit) {
      events = events.slice(-limit)
    }

    return events
  }

  // Clear event history
  clearHistory(): void {
    this.eventHistory = []
  }

  // Get all registered event types
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  // Get handler count for event type
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private addToHistory(event: RealtimeEvent): void {
    this.eventHistory.push(event)
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
  }
}

// Predefined event types
export const RealtimeEventTypes = {
  // Connection events
  CONNECTION_ESTABLISHED: 'connection:established',
  CONNECTION_LOST: 'connection:lost',
  CONNECTION_ERROR: 'connection:error',

  // User presence events
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  USER_PRESENCE_UPDATED: 'user:presence:updated',
  USER_CURSOR_UPDATED: 'user:cursor:updated',
  USER_TOOL_CHANGED: 'user:tool:changed',

  // Group events
  GROUP_JOINED: 'group:joined',
  GROUP_LEFT: 'group:left',
  GROUP_PRESENCE: 'group:presence',

  // Study board events
  BOARD_ELEMENT_ADDED: 'board:element:added',
  BOARD_ELEMENT_UPDATED: 'board:element:updated',
  BOARD_ELEMENT_DELETED: 'board:element:deleted',
  BOARD_CLEARED: 'board:cleared',

  // Chat events
  MESSAGE_SENT: 'chat:message:sent',
  MESSAGE_UPDATED: 'chat:message:updated',
  MESSAGE_DELETED: 'chat:message:deleted',
  TYPING_STARTED: 'chat:typing:started',
  TYPING_STOPPED: 'chat:typing:stopped',

  // Voice call events
  CALL_STARTED: 'voice:call:started',
  CALL_ENDED: 'voice:call:ended',
  CALL_USER_JOINED: 'voice:call:user:joined',
  CALL_USER_LEFT: 'voice:call:user:left',
  CALL_USER_MUTED: 'voice:call:user:muted',
  CALL_USER_UNMUTED: 'voice:call:user:unmuted',

  // System events
  HEARTBEAT: 'system:heartbeat',
  ERROR: 'system:error',
  WARNING: 'system:warning',
} as const

// Event data type definitions
export interface ConnectionEvent {
  status: 'connected' | 'disconnected' | 'error'
  error?: string
}

export interface UserPresenceEvent {
  userId: string
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  presence: {
    isActive: boolean
    cursor?: { x: number; y: number }
    currentTool?: string
    lastSeen: Date
  }
}

export interface GroupEvent {
  groupId: string
  members?: UserPresenceEvent[]
}

export interface BoardElementEvent {
  boardId: string
  elementId: string
  element?: {
    type: string
    position: { x: number; y: number }
    properties: Record<string, any>
  }
}

export interface ChatMessageEvent {
  messageId: string
  groupId: string
  userId: string
  content: string
  timestamp: Date
}

export interface VoiceCallEvent {
  callId: string
  groupId: string
  participants: string[]
}

// Utility functions for event handling
export function createEventFilter(
  eventTypes: string[],
  userId?: string,
  groupId?: string
) {
  return (event: RealtimeEvent): boolean => {
    if (!eventTypes.includes(event.type)) return false
    if (userId && event.userId !== userId) return false
    if (groupId && event.groupId !== groupId) return false
    return true
  }
}

export function createEventDebouncer<T>(
  handler: EventHandler<T>,
  delay: number
): EventHandler<T> {
  let timeoutId: NodeJS.Timeout | null = null

  return (event) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      handler(event)
      timeoutId = null
    }, delay)
  }
}

export function createEventThrottler<T>(
  handler: EventHandler<T>,
  interval: number
): EventHandler<T> {
  let lastExecuted = 0

  return (event) => {
    const now = Date.now()
    if (now - lastExecuted >= interval) {
      handler(event)
      lastExecuted = now
    }
  }
}

// Global event system instance
let globalEventSystem: RealtimeEventSystem | null = null

export function getGlobalEventSystem(): RealtimeEventSystem {
  if (!globalEventSystem) {
    globalEventSystem = new RealtimeEventSystem()
  }
  return globalEventSystem
}

// React hook for event system
export function useRealtimeEvents() {
  const eventSystem = getGlobalEventSystem()

  return {
    on: eventSystem.on.bind(eventSystem),
    off: eventSystem.off.bind(eventSystem),
    emit: eventSystem.emit.bind(eventSystem),
    getHistory: eventSystem.getHistory.bind(eventSystem),
    clearHistory: eventSystem.clearHistory.bind(eventSystem),
    getEventTypes: eventSystem.getEventTypes.bind(eventSystem),
  }
}