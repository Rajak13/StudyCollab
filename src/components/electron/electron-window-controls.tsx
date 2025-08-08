'use client';

import { Button } from '@/components/ui/button';
import { useElectronWindow } from '@/hooks/use-electron';
import { Maximize, Minimize, Square, X } from 'lucide-react';

export function ElectronWindowControls() {
  const { isElectron, isMaximized, minimize, maximize, close } = useElectronWindow();

  if (!isElectron) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 ml-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={minimize}
        className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Minimize className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={maximize}
        className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {isMaximized ? (
          <Square className="h-4 w-4" />
        ) : (
          <Maximize className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={close}
        className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}