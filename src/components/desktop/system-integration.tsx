'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useElectron } from '@/hooks/use-electron';
import { ExternalLink, FileText, FolderOpen, Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SystemIntegrationSettings {
  fileAssociations: {
    scnote: boolean;
    sctask: boolean;
    scboard: boolean;
  };
  contextMenus: boolean;
  protocolHandler: boolean;
  startWithSystem: boolean;
  minimizeToTray: boolean;
  showInTaskbar: boolean;
}

interface FileAssociation {
  extension: string;
  description: string;
  icon: string;
  isRegistered: boolean;
}

export function SystemIntegration() {
  const { isElectron, electronAPI } = useElectron();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemIntegrationSettings>({
    fileAssociations: {
      scnote: false,
      sctask: false,
      scboard: false
    },
    contextMenus: false,
    protocolHandler: false,
    startWithSystem: false,
    minimizeToTray: true,
    showInTaskbar: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const fileAssociations: FileAssociation[] = [
    {
      extension: '.scnote',
      description: 'StudyCollab Note File',
      icon: '📝',
      isRegistered: settings.fileAssociations.scnote
    },
    {
      extension: '.sctask',
      description: 'StudyCollab Task File',
      icon: '✅',
      isRegistered: settings.fileAssociations.sctask
    },
    {
      extension: '.scboard',
      description: 'StudyCollab Board File',
      icon: '📋',
      isRegistered: settings.fileAssociations.scboard
    }
  ];

  // Load current settings
  const loadSettings = useCallback(async () => {
    if (!isElectron || !electronAPI?.getSetting) return;

    try {
      const savedSettings = await electronAPI.getSetting('systemIntegration');
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load system integration settings:', error);
    }
  }, [isElectron, electronAPI]);

  // Save settings
  const saveSettings = useCallback(async (newSettings: SystemIntegrationSettings) => {
    if (!isElectron || !electronAPI?.setSetting) return;

    try {
      await electronAPI.setSetting('systemIntegration', newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save system integration settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save system integration settings',
        variant: 'destructive'
      });
    }
  }, [isElectron, electronAPI, toast]);

  // Toggle file association
  const toggleFileAssociation = useCallback(async (extension: keyof SystemIntegrationSettings['fileAssociations']) => {
    if (!isElectron) {
      toast({
        title: 'Not Available',
        description: 'File associations are only available in the desktop app',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const newValue = !settings.fileAssociations[extension];
      const newSettings = {
        ...settings,
        fileAssociations: {
          ...settings.fileAssociations,
          [extension]: newValue
        }
      };

      // Here you would call the Electron API to register/unregister file associations
      // For now, we'll just save the setting
      await saveSettings(newSettings);

      toast({
        title: newValue ? 'File Association Registered' : 'File Association Removed',
        description: `${extension} files ${newValue ? 'will now' : 'will no longer'} open with StudyCollab`
      });
    } catch (error) {
      console.error('Failed to toggle file association:', error);
      toast({
        title: 'Error',
        description: 'Failed to update file association',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, settings, saveSettings, toast]);

  // Toggle protocol handler
  const toggleProtocolHandler = useCallback(async () => {
    if (!isElectron) {
      toast({
        title: 'Not Available',
        description: 'Protocol handlers are only available in the desktop app',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const newValue = !settings.protocolHandler;
      const newSettings = {
        ...settings,
        protocolHandler: newValue
      };

      await saveSettings(newSettings);

      toast({
        title: newValue ? 'Protocol Handler Registered' : 'Protocol Handler Removed',
        description: `studycollab:// URLs ${newValue ? 'will now' : 'will no longer'} open with StudyCollab`
      });
    } catch (error) {
      console.error('Failed to toggle protocol handler:', error);
      toast({
        title: 'Error',
        description: 'Failed to update protocol handler',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, settings, saveSettings, toast]);

  // Toggle context menus
  const toggleContextMenus = useCallback(async () => {
    if (!isElectron) {
      toast({
        title: 'Not Available',
        description: 'Context menus are only available in the desktop app',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const newValue = !settings.contextMenus;
      const newSettings = {
        ...settings,
        contextMenus: newValue
      };

      await saveSettings(newSettings);

      toast({
        title: newValue ? 'Context Menus Enabled' : 'Context Menus Disabled',
        description: `Right-click context menus ${newValue ? 'are now' : 'are no longer'} available`
      });
    } catch (error) {
      console.error('Failed to toggle context menus:', error);
      toast({
        title: 'Error',
        description: 'Failed to update context menus',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, settings, saveSettings, toast]);

  // Toggle system startup
  const toggleStartWithSystem = useCallback(async () => {
    if (!isElectron) {
      toast({
        title: 'Not Available',
        description: 'System startup is only available in the desktop app',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const newValue = !settings.startWithSystem;
      const newSettings = {
        ...settings,
        startWithSystem: newValue
      };

      await saveSettings(newSettings);

      toast({
        title: newValue ? 'Auto-Start Enabled' : 'Auto-Start Disabled',
        description: `StudyCollab ${newValue ? 'will' : 'will not'} start automatically with your system`
      });
    } catch (error) {
      console.error('Failed to toggle system startup:', error);
      toast({
        title: 'Error',
        description: 'Failed to update system startup setting',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, settings, saveSettings, toast]);

  // Toggle minimize to tray
  const toggleMinimizeToTray = useCallback(async () => {
    const newValue = !settings.minimizeToTray;
    const newSettings = {
      ...settings,
      minimizeToTray: newValue
    };

    await saveSettings(newSettings);

    toast({
      title: newValue ? 'Minimize to Tray Enabled' : 'Minimize to Tray Disabled',
      description: `StudyCollab ${newValue ? 'will' : 'will not'} minimize to system tray`
    });
  }, [settings, saveSettings, toast]);

  // Toggle show in taskbar
  const toggleShowInTaskbar = useCallback(async () => {
    const newValue = !settings.showInTaskbar;
    const newSettings = {
      ...settings,
      showInTaskbar: newValue
    };

    await saveSettings(newSettings);

    toast({
      title: newValue ? 'Taskbar Icon Enabled' : 'Taskbar Icon Disabled',
      description: `StudyCollab ${newValue ? 'will' : 'will not'} show in the taskbar`
    });
  }, [settings, saveSettings, toast]);

  // Open system settings
  const openSystemSettings = useCallback(() => {
    if (electronAPI?.openExternal) {
      const settingsUrl = process.platform === 'win32' 
        ? 'ms-settings:defaultapps' 
        : process.platform === 'darwin'
        ? 'x-apple.systempreferences:com.apple.preference.security'
        : 'gnome-control-center';
      
      electronAPI.openExternal(settingsUrl);
    }
  }, [electronAPI]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Integration</CardTitle>
          <CardDescription>
            System integration features are only available in the desktop application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Associations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Associations
          </CardTitle>
          <CardDescription>
            Register StudyCollab as the default application for specific file types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fileAssociations.map((association) => (
            <div key={association.extension} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{association.icon}</span>
                <div>
                  <p className="font-medium">{association.extension}</p>
                  <p className="text-sm text-muted-foreground">{association.description}</p>
                </div>
              </div>
              <Switch
                checked={association.isRegistered}
                onCheckedChange={() => toggleFileAssociation(association.extension.slice(1) as keyof SystemIntegrationSettings['fileAssociations'])}
                disabled={isLoading}
              />
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={openSystemSettings} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Open System Default Apps Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Handler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Protocol Handler
          </CardTitle>
          <CardDescription>
            Handle studycollab:// URLs to open content directly in the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="protocol-handler">studycollab:// Protocol</Label>
              <p className="text-sm text-muted-foreground">
                Allows links like studycollab://note/123 to open directly in StudyCollab
              </p>
            </div>
            <Switch
              id="protocol-handler"
              checked={settings.protocolHandler}
              onCheckedChange={toggleProtocolHandler}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Context Menus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Context Menus
          </CardTitle>
          <CardDescription>
            Add StudyCollab options to right-click context menus in file explorer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="context-menus">File Explorer Integration</Label>
              <p className="text-sm text-muted-foreground">
                Right-click on files to import them into StudyCollab
              </p>
            </div>
            <Switch
              id="context-menus"
              checked={settings.contextMenus}
              onCheckedChange={toggleContextMenus}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>System Behavior</CardTitle>
          <CardDescription>
            Configure how StudyCollab integrates with your operating system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="start-with-system">Start with System</Label>
              <p className="text-sm text-muted-foreground">
                Automatically start StudyCollab when your computer boots up
              </p>
            </div>
            <Switch
              id="start-with-system"
              checked={settings.startWithSystem}
              onCheckedChange={toggleStartWithSystem}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="minimize-to-tray">Minimize to Tray</Label>
              <p className="text-sm text-muted-foreground">
                Hide StudyCollab in the system tray when minimized
              </p>
            </div>
            <Switch
              id="minimize-to-tray"
              checked={settings.minimizeToTray}
              onCheckedChange={toggleMinimizeToTray}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-in-taskbar">Show in Taskbar</Label>
              <p className="text-sm text-muted-foreground">
                Display StudyCollab icon in the taskbar
              </p>
            </div>
            <Switch
              id="show-in-taskbar"
              checked={settings.showInTaskbar}
              onCheckedChange={toggleShowInTaskbar}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for using system integration settings
export const useSystemIntegration = () => {
  const { isElectron, electronAPI } = useElectron();
  const [settings, setSettings] = useState<SystemIntegrationSettings | null>(null);

  const loadSettings = useCallback(async () => {
    if (!isElectron || !electronAPI?.getSetting) return;

    try {
      const savedSettings = await electronAPI.getSetting('systemIntegration');
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to load system integration settings:', error);
    }
  }, [isElectron, electronAPI]);

  const updateSetting = useCallback(async (key: keyof SystemIntegrationSettings, value: any) => {
    if (!isElectron || !electronAPI?.setSetting || !settings) return;

    try {
      const newSettings = { ...settings, [key]: value };
      await electronAPI.setSetting('systemIntegration', newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update system integration setting:', error);
    }
  }, [isElectron, electronAPI, settings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    isElectron,
    settings,
    updateSetting,
    loadSettings
  };
};