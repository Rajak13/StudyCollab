"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => electron_1.ipcRenderer.invoke('window-minimize'),
    maximize: () => electron_1.ipcRenderer.invoke('window-maximize'),
    close: () => electron_1.ipcRenderer.invoke('window-close'),
    isMaximized: () => electron_1.ipcRenderer.invoke('window-is-maximized'),
    // File operations
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('dialog-open', options),
    showSaveDialog: (options) => electron_1.ipcRenderer.invoke('dialog-save', options),
    readFile: (filePath) => electron_1.ipcRenderer.invoke('file-read', filePath),
    writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('file-write', filePath, content),
    // System integration
    showItemInFolder: (fullPath) => electron_1.ipcRenderer.invoke('show-item-in-folder', fullPath),
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
    // App info
    getVersion: () => electron_1.ipcRenderer.invoke('app-get-version'),
    getPlatform: () => electron_1.ipcRenderer.invoke('app-get-platform'),
    // Offline data management
    getOfflineData: (key) => electron_1.ipcRenderer.invoke('offline-data-get', key),
    setOfflineData: (key, value, entityType) => electron_1.ipcRenderer.invoke('offline-data-set', key, value, entityType),
    removeOfflineData: (key, entityType) => electron_1.ipcRenderer.invoke('offline-data-remove', key, entityType),
    clearOfflineData: () => electron_1.ipcRenderer.invoke('offline-data-clear'),
    getDataByType: (entityType) => electron_1.ipcRenderer.invoke('offline-data-get-by-type', entityType),
    getConflictedEntities: () => electron_1.ipcRenderer.invoke('offline-data-get-conflicts'),
    resolveConflictManually: (entityId, resolvedData) => electron_1.ipcRenderer.invoke('offline-data-resolve-conflict', entityId, resolvedData),
    // Sync operations
    triggerSync: () => electron_1.ipcRenderer.send('trigger-sync'),
    getSyncStatus: () => electron_1.ipcRenderer.invoke('get-sync-status'),
    // Notifications
    showNotification: (title, body, options) => electron_1.ipcRenderer.send('show-notification', title, body, options),
    showSystemNotification: (options) => electron_1.ipcRenderer.send('show-system-notification', options),
    showReminderNotification: (title, body, reminderData) => electron_1.ipcRenderer.send('show-reminder-notification', title, body, reminderData),
    showGroupActivityNotification: (groupName, activity, userName) => electron_1.ipcRenderer.send('show-group-activity-notification', groupName, activity, userName),
    // Event listeners
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, callback);
    },
    off: (channel, callback) => {
        electron_1.ipcRenderer.off(channel, callback);
    },
    once: (channel, callback) => {
        electron_1.ipcRenderer.once(channel, callback);
    },
    // Auto-updater
    checkForUpdates: () => electron_1.ipcRenderer.send('check-for-updates'),
    installUpdate: () => electron_1.ipcRenderer.send('install-update'),
    // Settings
    getSetting: (key) => electron_1.ipcRenderer.invoke('settings-get', key),
    setSetting: (key, value) => electron_1.ipcRenderer.invoke('settings-set', key, value),
    // File drag and drop
    startDrag: (filePath) => electron_1.ipcRenderer.send('start-drag', filePath),
    getDroppedFiles: (files) => electron_1.ipcRenderer.invoke('get-dropped-files', files),
    // Global shortcuts
    registerGlobalShortcut: (accelerator, action, description) => electron_1.ipcRenderer.invoke('register-global-shortcut', accelerator, action, description),
    unregisterGlobalShortcut: (accelerator) => electron_1.ipcRenderer.send('unregister-global-shortcut', accelerator),
    getRegisteredShortcuts: () => electron_1.ipcRenderer.invoke('get-registered-shortcuts'),
    // File associations
    handleFileOpen: (filePath) => electron_1.ipcRenderer.send('handle-file-open', filePath),
    handleProtocolUrl: (url) => electron_1.ipcRenderer.send('handle-protocol-url', url),
});
// Also expose a flag to indicate we're in Electron
electron_1.contextBridge.exposeInMainWorld('isElectron', true);
// Expose Node.js process info (safely)
electron_1.contextBridge.exposeInMainWorld('process', {
    platform: process.platform,
    versions: process.versions,
});
