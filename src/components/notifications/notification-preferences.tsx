'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Bell, BellOff, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

interface NotificationPreferences {
  // General settings
  enabled: boolean
  desktopNotifications: boolean
  soundEnabled: boolean
  
  // Task notifications
  taskReminders: boolean
  taskReminderTiming: 'early' | 'normal' | 'late'
  taskCompletionNotifications: boolean
  
  // Study group notifications
  groupMessages: boolean
  groupJoinRequests: boolean
  groupMemberChanges: boolean
  groupResourceSharing: boolean
  
  // Note notifications
  noteSharing: boolean
  noteComments: boolean
  noteCollaboration: boolean
  
  // System notifications
  systemErrors: boolean
  systemWarnings: boolean
  syncNotifications: boolean
  
  // Quiet hours
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  desktopNotifications: true,
  soundEnabled: true,
  taskReminders: true,
  taskReminderTiming: 'normal',
  taskCompletionNotifications: true,
  groupMessages: true,
  groupJoinRequests: true,
  groupMemberChanges: true,
  groupResourceSharing: true,
  noteSharing: true,
  noteComments: true,
  noteCollaboration: true,
  systemErrors: true,
  systemWarnings: true,
  syncNotifications: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
}

export function NotificationPreferencesComponent() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notification-preferences')
      if (saved) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) })
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    }
  }, [])

  const savePreferences = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(preferences))
      
      // Request desktop notification permission if enabled
      if (preferences.desktopNotifications && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission()
        }
      }
      
      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been updated.'
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save notification preferences.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setPreferences(defaultPreferences)
    toast({
      title: 'Reset to Defaults',
      description: 'Notification preferences have been reset to default values.'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
        </div>
        <div className="flex items-center gap-2">
          {preferences.enabled ? (
            <Bell className="h-5 w-5 text-green-500" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Control overall notification behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Notifications</Label>
            <Switch
              id="enabled"
              checked={preferences.enabled}
              onCheckedChange={(checked) => updatePreference('enabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="desktop">Desktop Notifications</Label>
            <Switch
              id="desktop"
              checked={preferences.desktopNotifications}
              onCheckedChange={(checked) => updatePreference('desktopNotifications', checked)}
              disabled={!preferences.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sound">Sound Notifications</Label>
            <Switch
              id="sound"
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
              disabled={!preferences.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Task Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Task Notifications</CardTitle>
          <CardDescription>
            Configure notifications for tasks and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="task-reminders">Task Reminders</Label>
            <Switch
              id="task-reminders"
              checked={preferences.taskReminders}
              onCheckedChange={(checked) => updatePreference('taskReminders', checked)}
              disabled={!preferences.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-timing">Reminder Timing</Label>
            <Select
              value={preferences.taskReminderTiming}
              onValueChange={(value: 'early' | 'normal' | 'late') => 
                updatePreference('taskReminderTiming', value)
              }
              disabled={!preferences.enabled || !preferences.taskReminders}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="early">Early</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="task-completion">Task Completion</Label>
            <Switch
              id="task-completion"
              checked={preferences.taskCompletionNotifications}
              onCheckedChange={(checked) => updatePreference('taskCompletionNotifications', checked)}
              disabled={!preferences.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Study Group Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Study Group Notifications</CardTitle>
          <CardDescription>
            Configure notifications for study group activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="group-messages">Group Messages</Label>
            <Switch
              id="group-messages"
              checked={preferences.groupMessages}
              onCheckedChange={(checked) => updatePreference('groupMessages', checked)}
              disabled={!preferences.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="join-requests">Join Requests</Label>
            <Switch
              id="join-requests"
              checked={preferences.groupJoinRequests}
              onCheckedChange={(checked) => updatePreference('groupJoinRequests', checked)}
              disabled={!preferences.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="member-changes">Member Changes</Label>
            <Switch
              id="member-changes"
              checked={preferences.groupMemberChanges}
              onCheckedChange={(checked) => updatePreference('groupMemberChanges', checked)}
              disabled={!preferences.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="resource-sharing">Resource Sharing</Label>
            <Switch
              id="resource-sharing"
              checked={preferences.groupResourceSharing}
              onCheckedChange={(checked) => updatePreference('groupResourceSharing', checked)}
              disabled={!preferences.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set times when notifications should be silenced
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
            <Switch
              id="quiet-hours"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
              disabled={!preferences.enabled}
            />
          </div>
          
          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                <input
                  id="quiet-start"
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <input
                  id="quiet-end"
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <Button onClick={savePreferences} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}

// Export the preferences type and default values for use in other components
export { defaultPreferences }
export type { NotificationPreferences }

