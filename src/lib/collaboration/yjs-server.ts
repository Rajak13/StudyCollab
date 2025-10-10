import { Server as SocketIOServer } from 'socket.io'
import * as Y from 'yjs'

export interface YjsServerOptions {
  io: SocketIOServer
  gcEnabled?: boolean
  persistenceEnabled?: boolean
}

export class YjsServer {
  private io: SocketIOServer
  private documents = new Map<string, Y.Doc>()
  private gcEnabled: boolean
  private persistenceEnabled: boolean

  constructor(options: YjsServerOptions) {
    this.io = options.io
    this.gcEnabled = options.gcEnabled ?? true
    this.persistenceEnabled = options.persistenceEnabled ?? false
    
    this.setupYjsHandlers()
  }

  private setupYjsHandlers() {
    // Handle Yjs document connections
    this.io.on('connection', (socket) => {
      console.log('Socket connected for Yjs:', socket.id)

      // Handle Yjs document room joining
      socket.on('yjs:join-room', (roomName: string) => {
        console.log(`Socket ${socket.id} joining Yjs room: ${roomName}`)
        
        // Validate room name (should be canvas-{groupId})
        if (!roomName.startsWith('canvas-')) {
          socket.emit('yjs:error', { message: 'Invalid room name' })
          return
        }

        // Get or create document for this room
        let doc = this.documents.get(roomName)
        if (!doc) {
          doc = new Y.Doc()
          this.documents.set(roomName, doc)
          
          // Set up garbage collection if enabled
          if (this.gcEnabled) {
            doc.gc = true
          }

          // Set up persistence if enabled
          if (this.persistenceEnabled) {
            this.setupPersistence(roomName, doc)
          }

          console.log(`Created new Yjs document for room: ${roomName}`)
        }

        // Join the socket to the room
        socket.join(roomName)

        // Set up Yjs WebSocket connection
        this.setupYjsConnection(socket, roomName, doc)
      })

      // Handle leaving Yjs rooms
      socket.on('yjs:leave-room', (roomName: string) => {
        console.log(`Socket ${socket.id} leaving Yjs room: ${roomName}`)
        socket.leave(roomName)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Socket disconnected from Yjs:', socket.id)
        // Cleanup is handled automatically by socket.io room management
      })
    })
  }

  private setupYjsConnection(socket: any, roomName: string, doc: Y.Doc) {
    console.log(`Setting up Yjs connection for room: ${roomName}`)

    // Handle Yjs-specific events
    socket.on('yjs:sync-step1', (data: any) => {
      // Forward sync messages to other clients in the room
      socket.to(roomName).emit('yjs:sync-step1', data)
    })

    socket.on('yjs:sync-step2', (data: any) => {
      // Forward sync messages to other clients in the room
      socket.to(roomName).emit('yjs:sync-step2', data)
    })

    socket.on('yjs:update', (data: any) => {
      // Apply update to document and forward to other clients
      try {
        Y.applyUpdate(doc, new Uint8Array(data))
        socket.to(roomName).emit('yjs:update', data)
      } catch (error) {
        console.error(`Failed to apply Yjs update for room ${roomName}:`, error)
        socket.emit('yjs:error', { message: 'Failed to apply update' })
      }
    })

    socket.on('yjs:awareness', (data: any) => {
      // Forward awareness updates to other clients in the room
      socket.to(roomName).emit('yjs:awareness', data)
    })

    // Send initial sync data to the connecting client
    const syncData = Y.encodeStateAsUpdate(doc)
    socket.emit('yjs:sync-step1', Array.from(syncData))
    
    console.log(`Yjs connection established for room: ${roomName}`)
  }

  private setupPersistence(roomName: string, doc: Y.Doc) {
    // This is a basic in-memory persistence
    // In production, you'd want to use a proper database
    
    doc.on('update', (update: Uint8Array) => {
      // Save update to persistent storage
      console.log(`Persisting update for room: ${roomName}`)
      // TODO: Implement actual persistence (database, file system, etc.)
    })

    // Load existing data if available
    // TODO: Load from persistent storage
  }

  // Public methods for managing documents
  public getDocument(roomName: string): Y.Doc | undefined {
    return this.documents.get(roomName)
  }

  public createDocument(roomName: string): Y.Doc {
    if (this.documents.has(roomName)) {
      return this.documents.get(roomName)!
    }

    const doc = new Y.Doc()
    this.documents.set(roomName, doc)
    
    if (this.gcEnabled) {
      doc.gc = true
    }

    if (this.persistenceEnabled) {
      this.setupPersistence(roomName, doc)
    }

    return doc
  }

  public deleteDocument(roomName: string): boolean {
    const doc = this.documents.get(roomName)
    if (doc) {
      doc.destroy()
      this.documents.delete(roomName)
      return true
    }
    return false
  }

  public getRoomClients(roomName: string): number {
    const room = this.io.sockets.adapter.rooms.get(roomName)
    return room ? room.size : 0
  }

  public getAllRooms(): string[] {
    return Array.from(this.documents.keys())
  }

  public getDocumentStats(roomName: string) {
    const doc = this.documents.get(roomName)
    if (!doc) return null

    return {
      roomName,
      clientCount: this.getRoomClients(roomName),
      documentSize: Y.encodeStateAsUpdate(doc).length,
      hasContent: doc.share.size > 0,
    }
  }

  // Cleanup method
  public cleanup() {
    this.documents.forEach((doc, roomName) => {
      console.log(`Cleaning up Yjs document: ${roomName}`)
      doc.destroy()
    })
    this.documents.clear()
  }
}

// Singleton instance
let yjsServer: YjsServer | null = null

export function initializeYjsServer(io: SocketIOServer): YjsServer {
  if (!yjsServer) {
    yjsServer = new YjsServer({ io })
  }
  return yjsServer
}

export function getYjsServer(): YjsServer | null {
  return yjsServer
}