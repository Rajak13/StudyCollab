"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoUpdaterManager = void 0;
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const environment_1 = require("../utils/environment");
const window_manager_1 = require("./window-manager");
class AutoUpdaterManager {
    constructor() {
        this.updateAvailable = false;
        this.updateDownloaded = false;
        this.windowManager = new window_manager_1.WindowManager();
        this.setupAutoUpdater();
    }
    setWindowManager(windowManager) {
        this.windowManager = windowManager;
    }
    setupAutoUpdater() {
        // Don't check for updates in development
        if ((0, environment_1.isDev)()) {
            return;
        }
        // Configure auto-updater
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
        electron_updater_1.autoUpdater.autoDownload = false; // We'll handle download manually
        electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
        // Set up event handlers
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        electron_updater_1.autoUpdater.on('checking-for-update', () => {
            console.log('Checking for update...');
            this.sendToRenderer('update-checking');
        });
        electron_updater_1.autoUpdater.on('update-available', (info) => {
            console.log('Update available:', info);
            this.updateAvailable = true;
            this.sendToRenderer('update-available', info);
            this.showUpdateAvailableDialog(info);
        });
        electron_updater_1.autoUpdater.on('update-not-available', (info) => {
            console.log('Update not available:', info);
            this.sendToRenderer('update-not-available', info);
        });
        electron_updater_1.autoUpdater.on('error', (err) => {
            console.error('Auto-updater error:', err);
            this.sendToRenderer('update-error', err.message);
            this.showUpdateErrorDialog(err);
        });
        electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
            console.log('Download progress:', progressObj);
            this.sendToRenderer('update-download-progress', progressObj);
        });
        electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
            console.log('Update downloaded:', info);
            this.updateDownloaded = true;
            this.sendToRenderer('update-downloaded', info);
            this.showUpdateDownloadedDialog(info);
        });
    }
    async checkForUpdates() {
        if ((0, environment_1.isDev)()) {
            console.log('Skipping update check in development mode');
            return;
        }
        try {
            await electron_updater_1.autoUpdater.checkForUpdates();
        }
        catch (error) {
            console.error('Failed to check for updates:', error);
        }
    }
    async downloadUpdate() {
        if (!this.updateAvailable) {
            throw new Error('No update available to download');
        }
        try {
            await electron_updater_1.autoUpdater.downloadUpdate();
        }
        catch (error) {
            console.error('Failed to download update:', error);
            throw error;
        }
    }
    quitAndInstall() {
        if (!this.updateDownloaded) {
            throw new Error('No update downloaded to install');
        }
        electron_updater_1.autoUpdater.quitAndInstall();
    }
    showUpdateAvailableDialog(info) {
        const mainWindow = this.windowManager.getMainWindow();
        if (!mainWindow)
            return;
        electron_1.dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `StudyCollab ${info.version} is available`,
            detail: `You are currently running version ${electron_1.app.getVersion()}. Would you like to download the update now?`,
            buttons: ['Download Now', 'Later'],
            defaultId: 0,
            cancelId: 1,
        }).then((result) => {
            if (result.response === 0) {
                this.downloadUpdate().catch(console.error);
            }
        });
    }
    showUpdateDownloadedDialog(info) {
        const mainWindow = this.windowManager.getMainWindow();
        if (!mainWindow)
            return;
        electron_1.dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: `StudyCollab ${info.version} has been downloaded`,
            detail: 'The update will be installed when you restart the application. Would you like to restart now?',
            buttons: ['Restart Now', 'Later'],
            defaultId: 0,
            cancelId: 1,
        }).then((result) => {
            if (result.response === 0) {
                this.quitAndInstall();
            }
        });
    }
    showUpdateErrorDialog(error) {
        const mainWindow = this.windowManager.getMainWindow();
        if (!mainWindow)
            return;
        electron_1.dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Update Error',
            message: 'Failed to check for updates',
            detail: `An error occurred while checking for updates: ${error.message}`,
            buttons: ['OK'],
        });
    }
    sendToRenderer(channel, ...args) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.send(channel, ...args);
        }
    }
    // Manual update check (called from menu or UI)
    async manualUpdateCheck() {
        const mainWindow = this.windowManager.getMainWindow();
        if (!mainWindow)
            return;
        if ((0, environment_1.isDev)()) {
            electron_1.dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Development Mode',
                message: 'Update checking is disabled in development mode',
                buttons: ['OK'],
            });
            return;
        }
        try {
            const result = await electron_updater_1.autoUpdater.checkForUpdates();
            if (!result || !result.updateInfo) {
                electron_1.dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'No Updates',
                    message: 'You are running the latest version of StudyCollab',
                    buttons: ['OK'],
                });
            }
        }
        catch (error) {
            this.showUpdateErrorDialog(error);
        }
    }
    // Get current update status
    getUpdateStatus() {
        return {
            updateAvailable: this.updateAvailable,
            updateDownloaded: this.updateDownloaded,
            currentVersion: electron_1.app.getVersion(),
        };
    }
}
exports.AutoUpdaterManager = AutoUpdaterManager;
