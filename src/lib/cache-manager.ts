import type {
    CacheableData,
    CacheConfig,
    CacheEntry,
    CacheMetadata,
    CacheStats
} from '@/types/offline'
import { DBSchema, IDBPDatabase, openDB } from 'idb'
import { encryptionService } from './encryption'

interface CacheDB extends DBSchema {
  cache: {
    key: string
    value: CacheEntry
    indexes: {
      'by-type': string
      'by-timestamp': number
      'by-expires': number
      'by-user': string
    }
  }
  metadata: {
    key: string
    value: CacheMetadata
  }
  sync_queue: {
    key: string
    value: {
      id: string
      type: 'CREATE' | 'UPDATE' | 'DELETE'
      table: string
      data: any
      timestamp: number
      retryCount: number
      priority: 'HIGH' | 'MEDIUM' | 'LOW'
    }
  }
}

export class CacheManager {
  private static instance: CacheManager
  private db: IDBPDatabase<CacheDB> | null = null
  private config: CacheConfig
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    lastCleanup: 0
  }

  private constructor() {
    this.config = {
      maxSize: 50, // 50MB default
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      encryptSensitiveData: true,
      syncInterval: 30 * 1000, // 30 seconds
      retryAttempts: 3,
      compressionEnabled: true
    }
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Initialize the cache database
   */
  async initialize(userId: string): Promise<void> {
    try {
      this.db = await openDB<CacheDB>(`studycollab-cache-${userId}`, 1, {
        upgrade(db) {
          // Cache store
          const cacheStore = db.createObjectStore('cache', { keyPath: 'id' })
          cacheStore.createIndex('by-type', 'metadata.type')
          cacheStore.createIndex('by-timestamp', 'timestamp')
          cacheStore.createIndex('by-expires', 'expiresAt')
          cacheStore.createIndex('by-user', 'metadata.userId')

          // Metadata store
          db.createObjectStore('metadata', { keyPath: 'type' })

          // Sync queue store
          db.createObjectStore('sync_queue', { keyPath: 'id' })
        }
      })

      await this.updateStats()
      await this.cleanup()
    } catch (error) {
      console.error('Failed to initialize cache:', error)
      throw error
    }
  }

  /**
   * Store data in cache
   */
  async set<T>(
    key: string, 
    data: T, 
    type: CacheableData,
    userId: string,
    options?: {
      ttl?: number
      encrypt?: boolean
      tags?: string[]
      dependencies?: string[]
    }
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    try {
      const now = Date.now()
      const ttl = options?.ttl || this.config.defaultTTL
      const shouldEncrypt = options?.encrypt ?? this.shouldEncrypt(type)
      
      let serializedData = JSON.stringify(data)
      let encrypted = false

      // Encrypt sensitive data
      if (shouldEncrypt && encryptionService.isInitialized()) {
        serializedData = encryptionService.encrypt(serializedData)
        encrypted = true
      }

      const checksum = encryptionService.generateChecksum(serializedData)

      const entry: CacheEntry<T> = {
        id: key,
        data: encrypted ? serializedData as any : data,
        timestamp: now,
        expiresAt: now + ttl,
        version: 1,
        checksum,
        encrypted
      }

      // Store cache entry
      await this.db.put('cache', entry)

      // Store metadata
      const metadata: CacheMetadata = {
        type,
        userId,
        lastModified: now,
        dependencies: options?.dependencies,
        tags: options?.tags
      }
      await this.db.put('metadata', { ...metadata, type: `${type}:${key}` })

      await this.updateStats()
      
      // Check if we need to cleanup
      if (this.stats.totalSize > this.config.maxSize * 1024 * 1024) {
        await this.cleanup()
      }
    } catch (error) {
      console.error('Failed to cache data:', error)
      throw error
    }
  }

  /**
   * Retrieve data from cache
   */
  async get<T>(key: string, type: CacheableData): Promise<T | null> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    try {
      const entry = await this.db.get('cache', key)
      
      if (!entry) {
        this.stats.missRate++
        return null
      }

      // Check if expired
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        await this.delete(key)
        this.stats.missRate++
        return null
      }

      let data = entry.data

      // Decrypt if necessary
      if (entry.encrypted && encryptionService.isInitialized()) {
        try {
          const decryptedData = encryptionService.decrypt(data as string)
          
          // Verify checksum
          if (!encryptionService.verifyChecksum(data as string, entry.checksum)) {
            console.warn('Cache entry checksum mismatch, removing:', key)
            await this.delete(key)
            return null
          }

          data = JSON.parse(decryptedData)
        } catch (error) {
          console.error('Failed to decrypt cache entry:', error)
          await this.delete(key)
          return null
        }
      }

      this.stats.hitRate++
      return data as T
    } catch (error) {
      console.error('Failed to retrieve cached data:', error)
      this.stats.missRate++
      return null
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    if (!this.db) return

    try {
      await this.db.delete('cache', key)
      await this.updateStats()
    } catch (error) {
      console.error('Failed to delete cache entry:', error)
    }
  }

  /**
   * Clear all cache entries of a specific type
   */
  async clearType(type: CacheableData): Promise<void> {
    if (!this.db) return

    try {
      const tx = this.db.transaction('cache', 'readwrite')
      const index = tx.store.index('by-type')
      
      for await (const cursor of index.iterate(type)) {
        await cursor.delete()
      }

      await tx.done
      await this.updateStats()
    } catch (error) {
      console.error('Failed to clear cache type:', error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.db) return

    try {
      await this.db.clear('cache')
      await this.db.clear('metadata')
      await this.updateStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Cleanup expired entries and manage size
   */
  async cleanup(): Promise<void> {
    if (!this.db) return

    try {
      const now = Date.now()
      const tx = this.db.transaction('cache', 'readwrite')
      const index = tx.store.index('by-expires')
      
      // Remove expired entries
      for await (const cursor of index.iterate(IDBKeyRange.upperBound(now))) {
        await cursor.delete()
      }

      await tx.done

      // If still over size limit, remove oldest entries
      if (this.stats.totalSize > this.config.maxSize * 1024 * 1024) {
        await this.removeOldestEntries()
      }

      this.stats.lastCleanup = now
      await this.updateStats()
    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }

  /**
   * Get all cached keys for a type
   */
  async getKeys(type: CacheableData): Promise<string[]> {
    if (!this.db) return []

    try {
      const tx = this.db.transaction('cache', 'readonly')
      const index = tx.store.index('by-type')
      const keys: string[] = []
      
      for await (const cursor of index.iterate(type)) {
        keys.push(cursor.value.id)
      }

      return keys
    } catch (error) {
      console.error('Failed to get cache keys:', error)
      return []
    }
  }

  /**
   * Check if data should be encrypted
   */
  private shouldEncrypt(type: CacheableData): boolean {
    const sensitiveTypes: CacheableData[] = ['profiles', 'notes', 'files']
    return this.config.encryptSensitiveData && sensitiveTypes.includes(type)
  }

  /**
   * Update cache statistics
   */
  private async updateStats(): Promise<void> {
    if (!this.db) return

    try {
      const tx = this.db.transaction('cache', 'readonly')
      let totalEntries = 0
      let totalSize = 0

      for await (const cursor of tx.store) {
        totalEntries++
        totalSize += JSON.stringify(cursor.value).length
      }

      this.stats.totalEntries = totalEntries
      this.stats.totalSize = totalSize
    } catch (error) {
      console.error('Failed to update cache stats:', error)
    }
  }

  /**
   * Remove oldest entries to free up space
   */
  private async removeOldestEntries(): Promise<void> {
    if (!this.db) return

    try {
      const tx = this.db.transaction('cache', 'readwrite')
      const index = tx.store.index('by-timestamp')
      let removedSize = 0
      const targetSize = this.config.maxSize * 1024 * 1024 * 0.8 // Remove to 80% of max

      for await (const cursor of index.iterate()) {
        const entrySize = JSON.stringify(cursor.value).length
        await cursor.delete()
        removedSize += entrySize

        if (this.stats.totalSize - removedSize <= targetSize) {
          break
        }
      }

      await tx.done
    } catch (error) {
      console.error('Failed to remove oldest entries:', error)
    }
  }
}

// Singleton instance
export const cacheManager = CacheManager.getInstance()