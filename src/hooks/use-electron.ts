import { useCallback, useEffect, useState } from 'react';

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
  setOfflineData: (key: string, value: any) => Promise<void>;
  removeOfflineData: (key: string) => Promise<void>;
  clearOfflineData: () => Promise<void>;
  triggerSync: () => void;
  getSyncStatus: () => Promise<{ isOnline: boolean; lastSync: Date | null; pendingChanges: number }>;
  showNotification: (title: string, body: string, options?: NotificationOptions) => void;
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