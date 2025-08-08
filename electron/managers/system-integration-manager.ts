import { app, globalShortcut, Menu, Notification, protocol, shell } from 'electron';
import { join } from 'path';
import { WindowManager } from './window-manager';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  actions?: Array<{ type: string; text: string }>;
  tag?: string;
}

export interface GlobalShortcut {
  accelerator: string;
  action: string;
  description: string;
}

interface ReminderData {
  id?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export class SystemIntegrationManager {
  private windowManager: WindowManager;
  private registeredShortcuts: Map<string, GlobalShortcut> = new Map();
  private notificationQueue: NotificationOptions[] = [];
  private isNotificationSupported: boolean = false;

  constructor() {
    this.windowManager = new WindowManager();
    this.isNotificationSupported = Notification.isSupported();
  }

  setWindowManager(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  async initialize() {
    await this.setupFileAssociations();
    this.setupProtocolHandlers();
    this.setupSystemMenu();
    
    // Register shortcuts with retry mechanism
    this.registerDefaultShortcutsWithRetry();
    
    this.setupDragAndDrop();
    
    // Process any queued notifications
    this.processNotificationQueue();
  }

  // ===== NATIVE SYSTEM NOTIFICATIONS =====
  
  showNotification(options: NotificationOptions): void {
    if (!this.isNotificationSupported) {
      console.warn('System notifications are not supported on this platform');
      return;
    }

    // Queue notification if app is not ready
    if (!app.isReady()) {
      this.notificationQueue.push(options);
      return;
    }

    const notificationOptions: Electron.NotificationConstructorOptions = {
      title: options.title,
      body: options.body,
      icon: options.icon || this.getDefaultNotificationIcon(),
      silent: options.silent || false,
      urgency: options.urgency || 'normal',
    };

    // Add actions if supported (only on some platforms)
    if (options.actions && options.actions.length > 0) {
      notificationOptions.actions = options.actions.map(action => ({
        type: 'button' as const,
        text: action.text
      }));
    }

    const notification = new Notification(notificationOptions);

    notification.on('click', () => {
      this.windowManager.focusMainWindow();
      
      // Send notification click event to renderer
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('notification-clicked', {
          tag: options.tag,
          action: 'click'
        });
      }
    });

    notification.on('action', (event, index) => {
      const action = options.actions?.[index];
      if (action) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('notification-action', {
            tag: options.tag,
            action: action.type,
            index
          });
        }
      }
    });

    notification.show();
  }

  showReminderNotification(title: string, body: string, reminderData?: ReminderData): void {
    this.showNotification({
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

  showGroupActivityNotification(groupName: string, activity: string, userName?: string): void {
    const title = `👥 ${groupName}`;
    const body = userName ? `${userName} ${activity}` : activity;
    
    this.showNotification({
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

  private processNotificationQueue(): void {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        this.showNotification(notification);
      }
    }
  }

  private getDefaultNotificationIcon(): string {
    const iconName = process.platform === 'win32' ? 'icon.ico' : 
                     process.platform === 'darwin' ? 'icon.icns' : 
                     'icon.png';
    return join(__dirname, '../../assets', iconName);
  }

  // ===== GLOBAL KEYBOARD SHORTCUTS =====

  registerGlobalShortcut(accelerator: string, action: string, description: string): boolean {
    try {
      const success = globalShortcut.register(accelerator, () => {
        this.handleShortcutAction(action);
      });

      if (success) {
        this.registeredShortcuts.set(accelerator, { accelerator, action, description });
        console.log(`Registered global shortcut: ${accelerator} -> ${action}`);
      } else {
        console.warn(`Failed to register global shortcut: ${accelerator}`);
      }

      return success;
    } catch (error) {
      console.error(`Error registering shortcut ${accelerator}:`, error);
      return false;
    }
  }

  unregisterGlobalShortcut(accelerator: string): void {
    globalShortcut.unregister(accelerator);
    this.registeredShortcuts.delete(accelerator);
  }

  getRegisteredShortcuts(): GlobalShortcut[] {
    return Array.from(this.registeredShortcuts.values());
  }

  private registerDefaultShortcuts(): void {
    // Only register shortcuts if app is ready
    if (!app.isReady()) {
      console.warn('App not ready, skipping global shortcut registration');
      return;
    }

    // Quick access to main window
    this.registerGlobalShortcut('CommandOrControl+Shift+S', 'toggle-main-window', 'Toggle StudyCollab window');
    
    // Quick note creation
    this.registerGlobalShortcut('CommandOrControl+Shift+N', 'new-note', 'Create new note');
    
    // Quick capture
    this.registerGlobalShortcut('CommandOrControl+Shift+C', 'quick-capture', 'Quick capture text/idea');
    
    // Search
    this.registerGlobalShortcut('CommandOrControl+Shift+F', 'global-search', 'Global search');
    
    // Show today's tasks
    this.registerGlobalShortcut('CommandOrControl+Shift+T', 'show-tasks', 'Show today\'s tasks');
  }

  private registerDefaultShortcutsWithRetry(): void {
    // Try to register shortcuts immediately
    this.registerDefaultShortcuts();
    
    // If app is not ready, try again after a delay
    if (!app.isReady()) {
      setTimeout(() => {
        console.log('Retrying global shortcut registration...');
        this.registerDefaultShortcuts();
      }, 1000);
    }
  }

  private handleShortcutAction(action: string): void {
    const mainWindow = this.windowManager.getMainWindow();
    
    switch (action) {
      case 'toggle-main-window':
        if (mainWindow) {
          if (mainWindow.isVisible() && mainWindow.isFocused()) {
            mainWindow.hide();
          } else {
            this.windowManager.focusMainWindow();
          }
        }
        break;
        
      case 'new-note':
        this.windowManager.focusMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('global-shortcut', 'new-note');
        }
        break;
        
      case 'quick-capture':
        this.windowManager.focusMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('global-shortcut', 'quick-capture');
        }
        break;
        
      case 'global-search':
        this.windowManager.focusMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('global-shortcut', 'global-search');
        }
        break;
        
      case 'show-tasks':
        this.windowManager.focusMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('global-shortcut', 'show-tasks');
        }
        break;
        
      default:
        console.warn(`Unknown shortcut action: ${action}`);
    }
  }

  // ===== SYSTEM MENU INTEGRATION =====

  setupSystemMenu(): void {
    if (process.platform === 'darwin') {
      this.setupMacOSMenu();
    } else {
      this.setupWindowsLinuxMenu();
    }
  }

  private setupMacOSMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'StudyCollab',
        submenu: [
          {
            label: 'About StudyCollab',
            role: 'about'
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'Cmd+,',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/settings');
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          { type: 'separator' },
          {
            label: 'Hide StudyCollab',
            accelerator: 'Cmd+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Cmd+Alt+H',
            role: 'hideOthers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          { type: 'separator' },
          {
            label: 'Quit StudyCollab',
            accelerator: 'Cmd+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'New Note',
            accelerator: 'Cmd+N',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('global-shortcut', 'new-note');
              }
            }
          },
          {
            label: 'New Task',
            accelerator: 'Cmd+Shift+N',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('global-shortcut', 'new-task');
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Import File...',
            accelerator: 'Cmd+I',
            click: () => {
              this.handleFileImport();
            }
          },
          { type: 'separator' },
          {
            label: 'Close Window',
            accelerator: 'Cmd+W',
            role: 'close'
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'Shift+Cmd+Z', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
          { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
          { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' },
          { label: 'Select All', accelerator: 'Cmd+A', role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Dashboard',
            accelerator: 'Cmd+1',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/dashboard');
              }
            }
          },
          {
            label: 'Notes',
            accelerator: 'Cmd+2',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/notes');
              }
            }
          },
          {
            label: 'Tasks',
            accelerator: 'Cmd+3',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/tasks');
              }
            }
          },
          {
            label: 'Study Groups',
            accelerator: 'Cmd+4',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/study-groups');
              }
            }
          },
          { type: 'separator' },
          { label: 'Reload', accelerator: 'Cmd+R', role: 'reload' },
          { label: 'Force Reload', accelerator: 'Cmd+Shift+R', role: 'forceReload' },
          { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: 'Actual Size', accelerator: 'Cmd+0', role: 'resetZoom' },
          { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomIn' },
          { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: 'Toggle Fullscreen', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
          { label: 'Close', accelerator: 'Cmd+W', role: 'close' },
          { type: 'separator' },
          { label: 'Bring All to Front', role: 'front' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About StudyCollab',
            click: () => {
              shell.openExternal('https://studycollab.app/about');
            }
          },
          {
            label: 'Keyboard Shortcuts',
            accelerator: 'Cmd+/',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('show-shortcuts-help');
              }
            }
          },
          {
            label: 'Report Issue',
            click: () => {
              shell.openExternal('https://github.com/studycollab/studycollab/issues');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupWindowsLinuxMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Note',
            accelerator: 'Ctrl+N',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('global-shortcut', 'new-note');
              }
            }
          },
          {
            label: 'New Task',
            accelerator: 'Ctrl+Shift+N',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('global-shortcut', 'new-task');
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Import File...',
            accelerator: 'Ctrl+I',
            click: () => {
              this.handleFileImport();
            }
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'Ctrl+,',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/settings');
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'win32' ? 'Alt+F4' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'Ctrl+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'Ctrl+Y', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'Ctrl+X', role: 'cut' },
          { label: 'Copy', accelerator: 'Ctrl+C', role: 'copy' },
          { label: 'Paste', accelerator: 'Ctrl+V', role: 'paste' },
          { label: 'Select All', accelerator: 'Ctrl+A', role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Dashboard',
            accelerator: 'Ctrl+1',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/dashboard');
              }
            }
          },
          {
            label: 'Notes',
            accelerator: 'Ctrl+2',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/notes');
              }
            }
          },
          {
            label: 'Tasks',
            accelerator: 'Ctrl+3',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/tasks');
              }
            }
          },
          {
            label: 'Study Groups',
            accelerator: 'Ctrl+4',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('navigate-to', '/study-groups');
              }
            }
          },
          { type: 'separator' },
          { label: 'Reload', accelerator: 'Ctrl+R', role: 'reload' },
          { label: 'Force Reload', accelerator: 'Ctrl+Shift+R', role: 'forceReload' },
          { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: 'Actual Size', accelerator: 'Ctrl+0', role: 'resetZoom' },
          { label: 'Zoom In', accelerator: 'Ctrl+Plus', role: 'zoomIn' },
          { label: 'Zoom Out', accelerator: 'Ctrl+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About StudyCollab',
            click: () => {
              shell.openExternal('https://studycollab.app/about');
            }
          },
          {
            label: 'Keyboard Shortcuts',
            accelerator: 'Ctrl+/',
            click: () => {
              const mainWindow = this.windowManager.getMainWindow();
              if (mainWindow) {
                this.windowManager.focusMainWindow();
                mainWindow.webContents.send('show-shortcuts-help');
              }
            }
          },
          {
            label: 'Report Issue',
            click: () => {
              shell.openExternal('https://github.com/studycollab/studycollab/issues');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  // ===== FILE ASSOCIATION HANDLING =====

  async setupFileAssociations(): Promise<void> {
    // Register custom protocol for StudyCollab files
    if (!app.isDefaultProtocolClient('studycollab')) {
      app.setAsDefaultProtocolClient('studycollab');
    }

    // Handle file associations on Windows/Linux
    if (process.platform === 'win32' || process.platform === 'linux') {
      this.setupDesktopFileAssociations();
    }
  }

  private setupDesktopFileAssociations(): void {
    // Register file extensions
    const extensions = ['.scnote', '.sctask', '.scboard'];
    
    extensions.forEach(ext => {
      try {
        app.setAsDefaultProtocolClient(`studycollab-file${ext}`);
      } catch (error) {
        console.warn(`Failed to register file association for ${ext}:`, error);
      }
    });
  }

  private setupProtocolHandlers(): void {
    // Handle studycollab:// protocol URLs
    protocol.registerHttpProtocol('studycollab', (request, callback) => {
      const url = request.url.replace('studycollab://', '');
      this.handleProtocolUrl(url);
      callback({ statusCode: 200 });
    });
  }

  handleFileOpen(filePath: string): void {
    console.log('Opening file:', filePath);
    
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) {
      // If no window exists, create one first
      this.windowManager.createMainWindow().then(() => {
        this.processFileOpen(filePath);
      });
    } else {
      this.windowManager.focusMainWindow();
      this.processFileOpen(filePath);
    }
  }

  private processFileOpen(filePath: string): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) return;

    // Determine file type and send appropriate event to renderer
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'scnote':
        mainWindow.webContents.send('open-file', { type: 'note', path: filePath });
        break;
      case 'sctask':
        mainWindow.webContents.send('open-file', { type: 'task', path: filePath });
        break;
      case 'scboard':
        mainWindow.webContents.send('open-file', { type: 'board', path: filePath });
        break;
      default:
        // Generic file import
        mainWindow.webContents.send('import-file', { path: filePath });
    }
  }

  handleProtocolUrl(url: string): void {
    console.log('Handling protocol URL:', url);
    
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      this.windowManager.focusMainWindow();
      mainWindow.webContents.send('protocol-url', url);
    }
  }

  // ===== DRAG AND DROP FILE HANDLING =====

  setupDragAndDrop(): void {
    // This will be handled in the renderer process, but we set up the IPC handlers here
    app.on('web-contents-created', (event, contents) => {
      contents.on('will-navigate', (event, navigationUrl) => {
        // Prevent navigation when files are dropped
        if (navigationUrl.startsWith('file://')) {
          event.preventDefault();
        }
      });
    });
  }

  private handleFileImport(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      this.windowManager.focusMainWindow();
      mainWindow.webContents.send('trigger-file-import');
    }
  }

  // ===== CLEANUP =====

  cleanup(): void {
    // Unregister all global shortcuts
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
    
    // Clear notification queue
    this.notificationQueue = [];
  }
}