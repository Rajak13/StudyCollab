// Offline capabilities and caching types

export interface CacheEntry<T = any> {
  id: string
  data: T
  timestamp: number
  expiresAt?: number
  version: number
  checksum: string
  encrypted: boolean
}

export interface SyncQueueItem {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  table: string
  data: any
  localId?: string
  timestamp: number
  retryCount: number
  maxRetries: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface OfflineState {
  isOnline: boolean
  isOfflineMode: boolean
  lastSyncTime: number | null
  syncInProgress: boolean
  pendingChanges: number
  cacheSize: number
  syncErrors: SyncError[]
}

export interface SyncError {
  id: string
  message: string
  timestamp: number
  type: 'NETWORK' | 'CONFLICT' | 'VALIDATION' | 'UNKNOWN'
  data?: any
}

export interface CacheConfig {
  maxSize: number // in MB
  defaultTTL: number // in milliseconds
  encryptSensitiveData: boolean
  syncInterval: number // in milliseconds
  retryAttempts: number
  compressionEnabled: boolean
}

export interface CacheStats {
  totalEntries: number
  totalSize: number // in bytes
  hitRate: number
  missRate: number
  lastCleanup: number
}

// Data types that can be cached
export type CacheableData = 
  | 'tasks'
  | 'notes' 
  | 'study-groups'
  | 'resources'
  | 'profiles'
  | 'categories'
  | 'folders'
  | 'files'

export interface CacheMetadata {
  type: CacheableData
  userId: string
  lastModified: number
  dependencies?: string[] // IDs of related cached items
  tags?: string[]
}

// Offline-specific database operations
export interface OfflineOperation {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  data: any
  where?: Record<string, any>
  timestamp: number
  userId: string
  conflictResolution: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL'
}

// Network status and connectivity
export interface NetworkStatus {
  online: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

// Sync strategies
export type SyncStrategy = 
  | 'IMMEDIATE' // Sync as soon as connection is available
  | 'BATCHED'   // Batch operations and sync periodically
  | 'MANUAL'    // Only sync when user initiates
  | 'SMART'     // Adaptive based on network conditions

export interface SyncOptions {
  strategy: SyncStrategy
  batchSize: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  conflictResolution: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL'
  retryOnFailure: boolean
}