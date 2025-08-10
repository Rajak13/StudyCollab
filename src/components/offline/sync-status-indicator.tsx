'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useElectron } from '@/hooks/use-electron';
import {
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Upload,
    WifiOff
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
  syncError?: string;
  lastSyncAttempt?: Date;
}

export function SyncStatusIndicator() {
  const { isElectron, electronAPI } = useElectron();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: null,
    pendingChanges: 0,
    isSyncing: false,
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

    // Initial status check
    updateSyncStatus();

    // Set up periodic status updates
    const interval = setInterval(updateSyncStatus, 5000);

    // Listen for sync events
    const handleSyncStart = () => {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: undefined }));
    };

    const handleSyncSuccess = () => {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSync: new Date(),
        syncError: undefined 
      }));
    };

    const handleSyncError = (error: any) => {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncError: error?.message || 'Sync failed',
        lastSyncAttempt: new Date()
      }));
    };

    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    electronAPI.on('sync-start', handleSyncStart);
    electronAPI.on('sync-success', handleSyncSuccess);
    electronAPI.on('sync-error', handleSyncError);
    electronAPI.on('online', handleOnline);
    electronAPI.on('offline', handleOffline);

    return () => {
      clearInterval(interval);
      electronAPI.off('sync-start', handleSyncStart);
      electronAPI.off('sync-success', handleSyncSuccess);
      electronAPI.off('sync-error', handleSyncError);
      electronAPI.off('online', handleOnline);
      electronAPI.off('offline', handleOffline);
    };
  }, [isElectron, electronAPI]);

  const handleManualSync = () => {
    if (electronAPI && !syncStatus.isSyncing) {
      electronAPI.triggerSync();
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (syncStatus.isSyncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (syncStatus.syncError) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (syncStatus.pendingChanges > 0) {
      return <Upload className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    
    if (syncStatus.syncError) {
      return 'Sync Error';
    }
    
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges} pending`;
    }
    
    return 'Synced';
  };

  const getTooltipContent = () => {
    const parts = [];
    
    if (!syncStatus.isOnline) {
      parts.push('Device is offline');
    } else {
      parts.push('Device is online');
    }
    
    if (syncStatus.lastSync) {
      parts.push(`Last sync: ${syncStatus.lastSync.toLocaleTimeString()}`);
    }
    
    if (syncStatus.pendingChanges > 0) {
      parts.push(`${syncStatus.pendingChanges} changes pending sync`);
    }
    
    if (syncStatus.syncError) {
      parts.push(`Error: ${syncStatus.syncError}`);
    }
    
    if (syncStatus.lastSyncAttempt && syncStatus.syncError) {
      parts.push(`Last attempt: ${syncStatus.lastSyncAttempt.toLocaleTimeString()}`);
    }
    
    return parts.join('\n');
  };

  // Don't render if not in Electron
  if (!isElectron) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
              {syncStatus.pendingChanges > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {syncStatus.pendingChanges}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <pre className="text-xs whitespace-pre-wrap">{getTooltipContent()}</pre>
          </TooltipContent>
        </Tooltip>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          disabled={syncStatus.isSyncing || !syncStatus.isOnline}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </TooltipProvider>
  );
}