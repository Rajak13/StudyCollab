'use client';

import { FileDropZone } from '@/components/desktop/file-drop-zone';
import { GlobalShortcutsManager } from '@/components/desktop/global-shortcuts-manager';
import { OfflineSyncStatus } from '@/components/desktop/offline-sync-status';
import { SystemIntegration } from '@/components/desktop/system-integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useElectron } from '@/hooks/use-electron';
import { Monitor, Smartphone } from 'lucide-react';

export default function DesktopSettingsPage() {
  const { isElectron } = useElectron();

  if (!isElectron) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Desktop Settings</h1>
            <p className="text-muted-foreground">
              Desktop-specific settings and features are only available in the StudyCollab desktop application.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Desktop App Required
              </CardTitle>
              <CardDescription>
                To access desktop-specific features like global shortcuts, file associations, 
                offline sync, and system integration, please download and install the StudyCollab desktop application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Smartphone className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Currently using web version</p>
                  <p className="text-sm text-muted-foreground">
                    You're accessing StudyCollab through your web browser. 
                    Download the desktop app for enhanced features and offline capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Desktop Settings</h1>
          <p className="text-muted-foreground">
            Configure desktop-specific features, shortcuts, and system integration options.
          </p>
        </div>

        <Tabs defaultValue="shortcuts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="sync">Offline Sync</TabsTrigger>
            <TabsTrigger value="integration">System Integration</TabsTrigger>
            <TabsTrigger value="files">File Handling</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="shortcuts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Keyboard Shortcuts</CardTitle>
                <CardDescription>
                  Set up system-wide keyboard shortcuts for quick access to StudyCollab features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GlobalShortcutsManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Offline Data & Synchronization</CardTitle>
                <CardDescription>
                  Manage offline data storage and synchronization with the cloud.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OfflineSyncStatus />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Integration</CardTitle>
                <CardDescription>
                  Configure how StudyCollab integrates with your operating system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemIntegration />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Handling & Drag-and-Drop</CardTitle>
                <CardDescription>
                  Configure how StudyCollab handles file imports and drag-and-drop operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileDropZone 
                  onFilesProcessed={(files) => {
                    console.log('Files processed in settings:', files);
                  }}
                  showPreview={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Desktop Notifications</CardTitle>
                <CardDescription>
                  Configure native desktop notifications for reminders, group activities, and system events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notification Types</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">📚 Study Reminders</p>
                          <p className="text-sm text-muted-foreground">Task due dates and study sessions</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">👥 Group Activities</p>
                          <p className="text-sm text-muted-foreground">Study group updates and collaboration</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">🔄 Sync Status</p>
                          <p className="text-sm text-muted-foreground">Data synchronization updates</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">⚡ System Events</p>
                          <p className="text-sm text-muted-foreground">App updates and system integration</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notification Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <p className="font-medium">✨ Native Integration</p>
                        <p className="text-sm text-muted-foreground">
                          Uses your operating system's native notification system for a seamless experience.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">🎯 Action Buttons</p>
                        <p className="text-sm text-muted-foreground">
                          Interactive notifications with quick action buttons for common tasks.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">🔕 Smart Timing</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications are shown at appropriate times and respect your system's Do Not Disturb settings.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-muted-foreground">
                    Desktop notifications work automatically when StudyCollab is running in the background. 
                    You can customize notification settings in your operating system's notification preferences.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}