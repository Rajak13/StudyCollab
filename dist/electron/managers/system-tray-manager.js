"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemTrayManager = void 0;
const electron_1 = require("electron");
const path_1 = require("path");
const window_manager_1 = require("./window-manager");
class SystemTrayManager {
    constructor() {
        this.tray = null;
        this.windowManager = new window_manager_1.WindowManager();
    }
    setWindowManager(windowManager) {
        this.windowManager = windowManager;
    }
    setup() {
        if (this.tray) {
            return; // Already set up
        }
        this.createTray();
        this.setupTrayMenu();
        this.setupTrayEvents();
    }
    createTray() {
        const iconPath = this.getTrayIconPath();
        // Create native image and resize for tray
        const icon = electron_1.nativeImage.createFromPath(iconPath);
        const trayIcon = icon.resize({ width: 16, height: 16 });
        this.tray = new electron_1.Tray(trayIcon);
        this.tray.setToolTip('StudyCollab - Your Academic Companion');
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
                label: 'Dashboard',
                click: () => {
                    this.windowManager.focusMainWindow();
                    // Navigate to dashboard - this would be handled by the renderer process
                },
            },
            {
                label: 'Quick Actions',
                submenu: [
                    {
                        label: 'New Note',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            this.windowManager.focusMainWindow();
                            // Send IPC message to create new note
                        },
                    },
                    {
                        label: 'New Task',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => {
                            this.windowManager.focusMainWindow();
                            // Send IPC message to create new task
                        },
                    },
                    {
                        label: 'Open Study Board',
                        accelerator: 'CmdOrCtrl+B',
                        click: () => {
                            this.windowManager.focusMainWindow();
                            // Send IPC message to open study board
                        },
                    },
                ],
            },
            {
                type: 'separator',
            },
            {
                label: 'Settings',
                click: () => {
                    this.windowManager.focusMainWindow();
                    // Navigate to settings
                },
            },
            {
                label: 'About StudyCollab',
                click: () => {
                    this.showAboutDialog();
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
        // Single click behavior (Windows/Linux)
        if (process.platform !== 'darwin') {
            this.tray.on('click', () => {
                this.windowManager.focusMainWindow();
            });
        }
        // Handle tray icon updates
        this.tray.on('right-click', () => {
            // Context menu is automatically shown
        });
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
                label: 'Dashboard',
                click: () => {
                    this.windowManager.focusMainWindow();
                },
            },
            {
                label: 'Quick Actions',
                submenu: [
                    {
                        label: 'New Note',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            this.windowManager.focusMainWindow();
                        },
                    },
                    {
                        label: 'New Task',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => {
                            this.windowManager.focusMainWindow();
                        },
                    },
                    {
                        label: 'Open Study Board',
                        accelerator: 'CmdOrCtrl+B',
                        click: () => {
                            this.windowManager.focusMainWindow();
                        },
                    },
                ],
            },
            {
                type: 'separator',
            },
            {
                label: 'Settings',
                click: () => {
                    this.windowManager.focusMainWindow();
                },
            },
            {
                label: 'About StudyCollab',
                click: () => {
                    this.showAboutDialog();
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
        // Update tooltip with unread count
        const tooltip = unreadCount > 0 ?
            `StudyCollab - ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` :
            'StudyCollab - Your Academic Companion';
        this.tray.setToolTip(tooltip);
    }
    showNotification(title, body) {
        if (electron_1.Notification.isSupported()) {
            const notification = new electron_1.Notification({
                title,
                body,
                icon: this.getTrayIconPath(),
            });
            notification.show();
        }
    }
    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    }
    showAboutDialog() {
        const { dialog } = require('electron');
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'About StudyCollab',
                message: 'StudyCollab Desktop',
                detail: `Version: ${electron_1.app.getVersion()}\nYour Academic Companion\n\nBuilt with Electron and Next.js`,
                buttons: ['OK'],
            });
        }
    }
}
exports.SystemTrayManager = SystemTrayManager;
