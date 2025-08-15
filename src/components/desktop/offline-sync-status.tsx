'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useElectron, useElectronSync } from '@/hooks/use-electron';
import { AlertCircle, CheckCircle, Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing?: boolean;
  syncError?: string;
  lastSyncAttempt?: Date;
}

interface ConflictedEntity {
  id: string;
  type: string;
  data: string;
  lastModified: number;
  version: number;
  isDeleted: boolean;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

export function OfflineSyncStatus() {
  const { isElectron, electronAPI } = useElectron();
  const { syncStatus, triggerSync } = useElectronSync();
  const { toast } = useToast();
  const [detailedStatus, setDetailedStatus] = useState<SyncStatus | null>(null);
  const [conflicts, setConflicts] = useState<ConflictedEntity[]>([]);
  const [isLoadingConflicts, setIsLoadingConflicts] = useState(false);

  // Load detailed sync status
  const loadDetailedStatus = useCallback(async () => {
    if (!isElectron || !electronAPI?.getSyncStatus) return;

    try {
      const status = await electronAPI.getSyncStatus();
      setDetailedStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, [isElectron, electronAPI]);

  // Load conflicted entities
  const loadConflicts = useCallback(async () => {
    if (!isElectron || !electronAPI?.getConflictedEntities) return;

    try {
      setIsLoadingConflicts(true);
      const conflictedEntities = await electronAPI.getConflictedEntities();
      setConflicts(conflictedEntities);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync conflicts',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingConflicts(false);
    }
  }, [isElectron, electronAPI, toast]);

  // Resolve conflict manually
  const resolveConflict = useCallback(async (entityId: string, resolvedData: any) => {
    if (!isElectron || !electronAPI?.resolveConflictManually) return;

    try {
      await electronAPI.resolveConflictManually(entityId, resolvedData);
      toast({
        title: 'Conflict Resolved',
        description: `Conflict for ${entityId} has been resolved`
      });
      await loadConflicts();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve conflict',
        variant: 'destructive'
      });
    }
  }, [isElectron, electronAPI, toast, loadConflicts]);

  // Force sync
  const handleForceSync = useCallback(() => {
    if (!isElectron) {
      toast({
        title: 'Not Available',
        description: 'Offline sync is only available in the desktop app',
        variant: 'destructive'
      });
      return;
    }

    triggerSync();
    toast({
      title: 'Sync Triggered',
      description: 'Manual sync has been initiated'
    });
  }, [isElectron, triggerSync, toast]);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    if (!isElectron || !electronAPI?.clearOfflineData) return;

    try {
      await electronAPI.clearOfflineData();
      toast({
        title: 'Data Cleared',
        description: 'All offline data has been cleared'
      });
      await loadDetailedStatus();
      await loadConflicts();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear offline data',
        variant: 'destructive'
      });
    }
  }, [isElectron, electronAPI, toast, loadDetailedStatus, loadConflicts]);

  // Load data on mount and set up refresh interval
  useEffect(() => {
    loadDetailedStatus();
    loadConflicts();

    const interval = setInterval(() => {
      loadDetailedStatus();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [loadDetailedStatus, loadConflicts]);

  // Listen for sync events
  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const handleSyncStart = () => {
      setDetailedStatus(prev => prev ? { ...prev, isSyncing: true } : null);
    };

    const handleSyncEnd = () => {
      loadDetailedStatus();
    };

    const handleSyncError = (error: string) => {
      setDetailedStatus(prev => prev ? { ...prev, isSyncing: false, syncError: error } : null);
      toast({
        title: 'Sync Error',
        description: error,
        variant: 'destructive'
      });
    };

    const handleConflictDetected = () => {
      loadConflicts();
      toast({
        title: 'Sync Conflict',
        description: 'Data conflicts detected. Please review and resolve.',
        variant: 'destructive'
      });
    };

    electronAPI.on('sync-start', handleSyncStart);
    electronAPI.on('sync-end', handleSyncEnd);
    electronAPI.on('sync-error', handleSyncError);
    electronAPI.on('conflict-detected', handleConflictDetected);

    return () => {
      electronAPI.off('sync-start', handleSyncStart);
      electronAPI.off('sync-end', handleSyncEnd);
      electronAPI.off('sync-error', handleSyncError);
      electronAPI.off('conflict-detected', handleConflictDetected);
    };
  }, [isElectron, electronAPI, toast, loadDetailedStatus, loadConflicts]);

  // Format date for display
  const formatDate = useCallback((date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(date));
  }, []);

  // Get status icon and color
  const getStatusIcon = useCallback(() => {
    if (!isElectron) {
      return { icon: Cloud, color: 'text-blue-500', label: 'Web Version' };
    }

    const status = detailedStatus || syncStatus;
    
    if (!status.isOnline) {
      return { icon: WifiOff, color: 'text-red-500', label: 'Offline' };
    }

    if (status.isSyncing === true) {
      return { icon: RefreshCw, color: 'text-blue-500 animate-spin', label: 'Syncing' };
    }

    if (status.syncError) {
      return { icon: AlertCircle, color: 'text-red-500', label: 'Sync Error' };
    }

    if (status.pendingChanges > 0) {
      return { icon: CloudOff, color: 'text-yellow-500', label: 'Pending Changes' };
    }

    return { icon: CheckCircle, color: 'text-green-500', label: 'Synced' };
  }, [isElectron, detailedStatus, syncStatus]);

  const statusInfo = getStatusIcon();
  const StatusIcon = statusInfo.icon;

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Offline sync is only available in the desktop application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main sync status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            Sync Status
          </CardTitle>
          <CardDescription>
            {statusInfo.label}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Connection</p>
              <div className="flex items-center gap-2">
                {(detailedStatus?.isOnline ?? syncStatus.isOnline) ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span>
                  {(detailedStatus?.isOnline ?? syncStatus.isOnline) ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div>
              <p className="font-medium">Pending Changes</p>
              <p className="text-muted-foreground">
                {detailedStatus?.pendingChanges ?? syncStatus.pendingChanges}
              </p>
            </div>
            <div>
              <p className="font-medium">Last Sync</p>
              <p className="text-muted-foreground">
                {formatDate(detailedStatus?.lastSync ?? syncStatus.lastSync)}
              </p>
            </div>
            <div>
              <p className="font-medium">Last Attempt</p>
              <p className="text-muted-foreground">
                {formatDate(detailedStatus?.lastSyncAttempt ?? null)}
              </p>
            </div>
          </div>

          {/* Sync error */}
          {detailedStatus?.syncError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Sync Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                {detailedStatus.syncError}
              </p>
            </div>
          )}

          {/* Sync progress */}
          {(detailedStatus?.isSyncing === true) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Syncing...</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleForceSync}
              disabled={detailedStatus?.isSyncing === true}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Sync
            </Button>
            <Button
              variant="outline"
              onClick={clearOfflineData}
              size="sm"
            >
              Clear Offline Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Sync Conflicts ({conflicts.length})
            </CardTitle>
            <CardDescription>
              These items have conflicts that need to be resolved manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{conflict.type}</p>
                    <p className="text-sm text-muted-foreground">ID: {conflict.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Modified: {formatDate(new Date(conflict.lastModified))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Version: {conflict.version}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveConflict(conflict.id, JSON.parse(conflict.data))}
                  >
                    Keep Local
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // This would typically fetch server data and resolve with it
                      toast({
                        title: 'Feature Coming Soon',
                        description: 'Server conflict resolution will be available soon'
                      });
                    }}
                  >
                    Keep Server
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for using offline sync status
export const useOfflineSyncStatus = () => {
  const { isElectron, electronAPI } = useElectron();
  const { syncStatus, triggerSync } = useElectronSync();
  const [detailedStatus, setDetailedStatus] = useState<SyncStatus | null>(null);

  const loadStatus = useCallback(async () => {
    if (!isElectron || !electronAPI?.getSyncStatus) return;

    try {
      const status = await electronAPI.getSyncStatus();
      setDetailedStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, [isElectron, electronAPI]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  return {
    isElectron,
    syncStatus: detailedStatus || syncStatus,
    triggerSync,
    loadStatus
  };
};