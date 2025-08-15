'use client';

import { useToast } from '@/components/ui/use-toast';
import { useElectron } from '@/hooks/use-electron';
import { useCallback, useEffect, useState } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  actions?: Array<{ type: string; text: string }>;
  tag?: string;
}

interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  queue: NotificationOptions[];
}

export function DesktopNotifications() {
  const { isElectron, electronAPI } = useElectron();
  const { toast } = useToast();
  const [notificationState, setNotificationState] = useState<NotificationState>({
    isSupported: false,
    permission: 'default',
    queue: []
  });

  // Initialize notification system
  useEffect(() => {
    const checkNotificationSupport = () => {
      if (isElectron) {
        // Electron always supports notifications
        setNotificationState(prev => ({
          ...prev,
          isSupported: true,
          permission: 'granted'
        }));
      } else if ('Notification' in window) {
        setNotificationState(prev => ({
          ...prev,
          isSupported: true,
          permission: Notification.permission
        }));
      }
    };

    checkNotificationSupport();
  }, [isElectron]);

  // Request notification permission for web
  const requestPermission = useCallback(async () => {
    if (!isElectron && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationState(prev => ({
        ...prev,
        permission
      }));
      return permission === 'granted';
    }
    return true; // Electron doesn't need permission
  }, [isElectron]);

  // Show system notification
  const showSystemNotification = useCallback((options: NotificationOptions) => {
    if (isElectron && electronAPI?.showSystemNotification) {
      electronAPI.showSystemNotification(options);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        silent: options.silent,
        tag: options.tag
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } else {
      // Fallback to toast notification
      toast({
        title: options.title,
        description: options.body,
      });
    }
  }, [isElectron, electronAPI, toast]);

  // Show reminder notification
  const showReminderNotification = useCallback((title: string, body: string, reminderData?: any) => {
    if (isElectron && electronAPI?.showReminderNotification) {
      electronAPI.showReminderNotification(title, body, reminderData);
    } else {
      showSystemNotification({
        title: `📚 ${title}`,
        body,
        urgency: 'normal',
        tag: 'reminder',
        actions: [
          { type: 'snooze', text: 'Snooze 10min' },
          { type: 'complete', text: 'Mark Complete' }
        ]
      });
    }
  }, [isElectron, electronAPI, showSystemNotification]);

  // Show group activity notification
  const showGroupActivityNotification = useCallback((groupName: string, activity: string, userName?: string) => {
    const title = `👥 ${groupName}`;
    const body = userName ? `${userName} ${activity}` : activity;
    
    if (isElectron && electronAPI?.showGroupActivityNotification) {
      electronAPI.showGroupActivityNotification(groupName, activity, userName);
    } else {
      showSystemNotification({
        title,
        body,
        urgency: 'low',
        tag: 'group-activity',
        actions: [
          { type: 'view', text: 'View Group' },
          { type: 'dismiss', text: 'Dismiss' }
        ]
      });
    }
  }, [isElectron, electronAPI, showSystemNotification]);

  // Show task reminder notification
  const showTaskReminderNotification = useCallback((taskTitle: string, dueDate: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const urgency = priority === 'high' ? 'critical' : priority === 'medium' ? 'normal' : 'low';
    const icon = priority === 'high' ? '🚨' : priority === 'medium' ? '⏰' : '📝';
    
    showReminderNotification(
      `${icon} Task Due Soon`,
      `${taskTitle} is due ${dueDate}`,
      { taskTitle, dueDate, priority }
    );
  }, [showReminderNotification]);

  // Show study session notification
  const showStudySessionNotification = useCallback((sessionType: 'start' | 'break' | 'end', duration?: number) => {
    const notifications = {
      start: {
        title: '🎯 Study Session Started',
        body: `Focus time! Your study session has begun.`
      },
      break: {
        title: '☕ Break Time',
        body: `Take a ${duration || 5} minute break. You've earned it!`
      },
      end: {
        title: '✅ Study Session Complete',
        body: `Great work! You've completed your study session.`
      }
    };

    const notification = notifications[sessionType];
    showSystemNotification({
      ...notification,
      urgency: 'normal',
      tag: 'study-session'
    });
  }, [showSystemNotification]);

  // Show collaboration notification
  const showCollaborationNotification = useCallback((type: 'join' | 'leave' | 'edit' | 'comment', userName: string, resourceName: string) => {
    const notifications = {
      join: `${userName} joined the collaboration`,
      leave: `${userName} left the collaboration`,
      edit: `${userName} made changes to ${resourceName}`,
      comment: `${userName} added a comment to ${resourceName}`
    };

    showSystemNotification({
      title: '🤝 Collaboration Update',
      body: notifications[type],
      urgency: 'low',
      tag: 'collaboration'
    });
  }, [showSystemNotification]);

  // Listen for notification events from Electron
  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    const handleNotificationClicked = (event: any, data: { tag?: string; action?: string }) => {
      console.log('Notification clicked:', data);
      
      switch (data.tag) {
        case 'reminder':
          if (data.action === 'snooze') {
            toast({
              title: 'Reminder Snoozed',
              description: 'Reminder will appear again in 10 minutes'
            });
          } else if (data.action === 'complete') {
            toast({
              title: 'Task Completed',
              description: 'Great job! Task marked as complete'
            });
          }
          break;
          
        case 'group-activity':
          if (data.action === 'view') {
            // Navigate to study groups
            window.location.href = '/study-groups';
          }
          break;
          
        default:
          // Focus the main window
          window.focus();
      }
    };

    const handleNotificationAction = (event: any, data: { tag?: string; action?: string; index?: number }) => {
      console.log('Notification action:', data);
      handleNotificationClicked(event, data);
    };

    electronAPI.on('notification-clicked', handleNotificationClicked);
    electronAPI.on('notification-action', handleNotificationAction);

    return () => {
      electronAPI.off('notification-clicked', handleNotificationClicked);
      electronAPI.off('notification-action', handleNotificationAction);
    };
  }, [isElectron, electronAPI, toast]);

  // Expose notification functions globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).desktopNotifications = {
        showSystemNotification,
        showReminderNotification,
        showGroupActivityNotification,
        showTaskReminderNotification,
        showStudySessionNotification,
        showCollaborationNotification,
        requestPermission
      };
    }
  }, [
    showSystemNotification,
    showReminderNotification,
    showGroupActivityNotification,
    showTaskReminderNotification,
    showStudySessionNotification,
    showCollaborationNotification,
    requestPermission
  ]);

  return null; // This component doesn't render anything visible
}

// Export notification functions for use in other components
export const useDesktopNotifications = () => {
  const { isElectron, electronAPI } = useElectron();
  const { toast } = useToast();

  const showSystemNotification = useCallback((options: NotificationOptions) => {
    if (isElectron && electronAPI?.showSystemNotification) {
      electronAPI.showSystemNotification(options);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        silent: options.silent,
        tag: options.tag
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);
    } else {
      toast({
        title: options.title,
        description: options.body,
      });
    }
  }, [isElectron, electronAPI, toast]);

  const showReminderNotification = useCallback((title: string, body: string, reminderData?: any) => {
    if (isElectron && electronAPI?.showReminderNotification) {
      electronAPI.showReminderNotification(title, body, reminderData);
    } else {
      showSystemNotification({
        title: `📚 ${title}`,
        body,
        urgency: 'normal',
        tag: 'reminder'
      });
    }
  }, [isElectron, electronAPI, showSystemNotification]);

  const showGroupActivityNotification = useCallback((groupName: string, activity: string, userName?: string) => {
    const title = `👥 ${groupName}`;
    const body = userName ? `${userName} ${activity}` : activity;
    
    if (isElectron && electronAPI?.showGroupActivityNotification) {
      electronAPI.showGroupActivityNotification(groupName, activity, userName);
    } else {
      showSystemNotification({
        title,
        body,
        urgency: 'low',
        tag: 'group-activity'
      });
    }
  }, [isElectron, electronAPI, showSystemNotification]);

  return {
    isElectron,
    showSystemNotification,
    showReminderNotification,
    showGroupActivityNotification
  };
};