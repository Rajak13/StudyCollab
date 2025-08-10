'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useElectron } from '@/hooks/use-electron';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConflictData {
  entityId: string;
  localData: any;
  serverData: any;
  localTimestamp?: number;
  serverTimestamp?: number;
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

export function ConflictResolutionDialog() {
  const { isElectron, electronAPI } = useElectron();
  const [isOpen, setIsOpen] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictedEntity[]>([]);
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | null>(null);

  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const handleConflictDetected = (conflictData: ConflictData) => {
      setCurrentConflict(conflictData);
      setIsOpen(true);
    };

    electronAPI.on('conflict-detected', handleConflictDetected);

    return () => {
      electronAPI.off('conflict-detected', handleConflictDetected);
    };
  }, [isElectron, electronAPI]);

  const loadConflicts = async () => {
    if (!electronAPI) return;
    
    try {
      const conflictedEntities = await electronAPI.getConflictedEntities?.();
      if (conflictedEntities) {
        setConflicts(conflictedEntities);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConflicts();
    }
  }, [isOpen]);

  const handleResolveConflict = async (resolution: 'local' | 'remote') => {
    if (!currentConflict || !electronAPI) return;

    try {
      const resolvedData = resolution === 'local' 
        ? currentConflict.localData 
        : currentConflict.serverData;

      await electronAPI.resolveConflictManually?.(currentConflict.entityId, resolvedData);
      
      setIsOpen(false);
      setCurrentConflict(null);
      setSelectedResolution(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const formatData = (data: any) => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  if (!isElectron || !currentConflict) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            The same data was modified both locally and on the server. Please choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Entity ID: {currentConflict.entityId}</Badge>
            {currentConflict.localTimestamp && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Local: {formatTimestamp(currentConflict.localTimestamp)}
              </Badge>
            )}
            {currentConflict.serverTimestamp && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Server: {formatTimestamp(currentConflict.serverTimestamp)}
              </Badge>
            )}
          </div>

          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comparison">Side by Side</TabsTrigger>
              <TabsTrigger value="preview">Preview Resolution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comparison" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Local Version</h4>
                    <Button
                      variant={selectedResolution === 'local' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedResolution('local')}
                    >
                      Use This Version
                    </Button>
                  </div>
                  <ScrollArea className="h-64 w-full rounded border p-3">
                    <pre className="text-sm whitespace-pre-wrap">
                      {formatData(currentConflict.localData)}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Server Version</h4>
                    <Button
                      variant={selectedResolution === 'remote' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedResolution('remote')}
                    >
                      Use This Version
                    </Button>
                  </div>
                  <ScrollArea className="h-64 w-full rounded border p-3">
                    <pre className="text-sm whitespace-pre-wrap">
                      {formatData(currentConflict.serverData)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {selectedResolution ? (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Preview: {selectedResolution === 'local' ? 'Local' : 'Server'} Version
                  </h4>
                  <ScrollArea className="h-64 w-full rounded border p-3">
                    <pre className="text-sm whitespace-pre-wrap">
                      {formatData(
                        selectedResolution === 'local' 
                          ? currentConflict.localData 
                          : currentConflict.serverData
                      )}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a version to preview the resolution
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedResolution && handleResolveConflict(selectedResolution)}
            disabled={!selectedResolution}
          >
            Resolve Conflict
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}