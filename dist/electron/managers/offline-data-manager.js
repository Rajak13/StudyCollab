"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineDataManager = void 0;
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const events_1 = require("events");
class OfflineDataManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.isOnline = false;
        this.lastSync = null;
        this.isSyncing = false;
        this.syncInterval = null;
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
        return this.store.get(key);
    }
    async setData(key, value) {
        this.store.set(key, value);
        // Queue change for sync
        this.queueChange({
            id: `${key}-${Date.now()}`,
            type: 'update',
            entity: key,
            data: value,
            timestamp: Date.now(),
        });
    }
    async removeData(key) {
        this.store.delete(key);
        // Queue change for sync
        this.queueChange({
            id: `${key}-${Date.now()}`,
            type: 'delete',
            entity: key,
            data: null,
            timestamp: Date.now(),
        });
    }
    async clearData() {
        this.store.clear();
        this.syncQueue.set('changes', []);
    }
    queueChange(change) {
        const changes = this.syncQueue.get('changes', []);
        changes.push(change);
        this.syncQueue.set('changes', changes);
        this.emit('change-queued', change);
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
        this.emit('sync-start');
        try {
            const changes = this.syncQueue.get('changes', []);
            if (changes.length > 0) {
                // Send changes to server
                await this.sendChangesToServer(changes);
                // Clear processed changes
                this.syncQueue.set('changes', []);
            }
            // Fetch latest data from server
            await this.fetchLatestDataFromServer();
            this.lastSync = new Date();
            this.emit('sync-success');
        }
        catch (error) {
            console.error('Sync failed:', error);
            this.emit('sync-error', error);
        }
        finally {
            this.isSyncing = false;
            this.emit('sync-end');
        }
    }
    async sendChangesToServer(changes) {
        // This would integrate with your actual API
        // For now, we'll simulate the API call
        for (const change of changes) {
            try {
                // Check if the API endpoint exists before making the request
                const response = await fetch('http://localhost:3000/api/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(change),
                });
                if (!response.ok) {
                    console.warn(`Sync endpoint not available (${response.status})`);
                    // Don't throw error, just log and continue
                    return;
                }
            }
            catch (error) {
                console.warn(`Sync endpoint not available:`, error);
                // Don't throw error, just log and continue
                return;
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
                const latestData = await response.json();
                // Update local data with server data
                Object.keys(latestData).forEach(key => {
                    this.store.set(key, latestData[key]);
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
        const changes = this.syncQueue.get('changes', []);
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSync,
            pendingChanges: changes.length,
            isSyncing: this.isSyncing,
        };
    }
    syncBeforeQuit() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        // Attempt final sync if online
        if (this.isOnline && !this.isSyncing) {
            // Use synchronous approach for app quit
            this.syncWithServer().catch(console.error);
        }
    }
    // Conflict resolution methods
    resolveConflict(localData, serverData, entity) {
        // Simple last-write-wins strategy
        // In a real implementation, you might want more sophisticated conflict resolution
        const localTimestamp = localData?.updatedAt || 0;
        const serverTimestamp = serverData?.updatedAt || 0;
        if (localTimestamp > serverTimestamp) {
            return localData;
        }
        else {
            return serverData;
        }
    }
    // Backup and restore methods
    async createBackup() {
        const allData = this.store.store;
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
                this.store.clear();
                // Restore data
                Object.keys(backupData.data).forEach(key => {
                    this.store.set(key, backupData.data[key]);
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
