'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Keyboard, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface GlobalShortcut {
  accelerator: string;
  action: string;
  description: string;
}

export function GlobalShortcutsManager() {
  const [shortcuts, setShortcuts] = useState<GlobalShortcut[]>([]);
  const [newShortcut, setNewShortcut] = useState({
    accelerator: '',
    action: '',
    description: ''
  });
  const [isElectron, setIsElectron] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsElectron(!!window.electronAPI);
    if (window.electronAPI) {
      loadShortcuts();
    }
  }, []);

  const loadShortcuts = useCallback(async () => {
    if (!window.electronAPI?.getRegisteredShortcuts) return;
    
    try {
      const registeredShortcuts = await window.electronAPI.getRegisteredShortcuts();
      setShortcuts(registeredShortcuts);
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load global shortcuts',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const registerShortcut = useCallback(async () => {
    if (!window.electronAPI?.registerGlobalShortcut) return;
    if (!newShortcut.accelerator || !newShortcut.action || !newShortcut.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const success = await window.electronAPI.registerGlobalShortcut(
        newShortcut.accelerator,
        newShortcut.action,
        newShortcut.description
      );

      if (success) {
        toast({
          title: 'Success',
          description: `Shortcut ${newShortcut.accelerator} registered successfully`
        });
        setNewShortcut({ accelerator: '', action: '', description: '' });
        await loadShortcuts();
      } else {
        toast({
          title: 'Error',
          description: `Failed to register shortcut ${newShortcut.accelerator}. It may already be in use.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to register shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to register global shortcut',
        variant: 'destructive'
      });
    }
  }, [newShortcut, toast, loadShortcuts]);

  const unregisterShortcut = useCallback(async (accelerator: string) => {
    if (!window.electronAPI?.unregisterGlobalShortcut) return;

    try {
      window.electronAPI.unregisterGlobalShortcut(accelerator);
      toast({
        title: 'Success',
        description: `Shortcut ${accelerator} unregistered successfully`
      });
      await loadShortcuts();
    } catch (error) {
      console.error('Failed to unregister shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to unregister global shortcut',
        variant: 'destructive'
      });
    }
  }, [toast, loadShortcuts]);

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Global Shortcuts
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Global Shortcuts
          </CardTitle>
          <CardDescription>
            Manage global keyboard shortcuts that work even when StudyCollab is not focused.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new shortcut */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="accelerator">Shortcut</Label>
              <Input
                id="accelerator"
                placeholder="Ctrl+Shift+N"
                value={newShortcut.accelerator}
                onChange={(e) => setNewShortcut(prev => ({ ...prev, accelerator: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="new-note"
                value={newShortcut.action}
                onChange={(e) => setNewShortcut(prev => ({ ...prev, action: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Create new note"
                value={newShortcut.description}
                onChange={(e) => setNewShortcut(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={registerShortcut} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Existing shortcuts */}
          <div className="space-y-2">
            {shortcuts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No global shortcuts registered
              </p>
            ) : (
              shortcuts.map((shortcut) => (
                <div
                  key={shortcut.accelerator}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {shortcut.accelerator}
                    </Badge>
                    <div>
                      <p className="font-medium">{shortcut.description}</p>
                      <p className="text-sm text-muted-foreground">{shortcut.action}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unregisterShortcut(shortcut.accelerator)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shortcut format help */}
      <Card>
        <CardHeader>
          <CardTitle>Shortcut Format</CardTitle>
          <CardDescription>
            Use the following format for keyboard shortcuts:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Modifiers:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>CommandOrControl</code> - Cmd on macOS, Ctrl on Windows/Linux</li>
                <li><code>Ctrl</code> - Control key</li>
                <li><code>Shift</code> - Shift key</li>
                <li><code>Alt</code> - Alt key</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Examples:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>CommandOrControl+Shift+N</code></li>
                <li><code>Ctrl+Alt+T</code></li>
                <li><code>F12</code></li>
                <li><code>CommandOrControl+/</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}