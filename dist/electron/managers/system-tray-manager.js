"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemTrayManager = void 0;
const electron_1 = require("electron");
const path_1 = require("path");
const window_manager_1 = require("./window-manager");
class SystemTrayManager {
    constructor() {
        this.tray = null;
        // We'll get the window manager instance from the main app
        this.windowManager = new window_manager_1.WindowManager();
    }
    setWindowManager(windowManager) {
        this.windowManager = windowManager;
    }
    setup() {
        const iconPath = this.getTrayIconPath();
        const icon = electron_1.nativeImage.createFromPath(iconPath);
        // Resize icon for tray
        const trayIcon = icon.resize({ width: 16, height: 16 });
        this.tray = new electron_1.Tray(trayIcon);
        this.setupTrayMenu();
        this.setupTrayEvents();
        this.tray.setToolTip('StudyCollab - Your Study Companion');
    }
    setupTrayMenu() {
        if (!this.tray)
            return;
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: 'Show StudyCollab',
                click: () => {
                    this.windowManager.focusMainWindow();
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'New Note',
                accelerator: 'CommandOrControl+Shift+N',
                click: () => {
                    const mainWindow = this.windowManager.getMainWindow();
                    if (mainWindow) {
                        this.windowManager.focusMainWindow();
                        mainWindow.webContents.send('global-shortcut', 'new-note');
                    }
                },
            },
            {
                label: 'Quick Capture',
                accelerator: 'CommandOrControl+Shift+C',
                click: () => {
                    const mainWindow = this.windowManager.getMainWindow();
                    if (mainWindow) {
                        this.windowManager.focusMainWindow();
                        mainWindow.webContents.send('global-shortcut', 'quick-capture');
                    }
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'Preferences',
                click: () => {
                    const mainWindow = this.windowManager.getMainWindow();
                    if (mainWindow) {
                        this.windowManager.focusMainWindow();
                        mainWindow.webContents.send('navigate-to', '/settings');
                    }
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'Quit StudyCollab',
                accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                click: () => {
                    electron_1.app.quit();
                },
            },
        ]);
        this.tray.setContextMenu(contextMenu);
    }
    setupTrayEvents() {
        if (!this.tray)
            return;
        // Double-click to show/hide main window
        this.tray.on('double-click', () => {
            const mainWindow = this.windowManager.getMainWindow();
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                }
                else {
                    this.windowManager.focusMainWindow();
                }
            }
        });
        // Single click behavior (platform specific)
        if (process.platform === 'win32') {
            this.tray.on('click', () => {
                const mainWindow = this.windowManager.getMainWindow();
                if (mainWindow) {
                    if (mainWindow.isVisible()) {
                        mainWindow.hide();
                    }
                    else {
                        this.windowManager.focusMainWindow();
                    }
                }
            });
        }
    }
    getTrayIconPath() {
        const iconName = process.platform === 'win32' ? 'tray-icon.ico' :
            process.platform === 'darwin' ? 'tray-iconTemplate.png' :
                'tray-icon.png';
        return (0, path_1.join)(__dirname, '../../assets', iconName);
    }
    updateTrayMenu(unreadCount = 0) {
        if (!this.tray)
            return;
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: unreadCount > 0 ? `Show StudyCollab (${unreadCount} unread)` : 'Show StudyCollab',
                click: () => {
                    this.windowManager.focusMainWindow();
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'New Note',
                accelerator: 'CommandOrControl+Shift+N',
                click: () => {
                    const mainWindow = this.windowManager.getMainWindow();
                    if (mainWindow) {
                        this.windowManager.focusMainWindow();
                        mainWindow.webContents.send('global-shortcut', 'new-note');
                    }
                },
            },
            {
                label: 'Quick Capture',
                accelerator: 'CommandOrControl+Shift+C',
                click: () => {
                    const mainWindow = this.windowManager.getMainWindow();
                    if (mainWindow) {
                        this.windowManager.focusMainWindow();
                        mainWindow.webContents.send('global-shortcut', 'quick-capture');
                    }
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'Sync Now',
                click: () => {
                    const mainWindow = this.windowManager.getMainWindow();
                    if (mainWindow) {
                        mainWindow.webContents.send('trigger-sync');
                    }
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'Preferences',
                click: () => {
                    const mainWindow = this.windowManager.getMainWindow();
                    if (mainWindow) {
                        this.windowManager.focusMainWindow();
                        mainWindow.webContents.send('navigate-to', '/settings');
                    }
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'Quit StudyCollab',
                accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                click: () => {
                    electron_1.app.quit();
                },
            },
        ]);
        this.tray.setContextMenu(contextMenu);
    }
    showNotification(title, body) {
        if (this.tray) {
            this.tray.displayBalloon({
                title,
                content: body,
                icon: electron_1.nativeImage.createFromPath(this.getTrayIconPath()),
            });
        }
    }
    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    }
}
exports.SystemTrayManager = SystemTrayManager;
