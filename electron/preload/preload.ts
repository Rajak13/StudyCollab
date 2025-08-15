import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;

  // File operations
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  
  // System integration
  showItemInFolder: (fullPath: string) => void;
  openExternal: (url: string) => Promise<void>;
  
  // App info
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  
  // Offline data management
  getOfflineData: (key: string) => Promise<any>;
  setOfflineData: (key: string, value: any, entityType?: string) => Promise<void>;
  removeOfflineData: (key: string, entityType?: string) => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getDataByType: (entityType: string) => Promise<Record<string, any>>;
  getConflictedEntities: () => Promise<any[]>;
  resolveConflictManually: (entityId: string, resolvedData: any) => Promise<void>;
  
  // Sync operations
  triggerSync: () => void;
  getSyncStatus: () => Promise<{ isOnline: boolean; lastSync: Date | null; pendingChanges: number }>;
  
  // Notifications
  showNotification: (title: string, body: string, options?: any) => void;
  showSystemNotification: (options: any) => void;
  showReminderNotification: (title: string, body: string, reminderData?: any) => void;
  showGroupActivityNotification: (groupName: string, activity: string, userName?: string) => void;
  
  // Event listeners
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  once: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  
  // Auto-updater
  checkForUpdates: () => void;
  installUpdate: () => void;
  
  // Settings
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<void>;
  
  // File drag and drop
  startDrag: (filePath: string) => void;
  getDroppedFiles: (files: string[]) => Promise<any[]>;
  
  // Global shortcuts
  registerGlobalShortcut: (accelerator: string, action: string, description: string) => Promise<boolean>;
  unregisterGlobalShortcut: (accelerator: string) => void;
  getRegisteredShortcuts: () => Promise<any[]>;
  
  // File associations
  handleFileOpen: (filePath: string) => void;
  handleProtocolUrl: (url: string) => void;
  
  // Branding operations
  setWindowTitle: (title: string) => Promise<void>;
  setWindowIcon: (iconPath: string) => Promise<void>;
  setTrayIcon: (iconPath: string) => Promise<void>;
  setTrayTooltip: (tooltip: string) => Promise<void>;
  setAppName: (name: string) => Promise<void>;
  readConfigFile: (fileName: string) => Promise<string | null>;
  writeConfigFile: (fileName: string, content: string) => Promise<void>;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // File operations
  showOpenDialog: (options: Electron.OpenDialogOptions) => 
    ipcRenderer.invoke('dialog-open', options),
  showSaveDialog: (options: Electron.SaveDialogOptions) => 
    ipcRenderer.invoke('dialog-save', options),
  readFile: (filePath: string) => ipcRenderer.invoke('file-read', filePath),
  writeFile: (filePath: string, content: string) => 
    ipcRenderer.invoke('file-write', filePath, content),
  
  // System integration
  showItemInFolder: (fullPath: string) => ipcRenderer.invoke('show-item-in-folder', fullPath),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app-get-version'),
  getPlatform: () => ipcRenderer.invoke('app-get-platform'),
  
  // Offline data management
  getOfflineData: (key: string) => ipcRenderer.invoke('offline-data-get', key),
  setOfflineData: (key: string, value: any, entityType?: string) => 
    ipcRenderer.invoke('offline-data-set', key, value, entityType),
  removeOfflineData: (key: string, entityType?: string) => 
    ipcRenderer.invoke('offline-data-remove', key, entityType),
  clearOfflineData: () => ipcRenderer.invoke('offline-data-clear'),
  getDataByType: (entityType: string) => ipcRenderer.invoke('offline-data-get-by-type', entityType),
  getConflictedEntities: () => ipcRenderer.invoke('offline-data-get-conflicts'),
  resolveConflictManually: (entityId: string, resolvedData: any) => 
    ipcRenderer.invoke('offline-data-resolve-conflict', entityId, resolvedData),
  
  // Sync operations
  triggerSync: () => ipcRenderer.send('trigger-sync'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
  
  // Notifications
  showNotification: (title: string, body: string, options?: any) => 
    ipcRenderer.send('show-notification', title, body, options),
  showSystemNotification: (options: any) => 
    ipcRenderer.send('show-system-notification', options),
  showReminderNotification: (title: string, body: string, reminderData?: any) => 
    ipcRenderer.send('show-reminder-notification', title, body, reminderData),
  showGroupActivityNotification: (groupName: string, activity: string, userName?: string) => 
    ipcRenderer.send('show-group-activity-notification', groupName, activity, userName),
  
  // Event listeners
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.off(channel, callback);
  },
  once: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.once(channel, callback);
  },
  
  // Auto-updater
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  installUpdate: () => ipcRenderer.send('install-update'),
  
  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings-get', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings-set', key, value),
  
  // File drag and drop
  startDrag: (filePath: string) => ipcRenderer.send('start-drag', filePath),
  getDroppedFiles: (files: string[]) => ipcRenderer.invoke('get-dropped-files', files),
  
  // Global shortcuts
  registerGlobalShortcut: (accelerator: string, action: string, description: string) => 
    ipcRenderer.invoke('register-global-shortcut', accelerator, action, description),
  unregisterGlobalShortcut: (accelerator: string) => 
    ipcRenderer.send('unregister-global-shortcut', accelerator),
  getRegisteredShortcuts: () => ipcRenderer.invoke('get-registered-shortcuts'),
  
  // File associations
  handleFileOpen: (filePath: string) => ipcRenderer.send('handle-file-open', filePath),
  handleProtocolUrl: (url: string) => ipcRenderer.send('handle-protocol-url', url),
  
  // Branding operations
  setWindowTitle: (title: string) => ipcRenderer.invoke('branding-set-window-title', title),
  setWindowIcon: (iconPath: string) => ipcRenderer.invoke('branding-set-window-icon', iconPath),
  setTrayIcon: (iconPath: string) => ipcRenderer.invoke('branding-set-tray-icon', iconPath),
  setTrayTooltip: (tooltip: string) => ipcRenderer.invoke('branding-set-tray-tooltip', tooltip),
  setAppName: (name: string) => ipcRenderer.invoke('branding-set-app-name', name),
  readConfigFile: (fileName: string) => ipcRenderer.invoke('config-file-read', fileName),
  writeConfigFile: (fileName: string, content: string) => ipcRenderer.invoke('config-file-write', fileName, content),
} as ElectronAPI);

// Also expose a flag to indicate we're in Electron
contextBridge.exposeInMainWorld('isElectron', true);

// Expose Node.js process info (safely)
contextBridge.exposeInMainWorld('process', {
  platform: process.platform,
  versions: process.versions,
});