'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useElectron } from '@/hooks/use-electron';
import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface GlobalShortcut {
  accelerator: string;
  action: string;
  description: string;
}

interface ShortcutFormData {
  accelerator: string;
  action: string;
  description: string;
}

const DEFAULT_SHORTCUTS: GlobalShortcut[] = [
  {
    accelerator: 'CommandOrControl+Shift+S',
    action: 'toggle-main-window',
    description: 'Toggle StudyCollab window'
  },
  {
    accelerator: 'CommandOrControl+Shift+N',
    action: 'new-note',
    description: 'Create new note'
  },
  {
    accelerator: 'CommandOrControl+Shift+C',
    action: 'quick-capture',
    description: 'Quick capture text/idea'
  },
  {
    accelerator: 'CommandOrControl+Shift+F',
    action: 'global-search',
    description: 'Global search'
  },
  {
    accelerator: 'CommandOrControl+Shift+T',
    action: 'show-tasks',
    description: 'Show today\'s tasks'
  }
];

export function GlobalShortcutsManager() {
  const { isElectron, electronAPI } = useElectron();
  const { toast } = useToast();
  const [shortcuts, setShortcuts] = useState<GlobalShortcut[]>([]);
  const [newShortcut, setNewShortcut] = useState<ShortcutFormData>({
    accelerator: '',
    action: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load existing shortcuts
  const loadShortcuts = useCallback(async () => {
    if (!isElectron || !electronAPI?.getRegisteredShortcuts) return;

    try {
      const registeredShortcuts = await electronAPI.getRegisteredShortcuts();
      setShortcuts(registeredShortcuts);
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load global shortcuts',
        variant: 'destructive'
      });
    }
  }, [isElectron, electronAPI, toast]);

  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  // Register a new shortcut
  const registerShortcut = useCallback(async (shortcut: ShortcutFormData) => {
    if (!isElectron || !electronAPI?.registerGlobalShortcut) {
      toast({
        title: 'Not Available',
        description: 'Global shortcuts are only available in the desktop app',
        variant: 'destructive'
      });
      return false;
    }

    if (!shortcut.accelerator || !shortcut.action || !shortcut.description) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return false;
    }

    try {
      setIsLoading(true);
      const success = await electronAPI.registerGlobalShortcut(
        shortcut.accelerator,
        shortcut.action,
        shortcut.description
      );

      if (success) {
        toast({
          title: 'Shortcut Registered',
          description: `${shortcut.accelerator} → ${shortcut.description}`
        });
        await loadShortcuts();
        setNewShortcut({ accelerator: '', action: '', description: '' });
        return true;
      } else {
        toast({
          title: 'Registration Failed',
          description: 'The shortcut may already be in use by another application',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to register shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to register global shortcut',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, electronAPI, toast, loadShortcuts]);

  // Unregister a shortcut
  const unregisterShortcut = useCallback(async (accelerator: string) => {
    if (!isElectron || !electronAPI?.unregisterGlobalShortcut) return;

    try {
      electronAPI.unregisterGlobalShortcut(accelerator);
      toast({
        title: 'Shortcut Removed',
        description: `${accelerator} has been unregistered`
      });
      await loadShortcuts();
    } catch (error) {
      console.error('Failed to unregister shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to unregister shortcut',
        variant: 'destructive'
      });
    }
  }, [isElectron, electronAPI, toast, loadShortcuts]);

  // Register default shortcuts
  const registerDefaultShortcuts = useCallback(async () => {
    if (!isElectron) return;

    setIsLoading(true);
    let successCount = 0;

    for (const shortcut of DEFAULT_SHORTCUTS) {
      const success = await registerShortcut(shortcut);
      if (success) successCount++;
    }

    toast({
      title: 'Default Shortcuts',
      description: `Registered ${successCount} of ${DEFAULT_SHORTCUTS.length} default shortcuts`
    });

    setIsLoading(false);
  }, [isElectron, registerShortcut, toast]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    registerShortcut(newShortcut);
  }, [newShortcut, registerShortcut]);

  // Format accelerator for display
  const formatAccelerator = useCallback((accelerator: string) => {
    return accelerator
      .replace('CommandOrControl', process.platform === 'darwin' ? 'Cmd' : 'Ctrl')
      .replace('Shift', '⇧')
      .replace('Alt', process.platform === 'darwin' ? '⌥' : 'Alt')
      .replace('+', ' + ');
  }, []);

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Shortcuts</CardTitle>
          <CardDescription>
            Global shortcuts are only available in the desktop application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Shortcuts</CardTitle>
          <CardDescription>
            Configure system-wide keyboard shortcuts for quick access to StudyCollab features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new shortcut form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Add New Shortcut</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="accelerator">Key Combination</Label>
                <Input
                  id="accelerator"
                  placeholder="e.g., CommandOrControl+Shift+X"
                  value={newShortcut.accelerator}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, accelerator: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use CommandOrControl for cross-platform compatibility
                </p>
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <Input
                  id="action"
                  placeholder="e.g., new-note"
                  value={newShortcut.action}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, action: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Create new note"
                  value={newShortcut.description}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register Shortcut'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={registerDefaultShortcuts}
                disabled={isLoading}
              >
                Register Defaults
              </Button>
            </div>
          </form>

          {/* Current shortcuts list */}
          <div className="space-y-2">
            <h4 className="font-medium">Current Shortcuts</h4>
            {shortcuts.length === 0 ? (
              <p className="text-muted-foreground">No global shortcuts registered</p>
            ) : (
              <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.accelerator}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                          {formatAccelerator(shortcut.accelerator)}
                        </code>
                        <span className="font-medium">{shortcut.description}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Action: {shortcut.action}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unregisterShortcut(shortcut.accelerator)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available actions reference */}
          <div className="space-y-2">
            <h4 className="font-medium">Available Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="space-y-1">
                <p><code>toggle-main-window</code> - Show/hide main window</p>
                <p><code>new-note</code> - Create new note</p>
                <p><code>new-task</code> - Create new task</p>
                <p><code>quick-capture</code> - Quick capture dialog</p>
              </div>
              <div className="space-y-1">
                <p><code>global-search</code> - Global search</p>
                <p><code>show-tasks</code> - Show today's tasks</p>
                <p><code>show-dashboard</code> - Navigate to dashboard</p>
                <p><code>show-notes</code> - Navigate to notes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for using global shortcuts in other components
export const useGlobalShortcuts = () => {
  const { isElectron, electronAPI } = useElectron();
  const { toast } = useToast();

  const registerShortcut = useCallback(async (accelerator: string, action: string, description: string) => {
    if (!isElectron || !electronAPI?.registerGlobalShortcut) return false;

    try {
      const success = await electronAPI.registerGlobalShortcut(accelerator, action, description);
      if (success) {
        toast({
          title: 'Shortcut Registered',
          description: `${accelerator} → ${description}`
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to register shortcut:', error);
      return false;
    }
  }, [isElectron, electronAPI, toast]);

  const unregisterShortcut = useCallback((accelerator: string) => {
    if (!isElectron || !electronAPI?.unregisterGlobalShortcut) return;
    electronAPI.unregisterGlobalShortcut(accelerator);
  }, [isElectron, electronAPI]);

  const getRegisteredShortcuts = useCallback(async () => {
    if (!isElectron || !electronAPI?.getRegisteredShortcuts) return [];
    try {
      return await electronAPI.getRegisteredShortcuts();
    } catch (error) {
      console.error('Failed to get shortcuts:', error);
      return [];
    }
  }, [isElectron, electronAPI]);

  return {
    isElectron,
    registerShortcut,
    unregisterShortcut,
    getRegisteredShortcuts
  };
};