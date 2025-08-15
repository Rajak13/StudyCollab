import { useCallback, useEffect, useState } from 'react';

// Extend CSSProperties to include Electron-specific properties
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

// Electron type definitions
declare namespace Electron {
  interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
  }

  interface OpenDialogReturnValue {
    canceled: boolean;
    filePaths: string[];
  }

  interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }

  interface SaveDialogReturnValue {
    canceled: boolean;
    filePath?: string;
  }
}

// Type definitions for the Electron API
interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  showItemInFolder: (fullPath: string) => void;
  openExternal: (url: string) => Promise<void>;
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getOfflineData: (key: string) => Promise<any>;
  setOfflineData: (key: string, value: any, entityType?: string) => Promise<void>;
  removeOfflineData: (key: string, entityType?: string) => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getDataByType: (entityType: string) => Promise<Record<string, any>>;
  getConflictedEntities: () => Promise<any[]>;
  resolveConflictManually: (entityId: string, resolvedData: any) => Promise<void>;
  triggerSync: () => void;
  getSyncStatus: () => Promise<{ isOnline: boolean; lastSync: Date | null; pendingChanges: number; isSyncing?: boolean; syncError?: string }>;
  showNotification: (title: string, body: string, options?: NotificationOptions) => void;
  showSystemNotification: (options: any) => void;
  showReminderNotification: (title: string, body: string, reminderData?: any) => void;
  showGroupActivityNotification: (groupName: string, activity: string, userName?: string) => void;
  registerGlobalShortcut: (accelerator: string, action: string, description: string) => Promise<boolean>;
  unregisterGlobalShortcut: (accelerator: string) => void;
  getRegisteredShortcuts: () => Promise<any[]>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  unmaximizeWindow: () => void;
  closeWindow: () => void;
  getWindowState: () => Promise<{ isMaximized: boolean }>;
  onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => void;
  handleFileOpen: (filePath: string) => void;
  handleProtocolUrl: (url: string) => void;
  getDroppedFiles: (files: string[]) => Promise<any[]>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  once: (channel: string, callback: (...args: any[]) => void) => void;
  checkForUpdates: () => void;
  installUpdate: () => void;
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<void>;
  startDrag: (filePath: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    isElectron?: boolean;
    process?: {
      platform: string;
      versions: any;
    };
  }
}

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    const isElectronApp = window.isElectron === true;
    setIsElectron(isElectronApp);
    
    if (isElectronApp && window.electronAPI) {
      setElectronAPI(window.electronAPI);
    }
  }, []);

  return {
    isElectron,
    electronAPI,
  };
};

export const useElectronWindow = () => {
  const { isElectron, electronAPI } = useElectron();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const checkMaximized = async () => {
      const maximized = await electronAPI.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();

    // Listen for window state changes
    const handleWindowStateChange = () => {
      checkMaximized();
    };

    electronAPI.on('window-state-changed', handleWindowStateChange);

    return () => {
      electronAPI.off('window-state-changed', handleWindowStateChange);
    };
  }, [isElectron, electronAPI]);

  const minimize = useCallback(() => {
    if (electronAPI) {
      electronAPI.minimize();
    }
  }, [electronAPI]);

  const maximize = useCallback(() => {
    if (electronAPI) {
      electronAPI.maximize();
    }
  }, [electronAPI]);

  const close = useCallback(() => {
    if (electronAPI) {
      electronAPI.close();
    }
  }, [electronAPI]);

  return {
    isElectron,
    isMaximized,
    minimize,
    maximize,
    close,
  };
};

export const useElectronFile = () => {
  const { isElectron, electronAPI } = useElectron();

  const showOpenDialog = useCallback(async (options: Electron.OpenDialogOptions) => {
    if (!electronAPI) return { canceled: true, filePaths: [] };
    return await electronAPI.showOpenDialog(options);
  }, [electronAPI]);

  const showSaveDialog = useCallback(async (options: Electron.SaveDialogOptions) => {
    if (!electronAPI) return { canceled: true, filePath: undefined };
    return await electronAPI.showSaveDialog(options);
  }, [electronAPI]);

  const readFile = useCallback(async (filePath: string) => {
    if (!electronAPI) throw new Error('Electron API not available');
    return await electronAPI.readFile(filePath);
  }, [electronAPI]);

  const writeFile = useCallback(async (filePath: string, content: string) => {
    if (!electronAPI) throw new Error('Electron API not available');
    await electronAPI.writeFile(filePath, content);
  }, [electronAPI]);

  const showItemInFolder = useCallback((fullPath: string) => {
    if (electronAPI) {
      electronAPI.showItemInFolder(fullPath);
    }
  }, [electronAPI]);

  const openExternal = useCallback(async (url: string) => {
    if (electronAPI) {
      await electronAPI.openExternal(url);
    } else {
      // Fallback for web
      window.open(url, '_blank');
    }
  }, [electronAPI]);

  return {
    isElectron,
    showOpenDialog,
    showSaveDialog,
    readFile,
    writeFile,
    showItemInFolder,
    openExternal,
  };
};

export const useElectronSync = () => {
  const { isElectron, electronAPI } = useElectron();
  const [syncStatus, setSyncStatus] = useState<{
    syncError: any;
    isSyncing: any;
    isOnline: boolean;
    lastSync: Date | null;
    pendingChanges: number;
  }>({
    isOnline: true,
    lastSync: null,
    pendingChanges: 0,
  });

  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const updateSyncStatus = async () => {
      try {
        const status = await electronAPI.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    updateSyncStatus();

    // Listen for sync events
    const handleSyncStart = () => {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    };

    const handleSyncEnd = () => {
      updateSyncStatus();
    };

    electronAPI.on('sync-start', handleSyncStart);
    electronAPI.on('sync-end', handleSyncEnd);

    // Update sync status periodically
    const interval = setInterval(updateSyncStatus, 10000);

    return () => {
      electronAPI.off('sync-start', handleSyncStart);
      electronAPI.off('sync-end', handleSyncEnd);
      clearInterval(interval);
    };
  }, [isElectron, electronAPI]);

  const triggerSync = useCallback(() => {
    if (electronAPI) {
      electronAPI.triggerSync();
    }
  }, [electronAPI]);

  return {
    isElectron,
    syncStatus,
    triggerSync,
  };
};

export const useElectronSettings = () => {
  const { isElectron, electronAPI } = useElectron();

  const getSetting = useCallback(async (key: string) => {
    if (!electronAPI) return null;
    return await electronAPI.getSetting(key);
  }, [electronAPI]);

  const setSetting = useCallback(async (key: string, value: any) => {
    if (!electronAPI) return;
    await electronAPI.setSetting(key, value);
  }, [electronAPI]);

  return {
    isElectron,
    getSetting,
    setSetting,
  };
};

export const useElectronUpdater = () => {
  const { isElectron, electronAPI } = useElectron();
  const [updateStatus, setUpdateStatus] = useState<{
    checking: boolean;
    available: boolean;
    downloaded: boolean;
    error: string | null;
  }>({
    checking: false,
    available: false,
    downloaded: false,
    error: null,
  });

  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const handleUpdateChecking = () => {
      setUpdateStatus(prev => ({ ...prev, checking: true, error: null }));
    };

    const handleUpdateAvailable = () => {
      setUpdateStatus(prev => ({ ...prev, checking: false, available: true }));
    };

    const handleUpdateNotAvailable = () => {
      setUpdateStatus(prev => ({ ...prev, checking: false, available: false }));
    };

    const handleUpdateDownloaded = () => {
      setUpdateStatus(prev => ({ ...prev, downloaded: true }));
    };

    const handleUpdateError = (error: string) => {
      setUpdateStatus(prev => ({ ...prev, checking: false, error }));
    };

    electronAPI.on('update-checking', handleUpdateChecking);
    electronAPI.on('update-available', handleUpdateAvailable);
    electronAPI.on('update-not-available', handleUpdateNotAvailable);
    electronAPI.on('update-downloaded', handleUpdateDownloaded);
    electronAPI.on('update-error', handleUpdateError);

    return () => {
      electronAPI.off('update-checking', handleUpdateChecking);
      electronAPI.off('update-available', handleUpdateAvailable);
      electronAPI.off('update-not-available', handleUpdateNotAvailable);
      electronAPI.off('update-downloaded', handleUpdateDownloaded);
      electronAPI.off('update-error', handleUpdateError);
    };
  }, [isElectron, electronAPI]);

  const checkForUpdates = useCallback(() => {
    if (electronAPI) {
      electronAPI.checkForUpdates();
    }
  }, [electronAPI]);

  const installUpdate = useCallback(() => {
    if (electronAPI) {
      electronAPI.installUpdate();
    }
  }, [electronAPI]);

  return {
    isElectron,
    updateStatus,
    checkForUpdates,
    installUpdate,
  };
};

export const useElectronOfflineData = () => {
  const { isElectron, electronAPI } = useElectron();

  const getData = useCallback(async (key: string) => {
    if (!electronAPI) return null;
    return await electronAPI.getOfflineData(key);
  }, [electronAPI]);

  const setData = useCallback(async (key: string, value: any, entityType?: string) => {
    if (!electronAPI) return;
    await electronAPI.setOfflineData(key, value, entityType);
  }, [electronAPI]);

  const removeData = useCallback(async (key: string, entityType?: string) => {
    if (!electronAPI) return;
    await electronAPI.removeOfflineData(key, entityType);
  }, [electronAPI]);

  const clearData = useCallback(async () => {
    if (!electronAPI) return;
    await electronAPI.clearOfflineData();
  }, [electronAPI]);

  const getDataByType = useCallback(async (entityType: string) => {
    if (!electronAPI) return {};
    return await electronAPI.getDataByType(entityType);
  }, [electronAPI]);

  const getConflictedEntities = useCallback(async () => {
    if (!electronAPI) return [];
    return await electronAPI.getConflictedEntities();
  }, [electronAPI]);

  const resolveConflictManually = useCallback(async (entityId: string, resolvedData: any) => {
    if (!electronAPI) return;
    await electronAPI.resolveConflictManually(entityId, resolvedData);
  }, [electronAPI]);

  return {
    isElectron,
    getData,
    setData,
    removeData,
    clearData,
    getDataByType,
    getConflictedEntities,
    resolveConflictManually,
  };
};

export const useElectronNotifications = () => {
  const { isElectron, electronAPI } = useElectron();

  const showSystemNotification = useCallback((options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
    urgency?: 'normal' | 'critical' | 'low';
    actions?: Array<{ type: string; text: string }>;
    tag?: string;
  }) => {
    if (electronAPI?.showSystemNotification) {
      electronAPI.showSystemNotification(options);
    }
  }, [electronAPI]);

  const showReminderNotification = useCallback((title: string, body: string, reminderData?: any) => {
    if (electronAPI?.showReminderNotification) {
      electronAPI.showReminderNotification(title, body, reminderData);
    }
  }, [electronAPI]);

  const showGroupActivityNotification = useCallback((groupName: string, activity: string, userName?: string) => {
    if (electronAPI?.showGroupActivityNotification) {
      electronAPI.showGroupActivityNotification(groupName, activity, userName);
    }
  }, [electronAPI]);

  return {
    isElectron,
    showSystemNotification,
    showReminderNotification,
    showGroupActivityNotification,
  };
};

export const useElectronGlobalShortcuts = () => {
  const { isElectron, electronAPI } = useElectron();

  const registerShortcut = useCallback(async (accelerator: string, action: string, description: string) => {
    if (!electronAPI?.registerGlobalShortcut) return false;
    return await electronAPI.registerGlobalShortcut(accelerator, action, description);
  }, [electronAPI]);

  const unregisterShortcut = useCallback((accelerator: string) => {
    if (electronAPI?.unregisterGlobalShortcut) {
      electronAPI.unregisterGlobalShortcut(accelerator);
    }
  }, [electronAPI]);

  const getRegisteredShortcuts = useCallback(async () => {
    if (!electronAPI?.getRegisteredShortcuts) return [];
    return await electronAPI.getRegisteredShortcuts();
  }, [electronAPI]);

  return {
    isElectron,
    registerShortcut,
    unregisterShortcut,
    getRegisteredShortcuts,
  };
};