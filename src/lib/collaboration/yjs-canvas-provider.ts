import { CanvasChange, CanvasElement, Point } from '@/types/study-board'
import * as Y from 'yjs'
import { getRealtimeClient } from '../realtime/socket-client'

export interface UserCursor {
  userId: string
  userName: string
  cursor: Point | null
  currentTool: string
  color: string
}

export interface CollaborativeCanvasOptions {
  groupId: string
  userId: string
  userName: string
  onElementsChange?: (elements: CanvasElement[]) => void
  onCursorUpdate?: (cursors: Map<string, UserCursor>) => void
  onUserJoined?: (userId: string, userName: string) => void
  onUserLeft?: (userId: string) => void
  onConnectionChange?: (connected: boolean) => void
}

export class YjsCanvasProvider {
  private doc: Y.Doc
  private elementsMap: Y.Map<any>
  private awarenessMap: Y.Map<any>
  private options: CollaborativeCanvasOptions
  private userCursors = new Map<string, UserCursor>()
  private isConnected = false
  private realtimeClient: any

  constructor(options: CollaborativeCanvasOptions) {
    this.options = options
    this.doc = new Y.Doc()
    this.elementsMap = this.doc.getMap('canvas-elements')
    this.awarenessMap = this.doc.getMap('user-awareness')
    
    this.setupEventListeners()
  }

  async connect(): Promise<void> {
    if (this.isConnected) return

    try {
      // Get the socket from our existing realtime client
      this.realtimeClient = getRealtimeClient()
      
      // Ensure realtime client is connected
      if (!this.realtimeClient.isConnected()) {
        await this.realtimeClient.connect()
      }

      // Set up Yjs-specific socket event handlers
      this.setupSocketHandlers()

      // Join the Yjs room
      this.realtimeClient.emit('yjs:join-room', `canvas-${this.options.groupId}`)

      this.isConnected = true
      this.options.onConnectionChange?.(true)

      // Set initial user awareness
      this.updateUserAwareness({
        userId: this.options.userId,
        userName: this.options.userName,
        cursor: null,
        currentTool: 'select',
        color: this.generateUserColor(this.options.userId),
      })

    } catch (error) {
      console.error('Failed to connect Yjs provider:', error)
      throw error
    }
  }

  disconnect(): void {
    if (this.realtimeClient && this.isConnected) {
      this.realtimeClient.emit('yjs:leave-room', `canvas-${this.options.groupId}`)
      this.cleanupSocketHandlers()
    }
    this.isConnected = false
    this.userCursors.clear()
    this.options.onConnectionChange?.(false)
  }

  private setupSocketHandlers(): void {
    if (!this.realtimeClient) return

    // Handle Yjs sync messages
    this.realtimeClient.on('yjs:sync-step1', (data: number[]) => {
      const update = new Uint8Array(data)
      Y.applyUpdate(this.doc, update)
    })

    this.realtimeClient.on('yjs:sync-step2', (data: number[]) => {
      const update = new Uint8Array(data)
      Y.applyUpdate(this.doc, update)
    })

    this.realtimeClient.on('yjs:update', (data: number[]) => {
      const update = new Uint8Array(data)
      Y.applyUpdate(this.doc, update)
    })

    this.realtimeClient.on('yjs:awareness', (data: any) => {
      // Handle awareness updates from other clients
      if (data.userId !== this.options.userId) {
        this.awarenessMap.set(data.userId, data)
      }
    })

    this.realtimeClient.on('yjs:error', (error: any) => {
      console.error('Yjs error:', error)
      this.isConnected = false
      this.options.onConnectionChange?.(false)
    })

    // Set up document update handler to broadcast changes
    this.doc.on('update', (update: Uint8Array) => {
      if (this.isConnected) {
        this.realtimeClient.emit('yjs:update', Array.from(update))
      }
    })
  }

  private cleanupSocketHandlers(): void {
    if (!this.realtimeClient) return

    this.realtimeClient.off('yjs:sync-step1')
    this.realtimeClient.off('yjs:sync-step2')
    this.realtimeClient.off('yjs:update')
    this.realtimeClient.off('yjs:awareness')
    this.realtimeClient.off('yjs:error')
  }

  private setupEventListeners(): void {
    // Listen for canvas elements changes
    this.elementsMap.observe((event) => {
      const elements = this.getCanvasElements()
      this.options.onElementsChange?.(elements)
    })

    // Listen for user awareness changes
    this.awarenessMap.observe((event) => {
      this.updateCursorsFromAwareness()
    })
  }

  // Canvas element operations
  addElement(element: CanvasElement): void {
    if (!this.isConnected) {
      console.warn('Cannot add element: Yjs provider not connected')
      return
    }

    this.elementsMap.set(element.id, {
      ...element,
      createdBy: this.options.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  updateElement(elementId: string, updates: Partial<CanvasElement>): void {
    if (!this.isConnected) {
      console.warn('Cannot update element: Yjs provider not connected')
      return
    }

    const existingElement = this.elementsMap.get(elementId)
    if (existingElement) {
      this.elementsMap.set(elementId, {
        ...existingElement,
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  removeElement(elementId: string): void {
    if (!this.isConnected) {
      console.warn('Cannot remove element: Yjs provider not connected')
      return
    }

    this.elementsMap.delete(elementId)
  }

  getCanvasElements(): CanvasElement[] {
    const elements: CanvasElement[] = []
    this.elementsMap.forEach((element, id) => {
      elements.push({
        ...element,
        id,
        createdAt: element.createdAt ? new Date(element.createdAt) : new Date(),
        updatedAt: element.updatedAt ? new Date(element.updatedAt) : new Date(),
      })
    })
    return elements.sort((a, b) => a.layer - b.layer)
  }

  clearCanvas(): void {
    if (!this.isConnected) {
      console.warn('Cannot clear canvas: Yjs provider not connected')
      return
    }

    this.elementsMap.clear()
  }

  // User awareness operations
  updateCursor(cursor: Point | null): void {
    const currentAwareness = this.awarenessMap.get(this.options.userId) || {}
    this.updateUserAwareness({
      ...currentAwareness,
      cursor,
    })
  }

  updateTool(tool: string): void {
    const currentAwareness = this.awarenessMap.get(this.options.userId) || {}
    this.updateUserAwareness({
      ...currentAwareness,
      currentTool: tool,
    })
  }

  private updateUserAwareness(awareness: Partial<UserCursor>): void {
    if (!this.isConnected || !this.realtimeClient) return

    const currentAwareness = this.awarenessMap.get(this.options.userId) || {}
    const updatedAwareness = {
      ...currentAwareness,
      ...awareness,
      lastSeen: new Date().toISOString(),
    }
    
    this.awarenessMap.set(this.options.userId, updatedAwareness)
    
    // Broadcast awareness to other clients
    this.realtimeClient.emit('yjs:awareness', updatedAwareness)
  }

  private updateCursorsFromAwareness(): void {
    const newCursors = new Map<string, UserCursor>()
    
    this.awarenessMap.forEach((awareness, userId) => {
      if (userId !== this.options.userId) {
        newCursors.set(userId, {
          userId,
          userName: awareness.userName || 'Unknown User',
          cursor: awareness.cursor || null,
          currentTool: awareness.currentTool || 'select',
          color: awareness.color || this.generateUserColor(userId),
        })
      }
    })

    // Check for users who joined or left
    const previousUserIds = new Set(this.userCursors.keys())
    const currentUserIds = new Set(newCursors.keys())

    // Users who joined
    currentUserIds.forEach(userId => {
      if (!previousUserIds.has(userId)) {
        const user = newCursors.get(userId)!
        this.options.onUserJoined?.(userId, user.userName)
      }
    })

    // Users who left
    previousUserIds.forEach(userId => {
      if (!currentUserIds.has(userId)) {
        this.options.onUserLeft?.(userId)
      }
    })

    this.userCursors = newCursors
    this.options.onCursorUpdate?.(this.userCursors)
  }

  getUserCursors(): Map<string, UserCursor> {
    return new Map(this.userCursors)
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userCursors.keys())
  }

  isUserConnected(userId: string): boolean {
    return this.userCursors.has(userId)
  }

  private generateUserColor(userId: string): string {
    // Generate a consistent color for each user based on their ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  // Operational transform helpers for conflict resolution
  applyOperation(operation: CanvasChange): void {
    switch (operation.type) {
      case 'add':
        this.addElement(operation.element)
        break
      case 'update':
        this.updateElement(operation.element.id, operation.element)
        break
      case 'delete':
        this.removeElement(operation.element.id)
        break
    }
  }

  // Get document state for debugging
  getDocumentState(): any {
    return {
      elements: this.getCanvasElements(),
      awareness: Object.fromEntries(this.awarenessMap.entries()),
      isConnected: this.isConnected,
      userCount: this.userCursors.size + 1, // +1 for current user
    }
  }

  // Sync state manually (useful for debugging)
  forceSync(): void {
    if (this.isConnected && this.realtimeClient) {
      const state = Y.encodeStateAsUpdate(this.doc)
      this.realtimeClient.emit('yjs:sync-step1', Array.from(state))
    }
  }
}