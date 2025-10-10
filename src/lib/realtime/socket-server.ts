import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

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

export interface SocketData {
  user?: SocketUser
  presence?: UserPresence
}

export class RealtimeServer {
  private ioServer: SocketIOServer
  private userSockets = new Map<string, string>() // userId -> socketId
  private socketUsers = new Map<string, SocketUser>() // socketId -> user
  private userPresence = new Map<string, UserPresence>() // userId -> presence
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(server: HTTPServer) {
    this.ioServer = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    })

    this.setupMiddleware()
    this.setupEventHandlers()
    this.startHeartbeat()
  }

  private setupMiddleware() {
    // Authentication middleware
    this.ioServer.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // Create a Supabase client with the user's token and verify it
        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        )
        
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          return next(new Error('Invalid authentication token'))
        }

        // Store user data in socket
        const socketUser: SocketUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
        }

        socket.data.user = socketUser
        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.ioServer.on('connection', (socket) => {
      const user = socket.data.user as SocketUser
      
      if (!user) {
        socket.disconnect()
        return
      }

      console.log(`User ${user.name} (${user.id}) connected with socket ${socket.id}`)

      // Store socket mappings
      this.userSockets.set(user.id, socket.id)
      this.socketUsers.set(socket.id, user)

      // Initialize user presence
      const presence: UserPresence = {
        userId: user.id,
        isActive: true,
        lastSeen: new Date(),
      }
      this.userPresence.set(user.id, presence)

      // Join user to their personal room
      socket.join(`user:${user.id}`)

      // Handle presence updates
      socket.on('presence:update', (data: Partial<UserPresence>) => {
        this.updateUserPresence(user.id, data)
        
        // Broadcast presence to group if user is in one
        if (data.groupId) {
          socket.to(`group:${data.groupId}`).emit('presence:updated', {
            userId: user.id,
            ...this.userPresence.get(user.id),
          })
        }
      })

      // Handle joining groups
      socket.on('group:join', (groupId: string) => {
        socket.join(`group:${groupId}`)
        this.updateUserPresence(user.id, { groupId })
        
        // Notify others in the group
        socket.to(`group:${groupId}`).emit('user:joined', {
          userId: user.id,
          user: user,
          presence: this.userPresence.get(user.id),
        })

        // Send current group members to the joining user
        this.sendGroupPresence(socket, groupId)
      })

      // Handle leaving groups
      socket.on('group:leave', (groupId: string) => {
        socket.leave(`group:${groupId}`)
        this.updateUserPresence(user.id, { groupId: undefined })
        
        // Notify others in the group
        socket.to(`group:${groupId}`).emit('user:left', {
          userId: user.id,
        })
      })

      // Handle cursor updates
      socket.on('cursor:update', (data: { groupId: string; cursor: { x: number; y: number } }) => {
        this.updateUserPresence(user.id, { 
          cursor: data.cursor,
          groupId: data.groupId,
        })
        
        socket.to(`group:${data.groupId}`).emit('cursor:updated', {
          userId: user.id,
          cursor: data.cursor,
        })
      })

      // Handle tool changes
      socket.on('tool:change', (data: { groupId: string; tool: string }) => {
        this.updateUserPresence(user.id, { 
          currentTool: data.tool,
          groupId: data.groupId,
        })
        
        socket.to(`group:${data.groupId}`).emit('tool:changed', {
          userId: user.id,
          tool: data.tool,
        })
      })

      // Handle heartbeat
      socket.on('heartbeat', () => {
        this.updateUserPresence(user.id, { lastSeen: new Date() })
        socket.emit('heartbeat:ack')
      })

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User ${user.name} (${user.id}) disconnected: ${reason}`)
        
        const presence = this.userPresence.get(user.id)
        if (presence?.groupId) {
          socket.to(`group:${presence.groupId}`).emit('user:left', {
            userId: user.id,
          })
        }

        // Clean up mappings
        this.userSockets.delete(user.id)
        this.socketUsers.delete(socket.id)
        this.updateUserPresence(user.id, { isActive: false })
      })

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${user.id}:`, error)
      })
    })
  }

  private updateUserPresence(userId: string, updates: Partial<UserPresence>) {
    const currentPresence = this.userPresence.get(userId)
    if (currentPresence) {
      const updatedPresence = { ...currentPresence, ...updates }
      this.userPresence.set(userId, updatedPresence)
    }
  }

  private sendGroupPresence(socket: any, groupId: string) {
    const groupMembers: Array<{ userId: string; user: SocketUser; presence: UserPresence }> = []
    
    this.userPresence.forEach((presence, userId) => {
      if (presence.groupId === groupId && presence.isActive) {
        const user = this.socketUsers.get(this.userSockets.get(userId) || '')
        if (user) {
          groupMembers.push({ userId, user, presence })
        }
      }
    })

    socket.emit('group:presence', groupMembers)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date()
      const staleThreshold = 60000 // 1 minute

      this.userPresence.forEach((presence, userId) => {
        if (presence.isActive && now.getTime() - presence.lastSeen.getTime() > staleThreshold) {
          this.updateUserPresence(userId, { isActive: false })
          
          // Notify group members if user was in a group
          if (presence.groupId) {
            this.ioServer.to(`group:${presence.groupId}`).emit('user:inactive', {
              userId,
            })
          }
        }
      })
    }, 30000) // Check every 30 seconds
  }

  // Public methods for external use
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId)
    if (socketId) {
      this.ioServer.to(socketId).emit(event, data)
    }
  }

  public emitToGroup(groupId: string, event: string, data: any) {
    this.ioServer.to(`group:${groupId}`).emit(event, data)
  }

  public getUserPresence(userId: string): UserPresence | undefined {
    return this.userPresence.get(userId)
  }

  public getGroupPresence(groupId: string): UserPresence[] {
    const groupPresence: UserPresence[] = []
    this.userPresence.forEach((presence) => {
      if (presence.groupId === groupId && presence.isActive) {
        groupPresence.push(presence)
      }
    })
    return groupPresence
  }

  public isUserOnline(userId: string): boolean {
    const presence = this.userPresence.get(userId)
    return presence?.isActive || false
  }

  public getOnlineUsersCount(): number {
    let count = 0
    this.userPresence.forEach((presence) => {
      if (presence.isActive) count++
    })
    return count
  }

  public disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.ioServer.close()
  }

  // Expose the Socket.IO instance for external use (e.g., Yjs integration)
  public get io(): SocketIOServer {
    return this.ioServer
  }
}

// Singleton instance
let realtimeServer: RealtimeServer | null = null

export function initializeRealtimeServer(server: HTTPServer): RealtimeServer {
  if (!realtimeServer) {
    realtimeServer = new RealtimeServer(server)
  }
  return realtimeServer
}

export function getRealtimeServer(): RealtimeServer | null {
  return realtimeServer
}

// CommonJS exports for compatibility
module.exports = {
  RealtimeServer,
  initializeRealtimeServer,
  getRealtimeServer
}