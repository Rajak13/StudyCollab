import Database from 'better-sqlite3';
import { app, net } from 'electron';
import Store from 'electron-store';
import { EventEmitter } from 'events';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Typed surface of electron-store that we use
interface ElectronStoreLike<T> {
  get: (key: string, defaultValue?: unknown) => unknown;
  set: (key: string, value: unknown) => void;
  delete: (key: keyof T | string) => void;
  clear: () => void;
  store: T;
}

interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: unknown;
  timestamp: number;
  userId?: string;
  retryCount?: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
  syncError?: string;
  lastSyncAttempt?: Date;
}

interface AppData {
  notes: Record<string, unknown>;
  tasks: Record<string, unknown>;
  files: Record<string, unknown>;
  studyGroups: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface SyncQueueData {
  changes: OfflineChange[];
}

interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolvedData?: unknown;
}

interface OfflineEntity {
  id: string;
  type: string;
  data: string; // JSON stringified data
  lastModified: number;
  version: number;
  isDeleted: boolean;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

export class OfflineDataManager extends EventEmitter {
  private store: Store<AppData>;
  private syncQueue: Store<SyncQueueData>;
  private db: Database.Database | null = null;
  private isOnline: boolean = false;
  private lastSync: Date | null = null;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkCheckInterval: NodeJS.Timeout | null = null;
  private syncError: string | null = null;
  private lastSyncAttempt: Date | null = null;
  private maxRetries: number = 3;

  constructor() {
    super();

    this.store = new Store<AppData>({
      defaults: {
        notes: {},
        tasks: {},
        files: {},
        studyGroups: {},
        settings: {},
      },
    });

    this.syncQueue = new Store<SyncQueueData>({
      defaults: {
        changes: [],
      },
    });
  }

  async initialize() {
    // Initialize SQLite database
    try {
      await this.initializeDatabase();
    } catch (error) {
      console.warn('SQLite database initialization failed, running without offline support:', error);
      // Continue without SQLite - app will work in online-only mode
    }

    // Check initial online status
    this.isOnline = net.isOnline();

    // Set up online/offline detection
    this.setupNetworkDetection();

    // Start periodic sync
    this.startPeriodicSync();

    // Sync on startup if online
    if (this.isOnline) {
      await this.syncWithServer();
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = join(userDataPath, 'offline-data.db');

      // Ensure directory exists
      if (!existsSync(userDataPath)) {
        mkdirSync(userDataPath, { recursive: true });
      }

      this.db = new Database(dbPath);

      // Create tables for offline data storage
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS entities (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          data TEXT NOT NULL,
          last_modified INTEGER NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          is_deleted INTEGER NOT NULL DEFAULT 0,
          sync_status TEXT NOT NULL DEFAULT 'pending'
        );
        
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          data TEXT,
          timestamp INTEGER NOT NULL,
          user_id TEXT,
          retry_count INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
        CREATE INDEX IF NOT EXISTS idx_entities_sync_status ON entities(sync_status);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
      `);

      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private setupNetworkDetection() {
    // Check network status periodically
    setInterval(() => {
      const wasOnline = this.isOnline;
      this.isOnline = net.isOnline();

      if (!wasOnline && this.isOnline) {
        this.emit('online');
        this.syncWithServer();
      } else if (wasOnline && !this.isOnline) {
        this.emit('offline');
      }
    }, 5000);
  }

  private startPeriodicSync() {
    // Sync every 5 minutes when online (reduced from 30 seconds to prevent spam)
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        // Only sync in development mode for now since API endpoints don't exist
        if (process.env.NODE_ENV === 'development') {
          this.syncWithServer();
        }
      }
    }, 300000); // 5 minutes
  }

  async getData(key: string): Promise<unknown> {
    if (this.db) {
      try {
        const stmt = this.db.prepare('SELECT data FROM entities WHERE id = ? AND is_deleted = 0');
        const result = stmt.get(key) as { data: string } | undefined;
        if (result) {
          return JSON.parse(result.data);
        }
      } catch (error) {
        console.warn('Failed to get data from SQLite, falling back to electron-store:', error);
      }
    }

    // Fallback to electron-store
    const store = this.store as unknown as ElectronStoreLike<AppData>;
    return store.get(key);
  }

  async setData(key: string, value: unknown, entityType: string = 'general'): Promise<void> {
    const timestamp = Date.now();

    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO entities (id, type, entity_id, data, last_modified, version, sync_status)
          VALUES (?, ?, ?, ?, ?, 
            COALESCE((SELECT version + 1 FROM entities WHERE id = ?), 1),
            'pending')
        `);
        stmt.run(key, entityType, key, JSON.stringify(value), timestamp, key);
      } catch (error) {
        console.warn('Failed to save to SQLite, using electron-store:', error);
      }
    }

    // Also save to electron-store as backup
    const store = this.store as unknown as ElectronStoreLike<AppData>;
    store.set(key, value);

    // Queue change for sync
    this.queueChange({
      id: `${key}-${timestamp}`,
      type: 'update',
      entity: entityType,
      entityId: key,
      data: value,
      timestamp,
    });
  }

  async removeData(key: string, entityType: string = 'general'): Promise<void> {
    const timestamp = Date.now();

    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          UPDATE entities 
          SET is_deleted = 1, last_modified = ?, sync_status = 'pending'
          WHERE id = ?
        `);
        stmt.run(timestamp, key);
      } catch (error) {
        console.warn('Failed to mark as deleted in SQLite:', error);
      }
    }

    // Also remove from electron-store
    const store = this.store as unknown as ElectronStoreLike<AppData>;
    store.delete(key as keyof AppData);

    // Queue change for sync
    this.queueChange({
      id: `${key}-${timestamp}`,
      type: 'delete',
      entity: entityType,
      entityId: key,
      data: null,
      timestamp,
    });
  }

  async getDataByType(entityType: string): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    if (this.db) {
      try {
        const stmt = this.db.prepare('SELECT id, data FROM entities WHERE type = ? AND is_deleted = 0');
        const rows = stmt.all(entityType) as { id: string; data: string }[];

        for (const row of rows) {
          result[row.id] = JSON.parse(row.data);
        }

        return result;
      } catch (error) {
        console.warn('Failed to get data by type from SQLite:', error);
      }
    }

    // Fallback to electron-store
    const store = this.store as unknown as ElectronStoreLike<AppData>;
    return (store.get(entityType, {}) as Record<string, unknown>) || {};
  }

  async clearData(): Promise<void> {
    if (this.db) {
      try {
        this.db.exec('DELETE FROM entities; DELETE FROM sync_queue;');
      } catch (error) {
        console.warn('Failed to clear SQLite data:', error);
      }
    }

    const store = this.store as unknown as ElectronStoreLike<AppData>;
    const queue = this.syncQueue as unknown as ElectronStoreLike<SyncQueueData>;
    store.clear();
    queue.set('changes', []);
  }

  async getConflictedEntities(): Promise<OfflineEntity[]> {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT id, type, entity_id, data, last_modified, version, is_deleted, sync_status
        FROM entities 
        WHERE sync_status = 'conflict'
      `);
      const rows = stmt.all() as Array<{
        id: string;
        type: string;
        entity_id: string;
        data: string;
        last_modified: number;
        version: number;
        is_deleted: number;
        sync_status: string;
      }>;

      return rows.map(row => ({
        id: row.id,
        type: row.type,
        data: row.data,
        lastModified: row.last_modified,
        version: row.version,
        isDeleted: Boolean(row.is_deleted),
        syncStatus: row.sync_status as 'pending' | 'synced' | 'conflict',
      }));
    } catch (error) {
      console.error('Failed to get conflicted entities:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }

    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        console.error('Failed to close SQLite database:', error);
      }
    }
  }

  private queueChange(change: OfflineChange) {
    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO sync_queue (id, type, entity, entity_id, data, timestamp, user_id, retry_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          change.id,
          change.type,
          change.entity,
          change.entityId,
          JSON.stringify(change.data),
          change.timestamp,
          change.userId || null,
          change.retryCount || 0
        );
      } catch (error) {
        console.warn('Failed to queue change in SQLite, using electron-store:', error);
        // Fallback to electron-store
        const queue = this.syncQueue as unknown as ElectronStoreLike<SyncQueueData>;
        const changes = queue.get('changes', []) as OfflineChange[];
        changes.push(change);
        queue.set('changes', changes);
      }
    } else {
      // Fallback to electron-store
      const queue = this.syncQueue as unknown as ElectronStoreLike<SyncQueueData>;
      const changes = queue.get('changes', []) as OfflineChange[];
      changes.push(change);
      queue.set('changes', changes);
    }

    this.emit('change-queued', change);
  }

  private async getQueuedChanges(): Promise<OfflineChange[]> {
    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          SELECT id, type, entity, entity_id, data, timestamp, user_id, retry_count
          FROM sync_queue 
          ORDER BY timestamp ASC
        `);
        const rows = stmt.all() as Array<{
          id: string;
          type: string;
          entity: string;
          entity_id: string;
          data: string;
          timestamp: number;
          user_id: string | null;
          retry_count: number;
        }>;

        return rows.map(row => ({
          id: row.id,
          type: row.type as 'create' | 'update' | 'delete',
          entity: row.entity,
          entityId: row.entity_id,
          data: row.data ? JSON.parse(row.data) : null,
          timestamp: row.timestamp,
          userId: row.user_id || undefined,
          retryCount: row.retry_count,
        }));
      } catch (error) {
        console.warn('Failed to get queued changes from SQLite:', error);
      }
    }

    // Fallback to electron-store
    const queue = this.syncQueue as unknown as ElectronStoreLike<SyncQueueData>;
    return queue.get('changes', []) as OfflineChange[];
  }

  private async clearQueuedChanges(changeIds: string[]): Promise<void> {
    if (this.db && changeIds.length > 0) {
      try {
        const placeholders = changeIds.map(() => '?').join(',');
        const stmt = this.db.prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`);
        stmt.run(...changeIds);
      } catch (error) {
        console.warn('Failed to clear queued changes from SQLite:', error);
      }
    }

    // Also clear from electron-store
    const queue = this.syncQueue as unknown as ElectronStoreLike<SyncQueueData>;
    queue.set('changes', []);
  }

  async triggerSync(): Promise<void> {
    if (this.isOnline && !this.isSyncing) {
      await this.syncWithServer();
    }
  }

  private async syncWithServer(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    this.lastSyncAttempt = new Date();
    this.syncError = null;
    this.emit('sync-start');

    try {
      const changes = await this.getQueuedChanges();

      if (changes.length > 0) {
        // Send changes to server with retry logic
        const processedChangeIds = await this.sendChangesToServer(changes);

        // Clear successfully processed changes
        if (processedChangeIds.length > 0) {
          await this.clearQueuedChanges(processedChangeIds);
        }
      }

      // Fetch latest data from server
      await this.fetchLatestDataFromServer();

      this.lastSync = new Date();
      this.emit('sync-success');

    } catch (error) {
      this.syncError = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('Sync failed:', error);
      this.emit('sync-error', error);
    } finally {
      this.isSyncing = false;
      this.emit('sync-end');
    }
  }

  private async sendChangesToServer(changes: OfflineChange[]): Promise<string[]> {
    const processedChangeIds: string[] = [];

    for (const change of changes) {
      try {
        // Skip changes that have exceeded max retries
        if ((change.retryCount || 0) >= this.maxRetries) {
          console.warn(`Change ${change.id} exceeded max retries, skipping`);
          processedChangeIds.push(change.id);
          continue;
        }

        // Check if the API endpoint exists before making the request
        const response = await fetch('http://localhost:3000/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(change),
        });

        if (response.ok) {
          processedChangeIds.push(change.id);

          // Update entity sync status in SQLite
          if (this.db) {
            const stmt = this.db.prepare(`
              UPDATE entities 
              SET sync_status = 'synced' 
              WHERE entity_id = ? AND type = ?
            `);
            stmt.run(change.entityId, change.entity);
          }
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          console.warn(`Client error for change ${change.id}: ${response.status}`);
          processedChangeIds.push(change.id);
        } else {
          // Server error - increment retry count
          await this.incrementRetryCount(change.id);
        }
      } catch (error) {
        console.warn(`Network error for change ${change.id}:`, error);
        // Network error - increment retry count
        await this.incrementRetryCount(change.id);
      }
    }

    return processedChangeIds;
  }

  private async incrementRetryCount(changeId: string): Promise<void> {
    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          UPDATE sync_queue 
          SET retry_count = retry_count + 1 
          WHERE id = ?
        `);
        stmt.run(changeId);
      } catch (error) {
        console.warn('Failed to increment retry count:', error);
      }
    }
  }

  private async fetchLatestDataFromServer(): Promise<void> {
    try {
      const response = await fetch('http://localhost:3000/api/sync/latest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const serverData = await response.json() as Record<string, { id: string; data: unknown; updatedAt: number }>;

        // Process each entity and detect conflicts
        for (const [entityId, serverEntity] of Object.entries(serverData)) {
          const localData = await this.getData(entityId);

          if (localData) {
            // Check for conflicts
            const localTimestamp = (localData as Record<string, unknown>)?.updatedAt as number || 0;
            const serverTimestamp = serverEntity.updatedAt || 0;

            if (Math.abs(localTimestamp - serverTimestamp) > 1000) { // 1 second tolerance
              // Conflict detected - resolve it
              const resolvedData = this.resolveConflict(localData, serverEntity.data);
              await this.setData(entityId, resolvedData, 'synced');

              if (this.db) {
                const stmt = this.db.prepare(`
                  UPDATE entities 
                  SET sync_status = 'conflict' 
                  WHERE entity_id = ?
                `);
                stmt.run(entityId);
              }
            } else {
              // No conflict - update with server data
              await this.setData(entityId, serverEntity.data, 'synced');
            }
          } else {
            // New data from server
            await this.setData(entityId, serverEntity.data, 'synced');
          }
        }

        // Also update electron-store as backup
        const store = this.store as unknown as ElectronStoreLike<AppData>;
        Object.keys(serverData).forEach(key => {
          store.set(key, serverData[key].data);
        });
      } else {
        console.warn('Sync latest endpoint not available');
      }
    } catch (error) {
      console.warn('Failed to fetch latest data (endpoint may not exist):', error);
      // Don't throw here, as we can continue with local data
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    let pendingChanges = 0;

    if (this.db) {
      try {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM sync_queue');
        const result = stmt.get() as { count: number };
        pendingChanges = result.count;
      } catch (error) {
        console.warn('Failed to get pending changes count from SQLite:', error);
        // Fallback to electron-store
        const queue = this.syncQueue as unknown as ElectronStoreLike<SyncQueueData>;
        const changes = queue.get('changes', []) as OfflineChange[];
        pendingChanges = changes.length;
      }
    } else {
      const queue = this.syncQueue as unknown as ElectronStoreLike<SyncQueueData>;
      const changes = queue.get('changes', []) as OfflineChange[];
      pendingChanges = changes.length;
    }

    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      pendingChanges,
      isSyncing: this.isSyncing,
      syncError: this.syncError || undefined,
      lastSyncAttempt: this.lastSyncAttempt || undefined,
    };
  }

  syncBeforeQuit(): void {
    // Attempt final sync if online
    if (this.isOnline && !this.isSyncing) {
      // Use synchronous approach for app quit
      this.syncWithServer().catch(console.error);
    }

    // Cleanup resources
    this.cleanup().catch(console.error);
  }

  // Conflict resolution methods
  private resolveConflict(localData: unknown, serverData: unknown, strategy: ConflictResolution['strategy'] = 'local'): unknown {
    switch (strategy) {
      case 'remote':
        return serverData;
      case 'local':
        return localData;
      case 'merge':
        // Simple merge strategy - merge objects if both are objects
        if (typeof localData === 'object' && typeof serverData === 'object' && localData && serverData) {
          return { ...localData as Record<string, unknown>, ...serverData as Record<string, unknown> };
        }
        // Fall back to timestamp-based resolution
        return this.resolveByTimestamp(localData, serverData);
      case 'manual':
        // Emit conflict event for manual resolution
        this.emit('conflict-detected', { localData, serverData });
        return localData; // Keep local until manually resolved
      default:
        return this.resolveByTimestamp(localData, serverData);
    }
  }

  private resolveByTimestamp(localData: unknown, serverData: unknown): unknown {
    const localTimestamp = (localData as Record<string, unknown>)?.updatedAt as number || 0;
    const serverTimestamp = (serverData as Record<string, unknown>)?.updatedAt as number || 0;

    if (localTimestamp > serverTimestamp) {
      return localData;
    } else {
      return serverData;
    }
  }

  async resolveConflictManually(entityId: string, resolvedData: unknown): Promise<void> {
    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          UPDATE entities 
          SET data = ?, sync_status = 'pending', last_modified = ?
          WHERE entity_id = ?
        `);
        stmt.run(JSON.stringify(resolvedData), Date.now(), entityId);

        // Queue the resolved data for sync
        this.queueChange({
          id: `${entityId}-resolved-${Date.now()}`,
          type: 'update',
          entity: 'resolved',
          entityId,
          data: resolvedData,
          timestamp: Date.now(),
        });

        this.emit('conflict-resolved', { entityId, resolvedData });
      } catch (error) {
        console.error('Failed to resolve conflict manually:', error);
        throw error;
      }
    }
  }

  // Backup and restore methods
  async createBackup(): Promise<string> {
    const store = this.store as unknown as ElectronStoreLike<AppData>;
    const allData = store.store;
    const backupData = {
      data: allData,
      timestamp: new Date().toISOString(),
      version: '1.0.0', // Replace with actual app version if available
    };

    return JSON.stringify(backupData, null, 2);
  }

  async restoreFromBackup(backupString: string): Promise<void> {
    try {
      const backupData = JSON.parse(backupString) as { data: Record<string, unknown> };

      if (backupData.data) {
        // Clear existing data
        const store = this.store as unknown as ElectronStoreLike<AppData>;
        store.clear();

        // Restore data
        Object.keys(backupData.data).forEach(key => {
          store.set(key, backupData.data[key]);
        });

        this.emit('backup-restored');
      }
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error}`);
    }
  }
}