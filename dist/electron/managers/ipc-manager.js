"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCManager = void 0;
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const fs_1 = require("fs");
const auto_updater_manager_1 = require("./auto-updater-manager");
const branding_manager_1 = require("./branding-manager");
const offline_data_manager_1 = require("./offline-data-manager");
const window_manager_1 = require("./window-manager");
class IPCManager {
    constructor() {
        this.windowManager = new window_manager_1.WindowManager();
        this.offlineDataManager = new offline_data_manager_1.OfflineDataManager();
        this.autoUpdaterManager = new auto_updater_manager_1.AutoUpdaterManager();
        this.brandingManager = new branding_manager_1.BrandingManager();
        this.systemIntegrationManager = {}; // Will be set later
        this.settingsStore = new electron_store_1.default({ name: 'settings' });
    }
    setManagers(windowManager, offlineDataManager, autoUpdaterManager, brandingManager, systemIntegrationManager) {
        this.windowManager = windowManager;
        this.offlineDataManager = offlineDataManager;
        this.autoUpdaterManager = autoUpdaterManager;
        if (brandingManager) {
            this.brandingManager = brandingManager;
        }
        if (systemIntegrationManager) {
            this.systemIntegrationManager = systemIntegrationManager;
        }
    }
    async initialize() {
        this.setupWindowHandlers();
        this.setupFileHandlers();
        this.setupSystemHandlers();
        this.setupAppHandlers();
        this.setupOfflineDataHandlers();
        this.setupSyncHandlers();
        this.setupNotificationHandlers();
        this.setupAutoUpdaterHandlers();
        this.setupSettingsHandlers();
        this.setupBrandingHandlers();
        this.setupSystemIntegrationHandlers();
    }
    setupWindowHandlers() {
        electron_1.ipcMain.handle('window-minimize', () => {
            const mainWindow = this.windowManager.getMainWindow();
            mainWindow?.minimize();
        });
        electron_1.ipcMain.handle('window-maximize', () => {
            const mainWindow = this.windowManager.getMainWindow();
            if (mainWindow?.isMaximized()) {
                mainWindow.unmaximize();
            }
            else {
                mainWindow?.maximize();
            }
        });
        electron_1.ipcMain.handle('window-close', () => {
            const mainWindow = this.windowManager.getMainWindow();
            mainWindow?.close();
        });
        electron_1.ipcMain.handle('window-is-maximized', () => {
            const mainWindow = this.windowManager.getMainWindow();
            return mainWindow?.isMaximized() || false;
        });
    }
    setupFileHandlers() {
        electron_1.ipcMain.handle('dialog-open', async (event, options) => {
            const mainWindow = this.windowManager.getMainWindow();
            if (!mainWindow)
                return { canceled: true, filePaths: [] };
            return await electron_1.dialog.showOpenDialog(mainWindow, options);
        });
        electron_1.ipcMain.handle('dialog-save', async (event, options) => {
            const mainWindow = this.windowManager.getMainWindow();
            if (!mainWindow)
                return { canceled: true, filePath: undefined };
            return await electron_1.dialog.showSaveDialog(mainWindow, options);
        });
        electron_1.ipcMain.handle('file-read', async (event, filePath) => {
            try {
                return await fs_1.promises.readFile(filePath, 'utf-8');
            }
            catch (error) {
                throw new Error(`Failed to read file: ${error}`);
            }
        });
        electron_1.ipcMain.handle('file-write', async (event, filePath, content) => {
            try {
                await fs_1.promises.writeFile(filePath, content, 'utf-8');
            }
            catch (error) {
                throw new Error(`Failed to write file: ${error}`);
            }
        });
    }
    setupSystemHandlers() {
        electron_1.ipcMain.handle('show-item-in-folder', (event, fullPath) => {
            electron_1.shell.showItemInFolder(fullPath);
        });
        electron_1.ipcMain.handle('open-external', async (event, url) => {
            await electron_1.shell.openExternal(url);
        });
        electron_1.ipcMain.on('start-drag', (event, filePath) => {
            event.sender.startDrag({
                file: filePath,
                icon: '', // You can add an icon path here
            });
        });
    }
    setupAppHandlers() {
        electron_1.ipcMain.handle('app-get-version', () => {
            return electron_1.app.getVersion();
        });
        electron_1.ipcMain.handle('app-get-platform', () => {
            return process.platform;
        });
    }
    setupOfflineDataHandlers() {
        electron_1.ipcMain.handle('offline-data-get', async (event, key) => {
            return await this.offlineDataManager.getData(key);
        });
        electron_1.ipcMain.handle('offline-data-set', async (event, key, value, entityType) => {
            await this.offlineDataManager.setData(key, value, entityType);
        });
        electron_1.ipcMain.handle('offline-data-remove', async (event, key, entityType) => {
            await this.offlineDataManager.removeData(key, entityType);
        });
        electron_1.ipcMain.handle('offline-data-clear', async () => {
            await this.offlineDataManager.clearData();
        });
        electron_1.ipcMain.handle('offline-data-get-by-type', async (event, entityType) => {
            return await this.offlineDataManager.getDataByType(entityType);
        });
        electron_1.ipcMain.handle('offline-data-get-conflicts', async () => {
            return await this.offlineDataManager.getConflictedEntities();
        });
        electron_1.ipcMain.handle('offline-data-resolve-conflict', async (event, entityId, resolvedData) => {
            await this.offlineDataManager.resolveConflictManually(entityId, resolvedData);
        });
    }
    setupSyncHandlers() {
        electron_1.ipcMain.on('trigger-sync', () => {
            this.offlineDataManager.triggerSync();
        });
        electron_1.ipcMain.handle('get-sync-status', async () => {
            return await this.offlineDataManager.getSyncStatus();
        });
    }
    setupNotificationHandlers() {
        electron_1.ipcMain.on('show-notification', (event, title, body, options) => {
            const { Notification } = require('electron');
            const notification = new Notification({
                title,
                body,
                ...options,
            });
            notification.on('click', () => {
                this.windowManager.focusMainWindow();
            });
            notification.show();
        });
    }
    setupAutoUpdaterHandlers() {
        electron_1.ipcMain.on('check-for-updates', () => {
            this.autoUpdaterManager.checkForUpdates();
        });
        electron_1.ipcMain.on('install-update', () => {
            this.autoUpdaterManager.quitAndInstall();
        });
    }
    setupSettingsHandlers() {
        electron_1.ipcMain.handle('settings-get', (event, key) => {
            return this.settingsStore.get(key);
        });
        electron_1.ipcMain.handle('settings-set', (event, key, value) => {
            this.settingsStore.set(key, value);
        });
    }
    setupBrandingHandlers() {
        electron_1.ipcMain.handle('branding-set-window-title', async (event, title) => {
            await this.brandingManager.setWindowTitle(title);
        });
        electron_1.ipcMain.handle('branding-set-window-icon', async (event, iconPath) => {
            await this.brandingManager.setWindowIcon(iconPath);
        });
        electron_1.ipcMain.handle('branding-set-tray-icon', async (event, iconPath) => {
            await this.brandingManager.setTrayIcon(iconPath);
        });
        electron_1.ipcMain.handle('branding-set-tray-tooltip', async (event, tooltip) => {
            await this.brandingManager.setTrayTooltip(tooltip);
        });
        electron_1.ipcMain.handle('branding-set-app-name', async (event, name) => {
            await this.brandingManager.setAppName(name);
        });
        electron_1.ipcMain.handle('config-file-read', async (event, fileName) => {
            return await this.brandingManager.readConfigFile(fileName);
        });
        electron_1.ipcMain.handle('config-file-write', async (event, fileName, content) => {
            await this.brandingManager.writeConfigFile(fileName, content);
        });
    }
    setupSystemIntegrationHandlers() {
        // Enhanced notification handlers
        electron_1.ipcMain.on('show-system-notification', (event, options) => {
            this.systemIntegrationManager.showNotification(options);
        });
        electron_1.ipcMain.on('show-reminder-notification', (event, title, body, reminderData) => {
            this.systemIntegrationManager.showReminderNotification(title, body, reminderData);
        });
        electron_1.ipcMain.on('show-group-activity-notification', (event, groupName, activity, userName) => {
            this.systemIntegrationManager.showGroupActivityNotification(groupName, activity, userName);
        });
        // Global shortcut management
        electron_1.ipcMain.handle('register-global-shortcut', (event, accelerator, action, description) => {
            return this.systemIntegrationManager.registerGlobalShortcut(accelerator, action, description);
        });
        electron_1.ipcMain.handle('unregister-global-shortcut', (event, accelerator) => {
            this.systemIntegrationManager.unregisterGlobalShortcut(accelerator);
        });
        electron_1.ipcMain.handle('get-registered-shortcuts', () => {
            return this.systemIntegrationManager.getRegisteredShortcuts();
        });
        // File association handlers
        electron_1.ipcMain.on('handle-file-open', (event, filePath) => {
            this.systemIntegrationManager.handleFileOpen(filePath);
        });
        electron_1.ipcMain.on('handle-protocol-url', (event, url) => {
            this.systemIntegrationManager.handleProtocolUrl(url);
        });
        // Drag and drop support
        electron_1.ipcMain.handle('get-dropped-files', (event, files) => {
            // Process dropped files and return metadata
            return files.map(filePath => ({
                path: filePath,
                name: filePath.split(/[\\/]/).pop(),
                extension: filePath.split('.').pop()?.toLowerCase(),
                size: 0 // Will be filled by renderer if needed
            }));
        });
    }
    // Method to send messages to renderer
    sendToRenderer(channel, ...args) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.send(channel, ...args);
        }
    }
    // Method to send to all windows
    sendToAllWindows(channel, ...args) {
        electron_1.BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send(channel, ...args);
        });
    }
}
exports.IPCManager = IPCManager;
