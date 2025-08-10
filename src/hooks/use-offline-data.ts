'use client';

import { useCallback, useEffect, useState } from 'react';
import { useElectron } from './use-electron';

interface OfflineDataHookOptions {
  entityType?: string;
  autoSync?: boolean;
  syncInterval?: number;
}

export function useOfflineData<T = any>(
  key: string, 
  initialValue?: T,
  options: OfflineDataHookOptions = {}
) {
  const { isElectron, electronAPI } = useElectron();
  const { entityType = 'general', autoSync = true, syncInterval = 30000 } = options;
  
  const [data, setData] = useState<T | undefined>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!isElectron || !electronAPI) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await electronAPI.getOfflineData(key);
        if (result !== undefined) {
          setData(result);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Failed to load offline data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key, isElectron, electronAPI]);

  // Monitor sync status
  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const updateSyncStatus = async () => {
      try {
        const status = await electronAPI.getSyncStatus();
        setIsOnline(status.isOnline);
        setPendingSync(status.pendingChanges > 0);
      } catch (err) {
        console.error('Failed to get sync status:', err);
      }
    };

    updateSyncStatus();

    // Set up periodic sync status updates
    let interval: NodeJS.Timeout | undefined;
    if (autoSync) {
      interval = setInterval(updateSyncStatus, syncInterval);
    }

    // Listen for sync events
    const handleSyncStart = () => setPendingSync(true);
    const handleSyncSuccess = () => {
      setPendingSync(false);
      // Reload data after successful sync
      loadData();
    };
    const handleSyncError = () => setPendingSync(true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    electronAPI.on('sync-start', handleSyncStart);
    electronAPI.on('sync-success', handleSyncSuccess);
    electronAPI.on('sync-error', handleSyncError);
    electronAPI.on('online', handleOnline);
    electronAPI.on('offline', handleOffline);

    const loadData = async () => {
      try {
        const result = await electronAPI.getOfflineData(key);
        if (result !== undefined) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to reload data after sync:', err);
      }
    };

    return () => {
      if (interval) clearInterval(interval);
      electronAPI.off('sync-start', handleSyncStart);
      electronAPI.off('sync-success', handleSyncSuccess);
      electronAPI.off('sync-error', handleSyncError);
      electronAPI.off('online', handleOnline);
      electronAPI.off('offline', handleOffline);
    };
  }, [key, isElectron, electronAPI, autoSync, syncInterval]);

  const updateData = useCallback(async (newData: T) => {
    if (!isElectron || !electronAPI) {
      setData(newData);
      return;
    }

    try {
      await electronAPI.setOfflineData(key, newData, entityType);
      setData(newData);
      setError(null);
      
      // Trigger sync if online
      if (isOnline && autoSync) {
        electronAPI.triggerSync();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
      console.error('Failed to save offline data:', err);
      throw err;
    }
  }, [key, entityType, isElectron, electronAPI, isOnline, autoSync]);

  const removeData = useCallback(async () => {
    if (!isElectron || !electronAPI) {
      setData(undefined);
      return;
    }

    try {
      await electronAPI.removeOfflineData(key, entityType);
      setData(undefined);
      setError(null);
      
      // Trigger sync if online
      if (isOnline && autoSync) {
        electronAPI.triggerSync();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove data');
      console.error('Failed to remove offline data:', err);
      throw err;
    }
  }, [key, entityType, isElectron, electronAPI, isOnline, autoSync]);

  const forceSync = useCallback(async () => {
    if (!isElectron || !electronAPI) return;
    
    try {
      electronAPI.triggerSync();
    } catch (err) {
      console.error('Failed to trigger sync:', err);
    }
  }, [isElectron, electronAPI]);

  const refreshData = useCallback(async () => {
    if (!isElectron || !electronAPI) return;

    try {
      setIsLoading(true);
      const result = await electronAPI.getOfflineData(key);
      if (result !== undefined) {
        setData(result);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      console.error('Failed to refresh offline data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [key, isElectron, electronAPI]);

  return {
    data,
    setData: updateData,
    removeData,
    isLoading,
    error,
    isOnline,
    pendingSync,
    forceSync,
    refreshData,
    // Utility flags
    isOfflineCapable: isElectron,
    hasUnsavedChanges: pendingSync && !isOnline,
  };
}

// Hook for managing collections of data by type
export function useOfflineDataByType<T = any>(entityType: string) {
  const { isElectron, electronAPI } = useElectron();
  const [data, setData] = useState<Record<string, T>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isElectron || !electronAPI) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await electronAPI.getDataByType(entityType);
        setData(result || {});
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Failed to load offline data by type:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Listen for sync events to reload data
    const handleSyncSuccess = () => loadData();
    electronAPI.on('sync-success', handleSyncSuccess);

    return () => {
      electronAPI.off('sync-success', handleSyncSuccess);
    };
  }, [entityType, isElectron, electronAPI]);

  return {
    data,
    isLoading,
    error,
    refreshData: async () => {
      if (!isElectron || !electronAPI) return;
      
      try {
        setIsLoading(true);
        const result = await electronAPI.getDataByType(entityType);
        setData(result || {});
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh data');
        console.error('Failed to refresh offline data by type:', err);
      } finally {
        setIsLoading(false);
      }
    },
  };
}