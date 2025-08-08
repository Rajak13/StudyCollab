'use client';

import { GlobalShortcutsManager } from '@/components/electron/global-shortcuts-manager';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Download, Palette, Settings, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI);
    setPlatform(typeof navigator !== 'undefined' ? navigator.platform : '');
  }, []);

  const handleNotificationTest = () => {
    if (window.electronAPI?.showReminderNotification) {
      window.electronAPI.showReminderNotification(
        'Test Reminder',
        'This is a test reminder notification from StudyCollab!'
      );
    } else {
      toast({
        title: 'Test Notification',
        description: 'This is a test notification (web version)'
      });
    }
  };

  const handleGroupNotificationTest = () => {
    if (window.electronAPI?.showGroupActivityNotification) {
      window.electronAPI.showGroupActivityNotification(
        'Study Group Alpha',
        'shared a new document',
        'John Doe'
      );
    } else {
      toast({
        title: 'Group Activity',
        description: 'John Doe shared a new document in Study Group Alpha'
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your StudyCollab preferences and desktop app settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="desktop">Desktop App</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of StudyCollab
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme">Theme</Label>
                  <Select defaultValue="system">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode">Compact mode</Label>
                  <Switch id="compact-mode" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>
                  Set your language and regional preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Control when and how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="task-reminders">Task reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming task deadlines
                    </p>
                  </div>
                  <Switch id="task-reminders" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="group-activities">Group activities</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about study group activities
                    </p>
                  </div>
                  <Switch id="group-activities" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-notifications">System notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications in your system tray
                    </p>
                  </div>
                  <Switch id="system-notifications" defaultChecked={isElectron} disabled={!isElectron} />
                </div>

                {isElectron && (
                  <div className="pt-4 border-t space-y-2">
                    <h4 className="font-medium">Test Notifications</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleNotificationTest}>
                        Test Reminder
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGroupNotificationTest}>
                        Test Group Activity
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shortcuts" className="space-y-6">
            <GlobalShortcutsManager />
          </TabsContent>

          <TabsContent value="desktop" className="space-y-6">
            {isElectron ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Desktop App Settings
                    </CardTitle>
                    <CardDescription>
                      Configure desktop-specific features and behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-start">Start with system</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically start StudyCollab when you log in
                        </p>
                      </div>
                      <Switch id="auto-start" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="minimize-to-tray">Minimize to system tray</Label>
                        <p className="text-sm text-muted-foreground">
                          Keep StudyCollab running in the background
                        </p>
                      </div>
                      <Switch id="minimize-to-tray" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="close-to-tray">Close to system tray</Label>
                        <p className="text-sm text-muted-foreground">
                          Clicking X minimizes to tray instead of closing
                        </p>
                      </div>
                      <Switch id="close-to-tray" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-update">Automatic updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically download and install updates
                        </p>
                      </div>
                      <Switch id="auto-update" defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>File Associations</CardTitle>
                    <CardDescription>
                      Configure which file types open with StudyCollab
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">.scnote</p>
                          <p className="text-sm text-muted-foreground">StudyCollab Notes</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">.sctask</p>
                          <p className="text-sm text-muted-foreground">StudyCollab Tasks</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">.scboard</p>
                          <p className="text-sm text-muted-foreground">Study Boards</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Drag & Drop</CardTitle>
                    <CardDescription>
                      Configure how files are handled when dropped into StudyCollab
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-import">Auto-import dropped files</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically import files when dropped into the app
                        </p>
                      </div>
                      <Switch id="auto-import" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-drop-zone">Show drop zone overlay</Label>
                        <p className="text-sm text-muted-foreground">
                          Display visual feedback when dragging files over the app
                        </p>
                      </div>
                      <Switch id="show-drop-zone" defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Desktop App
                  </CardTitle>
                  <CardDescription>
                    Desktop app features are only available when using the StudyCollab desktop application.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Download StudyCollab Desktop</h3>
                    <p className="text-muted-foreground mb-4">
                      Get the full StudyCollab experience with offline support, system integration, and more.
                    </p>
                    <Button>Download for {typeof navigator !== 'undefined' ? navigator.platform : 'your system'}</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control your privacy settings and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">Usage analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve StudyCollab by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch id="analytics" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="crash-reports">Crash reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send crash reports to help fix bugs
                    </p>
                  </div>
                  <Switch id="crash-reports" defaultChecked />
                </div>

                {isElectron && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="local-encryption">Local data encryption</Label>
                      <p className="text-sm text-muted-foreground">
                        Encrypt locally stored data on your device
                      </p>
                    </div>
                    <Switch id="local-encryption" defaultChecked />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}