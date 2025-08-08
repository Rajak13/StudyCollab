'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useElectronSync } from '@/hooks/use-electron';
import { formatDistanceToNow } from 'date-fns';
import { Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function ElectronSyncStatus() {
  const { isElectron, syncStatus, triggerSync } = useElectronSync();

  if (!isElectron) {
    return null;
  }

  const { isOnline, lastSync, pendingChanges } = syncStatus;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {pendingChanges > 0 && (
        <Badge variant="secondary" className="text-xs">
          {pendingChanges} pending
        </Badge>
      )}

      {lastSync && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}
          </span>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={triggerSync}
        disabled={!isOnline}
        className="h-6 px-2"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );
}