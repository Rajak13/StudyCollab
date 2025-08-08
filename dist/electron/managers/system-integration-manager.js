"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemIntegrationManager = void 0;
const electron_1 = require("electron");
const path_1 = require("path");
const window_manager_1 = require("./window-manager");
class SystemIntegrationManager {
    constructor() {
        this.registeredShortcuts = new Map();
        this.notificationQueue = [];
        this.isNotificationSupported = false;
        this.windowManager = new window_manager_1.WindowManager();
        this.isNotificationSupported = electron_1.Notification.isSupported();
    }
    setWindowManager(windowManager) {
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
    showNotification(options) {
        if (!this.isNotificationSupported) {
            console.warn('System notifications are not supported on this platform');
            return;
        }
        // Queue notification if app is not ready
        if (!electron_1.app.isReady()) {
            this.notificationQueue.push(options);
            return;
        }
        const notificationOptions = {
            title: options.title,
            body: options.body,
            icon: options.icon || this.getDefaultNotificationIcon(),
            silent: options.silent || false,
            urgency: options.urgency || 'normal',
        };
        // Add actions if supported (only on some platforms)
        if (options.actions && options.actions.length > 0) {
            notificationOptions.actions = options.actions.map(action => ({
                type: 'button',
                text: action.text
            }));
        }
        const notification = new electron_1.Notification(notificationOptions);
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
    showReminderNotification(title, body, reminderData) {
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
    showGroupActivityNotification(groupName, activity, userName) {
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
    processNotificationQueue() {
        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();
            if (notification) {
                this.showNotification(notification);
            }
        }
    }
    getDefaultNotificationIcon() {
        const iconName = process.platform === 'win32' ? 'icon.ico' :
            process.platform === 'darwin' ? 'icon.icns' :
                'icon.png';
        return (0, path_1.join)(__dirname, '../../assets', iconName);
    }
    // ===== GLOBAL KEYBOARD SHORTCUTS =====
    registerGlobalShortcut(accelerator, action, description) {
        try {
            const success = electron_1.globalShortcut.register(accelerator, () => {
                this.handleShortcutAction(action);
            });
            if (success) {
                this.registeredShortcuts.set(accelerator, { accelerator, action, description });
                console.log(`Registered global shortcut: ${accelerator} -> ${action}`);
            }
            else {
                console.warn(`Failed to register global shortcut: ${accelerator}`);
            }
            return success;
        }
        catch (error) {
            console.error(`Error registering shortcut ${accelerator}:`, error);
            return false;
        }
    }
    unregisterGlobalShortcut(accelerator) {
        electron_1.globalShortcut.unregister(accelerator);
        this.registeredShortcuts.delete(accelerator);
    }
    getRegisteredShortcuts() {
        return Array.from(this.registeredShortcuts.values());
    }
    registerDefaultShortcuts() {
        // Only register shortcuts if app is ready
        if (!electron_1.app.isReady()) {
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
    registerDefaultShortcutsWithRetry() {
        // Try to register shortcuts immediately
        this.registerDefaultShortcuts();
        // If app is not ready, try again after a delay
        if (!electron_1.app.isReady()) {
            setTimeout(() => {
                console.log('Retrying global shortcut registration...');
                this.registerDefaultShortcuts();
            }, 1000);
        }
    }
    handleShortcutAction(action) {
        const mainWindow = this.windowManager.getMainWindow();
        switch (action) {
            case 'toggle-main-window':
                if (mainWindow) {
                    if (mainWindow.isVisible() && mainWindow.isFocused()) {
                        mainWindow.hide();
                    }
                    else {
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
    setupSystemMenu() {
        if (process.platform === 'darwin') {
            this.setupMacOSMenu();
        }
        else {
            this.setupWindowsLinuxMenu();
        }
    }
    setupMacOSMenu() {
        const template = [
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
                            electron_1.app.quit();
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
                            electron_1.shell.openExternal('https://studycollab.app/about');
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
                            electron_1.shell.openExternal('https://github.com/studycollab/studycollab/issues');
                        }
                    }
                ]
            }
        ];
        const menu = electron_1.Menu.buildFromTemplate(template);
        electron_1.Menu.setApplicationMenu(menu);
    }
    setupWindowsLinuxMenu() {
        const template = [
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
                            electron_1.app.quit();
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
                            electron_1.shell.openExternal('https://studycollab.app/about');
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
                            electron_1.shell.openExternal('https://github.com/studycollab/studycollab/issues');
                        }
                    }
                ]
            }
        ];
        const menu = electron_1.Menu.buildFromTemplate(template);
        electron_1.Menu.setApplicationMenu(menu);
    }
    // ===== FILE ASSOCIATION HANDLING =====
    async setupFileAssociations() {
        // Register custom protocol for StudyCollab files
        if (!electron_1.app.isDefaultProtocolClient('studycollab')) {
            electron_1.app.setAsDefaultProtocolClient('studycollab');
        }
        // Handle file associations on Windows/Linux
        if (process.platform === 'win32' || process.platform === 'linux') {
            this.setupDesktopFileAssociations();
        }
    }
    setupDesktopFileAssociations() {
        // Register file extensions
        const extensions = ['.scnote', '.sctask', '.scboard'];
        extensions.forEach(ext => {
            try {
                electron_1.app.setAsDefaultProtocolClient(`studycollab-file${ext}`);
            }
            catch (error) {
                console.warn(`Failed to register file association for ${ext}:`, error);
            }
        });
    }
    setupProtocolHandlers() {
        // Handle studycollab:// protocol URLs
        electron_1.protocol.registerHttpProtocol('studycollab', (request, callback) => {
            const url = request.url.replace('studycollab://', '');
            this.handleProtocolUrl(url);
            callback({ statusCode: 200 });
        });
    }
    handleFileOpen(filePath) {
        console.log('Opening file:', filePath);
        const mainWindow = this.windowManager.getMainWindow();
        if (!mainWindow) {
            // If no window exists, create one first
            this.windowManager.createMainWindow().then(() => {
                this.processFileOpen(filePath);
            });
        }
        else {
            this.windowManager.focusMainWindow();
            this.processFileOpen(filePath);
        }
    }
    processFileOpen(filePath) {
        const mainWindow = this.windowManager.getMainWindow();
        if (!mainWindow)
            return;
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
    handleProtocolUrl(url) {
        console.log('Handling protocol URL:', url);
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            this.windowManager.focusMainWindow();
            mainWindow.webContents.send('protocol-url', url);
        }
    }
    // ===== DRAG AND DROP FILE HANDLING =====
    setupDragAndDrop() {
        // This will be handled in the renderer process, but we set up the IPC handlers here
        electron_1.app.on('web-contents-created', (event, contents) => {
            contents.on('will-navigate', (event, navigationUrl) => {
                // Prevent navigation when files are dropped
                if (navigationUrl.startsWith('file://')) {
                    event.preventDefault();
                }
            });
        });
    }
    handleFileImport() {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            this.windowManager.focusMainWindow();
            mainWindow.webContents.send('trigger-file-import');
        }
    }
    // ===== CLEANUP =====
    cleanup() {
        // Unregister all global shortcuts
        electron_1.globalShortcut.unregisterAll();
        this.registeredShortcuts.clear();
        // Clear notification queue
        this.notificationQueue = [];
    }
}
exports.SystemIntegrationManager = SystemIntegrationManager;
