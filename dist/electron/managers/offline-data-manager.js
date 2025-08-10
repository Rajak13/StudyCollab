"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineDataManager = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const events_1 = require("events");
const fs_1 = require("fs");
const path_1 = require("path");
class OfflineDataManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.db = null;
        this.isOnline = false;
        this.lastSync = null;
        this.isSyncing = false;
        this.syncInterval = null;
        this.networkCheckInterval = null;
        this.syncError = null;
        this.lastSyncAttempt = null;
        this.maxRetries = 3;
        this.store = new electron_store_1.default({
            defaults: {
                notes: {},
                tasks: {},
                files: {},
                studyGroups: {},
                settings: {},
            },
        });
        this.syncQueue = new electron_store_1.default({
            defaults: {
                changes: [],
            },
        });
    }
    async initialize() {
        // Initialize SQLite database
        await this.initializeDatabase();
        // Check initial online status
        this.isOnline = electron_1.net.isOnline();
        // Set up online/offline detection
        this.setupNetworkDetection();
        // Start periodic sync
        this.startPeriodicSync();
        // Sync on startup if online
        if (this.isOnline) {
            await this.syncWithServer();
        }
    }
    async initializeDatabase() {
        try {
            const userDataPath = electron_1.app.getPath('userData');
            const dbPath = (0, path_1.join)(userDataPath, 'offline-data.db');
            // Ensure directory exists
            if (!(0, fs_1.existsSync)(userDataPath)) {
                (0, fs_1.mkdirSync)(userDataPath, { recursive: true });
            }
            this.db = new better_sqlite3_1.default(dbPath);
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
        }
        catch (error) {
            console.error('Failed to initialize SQLite database:', error);
            throw error;
        }
    }
    setupNetworkDetection() {
        // Check network status periodically
        setInterval(() => {
            const wasOnline = this.isOnline;
            this.isOnline = electron_1.net.isOnline();
            if (!wasOnline && this.isOnline) {
                this.emit('online');
                this.syncWithServer();
            }
            else if (wasOnline && !this.isOnline) {
                this.emit('offline');
            }
        }, 5000);
    }
    startPeriodicSync() {
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
    async getData(key) {
        if (this.db) {
            try {
                const stmt = this.db.prepare('SELECT data FROM entities WHERE id = ? AND is_deleted = 0');
                const result = stmt.get(key);
                if (result) {
                    return JSON.parse(result.data);
                }
            }
            catch (error) {
                console.warn('Failed to get data from SQLite, falling back to electron-store:', error);
            }
        }
        // Fallback to electron-store
        const store = this.store;
        return store.get(key);
    }
    async setData(key, value, entityType = 'general') {
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
            }
            catch (error) {
                console.warn('Failed to save to SQLite, using electron-store:', error);
            }
        }
        // Also save to electron-store as backup
        const store = this.store;
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
    async removeData(key, entityType = 'general') {
        const timestamp = Date.now();
        if (this.db) {
            try {
                const stmt = this.db.prepare(`
          UPDATE entities 
          SET is_deleted = 1, last_modified = ?, sync_status = 'pending'
          WHERE id = ?
        `);
                stmt.run(timestamp, key);
            }
            catch (error) {
                console.warn('Failed to mark as deleted in SQLite:', error);
            }
        }
        // Also remove from electron-store
        const store = this.store;
        store.delete(key);
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
    async getDataByType(entityType) {
        const result = {};
        if (this.db) {
            try {
                const stmt = this.db.prepare('SELECT id, data FROM entities WHERE type = ? AND is_deleted = 0');
                const rows = stmt.all(entityType);
                for (const row of rows) {
                    result[row.id] = JSON.parse(row.data);
                }
                return result;
            }
            catch (error) {
                console.warn('Failed to get data by type from SQLite:', error);
            }
        }
        // Fallback to electron-store
        const store = this.store;
        return store.get(entityType, {}) || {};
    }
    async clearData() {
        if (this.db) {
            try {
                this.db.exec('DELETE FROM entities; DELETE FROM sync_queue;');
            }
            catch (error) {
                console.warn('Failed to clear SQLite data:', error);
            }
        }
        const store = this.store;
        const queue = this.syncQueue;
        store.clear();
        queue.set('changes', []);
    }
    async getConflictedEntities() {
        if (!this.db)
            return [];
        try {
            const stmt = this.db.prepare(`
        SELECT id, type, entity_id, data, last_modified, version, is_deleted, sync_status
        FROM entities 
        WHERE sync_status = 'conflict'
      `);
            const rows = stmt.all();
            return rows.map(row => ({
                id: row.id,
                type: row.type,
                data: row.data,
                lastModified: row.last_modified,
                version: row.version,
                isDeleted: Boolean(row.is_deleted),
                syncStatus: row.sync_status,
            }));
        }
        catch (error) {
            console.error('Failed to get conflicted entities:', error);
            return [];
        }
    }
    async cleanup() {
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
            }
            catch (error) {
                console.error('Failed to close SQLite database:', error);
            }
        }
    }
    queueChange(change) {
        if (this.db) {
            try {
                const stmt = this.db.prepare(`
          INSERT INTO sync_queue (id, type, entity, entity_id, data, timestamp, user_id, retry_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
                stmt.run(change.id, change.type, change.entity, change.entityId, JSON.stringify(change.data), change.timestamp, change.userId || null, change.retryCount || 0);
            }
            catch (error) {
                console.warn('Failed to queue change in SQLite, using electron-store:', error);
                // Fallback to electron-store
                const queue = this.syncQueue;
                const changes = queue.get('changes', []);
                changes.push(change);
                queue.set('changes', changes);
            }
        }
        else {
            // Fallback to electron-store
            const queue = this.syncQueue;
            const changes = queue.get('changes', []);
            changes.push(change);
            queue.set('changes', changes);
        }
        this.emit('change-queued', change);
    }
    async getQueuedChanges() {
        if (this.db) {
            try {
                const stmt = this.db.prepare(`
          SELECT id, type, entity, entity_id, data, timestamp, user_id, retry_count
          FROM sync_queue 
          ORDER BY timestamp ASC
        `);
                const rows = stmt.all();
                return rows.map(row => ({
                    id: row.id,
                    type: row.type,
                    entity: row.entity,
                    entityId: row.entity_id,
                    data: row.data ? JSON.parse(row.data) : null,
                    timestamp: row.timestamp,
                    userId: row.user_id || undefined,
                    retryCount: row.retry_count,
                }));
            }
            catch (error) {
                console.warn('Failed to get queued changes from SQLite:', error);
            }
        }
        // Fallback to electron-store
        const queue = this.syncQueue;
        return queue.get('changes', []);
    }
    async clearQueuedChanges(changeIds) {
        if (this.db && changeIds.length > 0) {
            try {
                const placeholders = changeIds.map(() => '?').join(',');
                const stmt = this.db.prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`);
                stmt.run(...changeIds);
            }
            catch (error) {
                console.warn('Failed to clear queued changes from SQLite:', error);
            }
        }
        // Also clear from electron-store
        const queue = this.syncQueue;
        queue.set('changes', []);
    }
    async triggerSync() {
        if (this.isOnline && !this.isSyncing) {
            await this.syncWithServer();
        }
    }
    async syncWithServer() {
        if (this.isSyncing)
            return;
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
        }
        catch (error) {
            this.syncError = error instanceof Error ? error.message : 'Unknown sync error';
            console.error('Sync failed:', error);
            this.emit('sync-error', error);
        }
        finally {
            this.isSyncing = false;
            this.emit('sync-end');
        }
    }
    async sendChangesToServer(changes) {
        const processedChangeIds = [];
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
                }
                else if (response.status >= 400 && response.status < 500) {
                    // Client error - don't retry
                    console.warn(`Client error for change ${change.id}: ${response.status}`);
                    processedChangeIds.push(change.id);
                }
                else {
                    // Server error - increment retry count
                    await this.incrementRetryCount(change.id);
                }
            }
            catch (error) {
                console.warn(`Network error for change ${change.id}:`, error);
                // Network error - increment retry count
                await this.incrementRetryCount(change.id);
            }
        }
        return processedChangeIds;
    }
    async incrementRetryCount(changeId) {
        if (this.db) {
            try {
                const stmt = this.db.prepare(`
          UPDATE sync_queue 
          SET retry_count = retry_count + 1 
          WHERE id = ?
        `);
                stmt.run(changeId);
            }
            catch (error) {
                console.warn('Failed to increment retry count:', error);
            }
        }
    }
    async fetchLatestDataFromServer() {
        try {
            const response = await fetch('http://localhost:3000/api/sync/latest', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const serverData = await response.json();
                // Process each entity and detect conflicts
                for (const [entityId, serverEntity] of Object.entries(serverData)) {
                    const localData = await this.getData(entityId);
                    if (localData) {
                        // Check for conflicts
                        const localTimestamp = localData?.updatedAt || 0;
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
                        }
                        else {
                            // No conflict - update with server data
                            await this.setData(entityId, serverEntity.data, 'synced');
                        }
                    }
                    else {
                        // New data from server
                        await this.setData(entityId, serverEntity.data, 'synced');
                    }
                }
                // Also update electron-store as backup
                const store = this.store;
                Object.keys(serverData).forEach(key => {
                    store.set(key, serverData[key].data);
                });
            }
            else {
                console.warn('Sync latest endpoint not available');
            }
        }
        catch (error) {
            console.warn('Failed to fetch latest data (endpoint may not exist):', error);
            // Don't throw here, as we can continue with local data
        }
    }
    async getSyncStatus() {
        let pendingChanges = 0;
        if (this.db) {
            try {
                const stmt = this.db.prepare('SELECT COUNT(*) as count FROM sync_queue');
                const result = stmt.get();
                pendingChanges = result.count;
            }
            catch (error) {
                console.warn('Failed to get pending changes count from SQLite:', error);
                // Fallback to electron-store
                const queue = this.syncQueue;
                const changes = queue.get('changes', []);
                pendingChanges = changes.length;
            }
        }
        else {
            const queue = this.syncQueue;
            const changes = queue.get('changes', []);
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
    syncBeforeQuit() {
        // Attempt final sync if online
        if (this.isOnline && !this.isSyncing) {
            // Use synchronous approach for app quit
            this.syncWithServer().catch(console.error);
        }
        // Cleanup resources
        this.cleanup().catch(console.error);
    }
    // Conflict resolution methods
    resolveConflict(localData, serverData, strategy = 'local') {
        switch (strategy) {
            case 'remote':
                return serverData;
            case 'local':
                return localData;
            case 'merge':
                // Simple merge strategy - merge objects if both are objects
                if (typeof localData === 'object' && typeof serverData === 'object' && localData && serverData) {
                    return { ...localData, ...serverData };
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
    resolveByTimestamp(localData, serverData) {
        const localTimestamp = localData?.updatedAt || 0;
        const serverTimestamp = serverData?.updatedAt || 0;
        if (localTimestamp > serverTimestamp) {
            return localData;
        }
        else {
            return serverData;
        }
    }
    async resolveConflictManually(entityId, resolvedData) {
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
            }
            catch (error) {
                console.error('Failed to resolve conflict manually:', error);
                throw error;
            }
        }
    }
    // Backup and restore methods
    async createBackup() {
        const store = this.store;
        const allData = store.store;
        const backupData = {
            data: allData,
            timestamp: new Date().toISOString(),
            version: '1.0.0', // Replace with actual app version if available
        };
        return JSON.stringify(backupData, null, 2);
    }
    async restoreFromBackup(backupString) {
        try {
            const backupData = JSON.parse(backupString);
            if (backupData.data) {
                // Clear existing data
                const store = this.store;
                store.clear();
                // Restore data
                Object.keys(backupData.data).forEach(key => {
                    store.set(key, backupData.data[key]);
                });
                this.emit('backup-restored');
            }
        }
        catch (error) {
            throw new Error(`Failed to restore backup: ${error}`);
        }
    }
}
exports.OfflineDataManager = OfflineDataManager;
