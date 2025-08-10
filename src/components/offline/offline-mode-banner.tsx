'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useElectron } from '@/hooks/use-electron';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineModeBanner() {
  const { isElectron, electronAPI } = useElectron();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const updateStatus = async () => {
      try {
        const status = await electronAPI.getSyncStatus();
        setIsOnline(status.isOnline);
        setPendingChanges(status.pendingChanges);
        setIsSyncing(status.isSyncing);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    // Initial status check
    updateStatus();

    // Set up periodic status updates
    const interval = setInterval(updateStatus, 10000); // Check every 10 seconds

    // Listen for network events
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => {
      setIsSyncing(false);
      updateStatus();
    };

    electronAPI.on('online', handleOnline);
    electronAPI.on('offline', handleOffline);
    electronAPI.on('sync-start', handleSyncStart);
    electronAPI.on('sync-end', handleSyncEnd);

    return () => {
      clearInterval(interval);
      electronAPI.off('online', handleOnline);
      electronAPI.off('offline', handleOffline);
      electronAPI.off('sync-start', handleSyncStart);
      electronAPI.off('sync-end', handleSyncEnd);
    };
  }, [isElectron, electronAPI]);

  const handleRetrySync = () => {
    if (electronAPI && !isSyncing) {
      electronAPI.triggerSync();
    }
  };

  // Don't render if not in Electron or if online with no pending changes
  if (!isElectron || (isOnline && pendingChanges === 0)) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        )}
        <AlertDescription className="flex-1">
          {!isOnline ? (
            <span>
              You're currently offline. Your changes are being saved locally and will sync when you're back online.
              {pendingChanges > 0 && (
                <span className="font-medium"> {pendingChanges} changes pending sync.</span>
              )}
            </span>
          ) : (
            <span>
              You have {pendingChanges} changes waiting to sync to the server.
            </span>
          )}
        </AlertDescription>
        
        {isOnline && pendingChanges > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetrySync}
            disabled={isSyncing}
            className="ml-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        )}
      </div>
    </Alert>
  );
}