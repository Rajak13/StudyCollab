'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useElectronUpdater } from '@/hooks/use-electron';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';

export function ElectronUpdater() {
  const { isElectron, updateStatus, checkForUpdates, installUpdate } = useElectronUpdater();

  if (!isElectron) {
    return null;
  }

  const { checking, available, downloaded, error } = updateStatus;

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Update Error</AlertTitle>
        <AlertDescription>
          Failed to check for updates: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (downloaded) {
    return (
      <Alert className="mb-4">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Update Ready</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>A new version of StudyCollab is ready to install.</span>
          <Button onClick={installUpdate} size="sm">
            Restart & Install
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (available) {
    return (
      <Alert className="mb-4">
        <Download className="h-4 w-4" />
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>A new version of StudyCollab is available.</span>
          <Button onClick={checkForUpdates} size="sm">
            Download Update
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (checking) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Checking for Updates</AlertTitle>
        <AlertDescription>
          <div className="flex items-center space-x-2">
            <span>Checking for updates...</span>
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

interface UpdateProgressProps {
  progress: {
    percent: number;
    bytesPerSecond: number;
    total: number;
    transferred: number;
  };
}

export function UpdateProgress({ progress }: UpdateProgressProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Downloading update...</span>
        <span>{Math.round(progress.percent)}%</span>
      </div>
      <Progress value={progress.percent} className="w-full" />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatBytes(progress.transferred)} / {formatBytes(progress.total)}</span>
        <span>{formatSpeed(progress.bytesPerSecond)}</span>
      </div>
    </div>
  );
}