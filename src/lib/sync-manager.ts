import type {
    NetworkStatus,
    SyncOptions,
    SyncQueueItem
} from '@/types/offline'
import { cacheManager } from './cache-manager'
import { createClient } from './supabase'

export class SyncManager {
  private static instance: SyncManager
  private syncQueue: SyncQueueItem[] = []
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true
  private syncInProgress: boolean = false
  private syncInterval: NodeJS.Timeout | null = null
  private networkStatus: NetworkStatus = { online: typeof navigator !== 'undefined' ? navigator.onLine : true }

  private constructor() {
    this.setupNetworkListeners()
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSyncQueue()
      this.startPeriodicSync()
      
      // Sync immediately if online
      if (this.isOnline) {
        await this.sync()
      }
    } catch (error) {
      console.error('Failed to initialize sync manager:', error)
    }
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...operation,
      id: `${operation.type}_${operation.table}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    }

    this.syncQueue.push(queueItem)
    await this.saveSyncQueue()

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      await this.sync()
    }
  }

  /**
   * Perform synchronization
   */
  async sync(options?: SyncOptions): Promise<{ success: boolean; errors: string[] }> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, errors: ['Sync already in progress or offline'] }
    }

    this.syncInProgress = true
    const errors: string[] = []

    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Process sync queue
      const itemsToProcess = [...this.syncQueue]
      const processedItems: string[] = []

      for (const item of itemsToProcess) {
        try {
          await this.processSyncItem(item, supabase)
          processedItems.push(item.id)
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
          
          // Increment retry count
          item.retryCount++
          
          if (item.retryCount >= item.maxRetries) {
            errors.push(`Max retries exceeded for ${item.type} on ${item.table}`)
            processedItems.push(item.id) // Remove from queue
          }
        }
      }

      // Remove processed items from queue
      this.syncQueue = this.syncQueue.filter(item => !processedItems.includes(item.id))
      await this.saveSyncQueue()

      // Sync cached data with server
      await this.syncCachedData(user.id)

      return { success: errors.length === 0, errors }
    } catch (error) {
      console.error('Sync failed:', error)
      errors.push(error instanceof Error ? error.message : 'Unknown sync error')
      return { success: false, errors }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: this.syncQueue.length,
      networkStatus: this.networkStatus
    }
  }

  /**
   * Force sync when connection is restored
   */
  async onConnectionRestored(): Promise<void> {
    if (this.isOnline && this.syncQueue.length > 0) {
      await this.sync()
    }
  }

  /**
   * Clear sync queue (for testing or reset)
   */
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = []
    await this.saveSyncQueue()
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncQueueItem, supabase: any): Promise<void> {
    switch (item.type) {
      case 'CREATE':
        await this.handleCreate(item, supabase)
        break
      case 'UPDATE':
        await this.handleUpdate(item, supabase)
        break
      case 'DELETE':
        await this.handleDelete(item, supabase)
        break
      default:
        throw new Error(`Unknown sync operation type: ${item.type}`)
    }
  }

  /**
   * Handle CREATE operations
   */
  private async handleCreate(item: SyncQueueItem, supabase: any): Promise<void> {
    const { data, error } = await supabase
      .from(item.table)
      .insert(item.data)
      .select()
      .single()

    if (error) {
      throw new Error(`Create failed: ${error.message}`)
    }

    // Update cache with server data (including server-generated ID)
    if (data && item.localId) {
      await cacheManager.set(
        data.id, 
        data, 
        item.table as any, 
        data.user_id || data.owner_id,
        { ttl: 24 * 60 * 60 * 1000 }
      )
      
      // Remove old local cache entry
      await cacheManager.delete(item.localId)
    }
  }

  /**
   * Handle UPDATE operations
   */
  private async handleUpdate(item: SyncQueueItem, supabase: any): Promise<void> {
    const { data, error } = await supabase
      .from(item.table)
      .update(item.data)
      .eq('id', item.data.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Update failed: ${error.message}`)
    }

    // Update cache with server data
    if (data) {
      await cacheManager.set(
        data.id, 
        data, 
        item.table as any, 
        data.user_id || data.owner_id,
        { ttl: 24 * 60 * 60 * 1000 }
      )
    }
  }

  /**
   * Handle DELETE operations
   */
  private async handleDelete(item: SyncQueueItem, supabase: any): Promise<void> {
    const { error } = await supabase
      .from(item.table)
      .delete()
      .eq('id', item.data.id)

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }

    // Remove from cache
    await cacheManager.delete(item.data.id)
  }

  /**
   * Sync cached data with server (pull updates)
   */
  private async syncCachedData(userId: string): Promise<void> {
    const supabase = createClient()
    
    // Get last sync time from cache or use a default
    const lastSyncTime = (typeof localStorage !== 'undefined' ? localStorage.getItem('lastSyncTime') : null) || 
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Sync different data types
    await Promise.all([
      this.syncDataType('tasks', userId, lastSyncTime, supabase),
      this.syncDataType('notes', userId, lastSyncTime, supabase),
      this.syncDataType('study-groups', userId, lastSyncTime, supabase),
      this.syncDataType('resources', userId, lastSyncTime, supabase)
    ])

    // Update last sync time
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lastSyncTime', new Date().toISOString())
    }
  }

  /**
   * Sync specific data type
   */
  private async syncDataType(
    type: string, 
    userId: string, 
    lastSyncTime: string, 
    supabase: any
  ): Promise<void> {
    try {
      let query = supabase.from(type)

      // Add user filter based on table structure
      if (type === 'study-groups') {
        // For study groups, get groups where user is a member
        query = query
          .select(`
            *,
            members:group_members!inner(user_id)
          `)
          .eq('members.user_id', userId)
      } else {
        query = query.select('*').eq('user_id', userId)
      }

      // Only get items updated since last sync
      query = query.gte('updated_at', lastSyncTime)

      const { data, error } = await query

      if (error) {
        console.error(`Failed to sync ${type}:`, error)
        return
      }

      // Cache the synced data
      if (data && data.length > 0) {
        for (const item of data) {
          await cacheManager.set(
            item.id,
            item,
            type as any,
            userId,
            { ttl: 24 * 60 * 60 * 1000 }
          )
        }
      }
    } catch (error) {
      console.error(`Error syncing ${type}:`, error)
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    // Only setup listeners in browser environment
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.networkStatus.online = true
      this.onConnectionRestored()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.networkStatus.online = false
    })

    // Enhanced network status detection
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateNetworkStatus = () => {
        this.networkStatus = {
          online: navigator.onLine,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        }
      }

      connection.addEventListener('change', updateNetworkStatus)
      updateNetworkStatus()
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        await this.sync()
      }
    }, 30000) // Sync every 30 seconds
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return
      
      const stored = localStorage.getItem('syncQueue')
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.syncQueue = []
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return
      
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

// Singleton instance
export const syncManager = SyncManager.getInstance()