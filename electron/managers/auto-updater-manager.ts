import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { isDev } from '../utils/environment';
import { WindowManager } from './window-manager';

export class AutoUpdaterManager {
  private windowManager: WindowManager;
  private updateAvailable: boolean = false;
  private updateDownloaded: boolean = false;

  constructor() {
    this.windowManager = new WindowManager();
    this.setupAutoUpdater();
  }

  setWindowManager(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  private setupAutoUpdater() {
    // Don't check for updates in development
    if (isDev()) {
      return;
    }

    // Configure auto-updater
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.autoDownload = false; // We'll handle download manually
    autoUpdater.autoInstallOnAppQuit = true;

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      this.sendToRenderer('update-checking');
    });

    autoUpdater.on('update-available', (info: any) => {
      console.log('Update available:', info);
      this.updateAvailable = true;
      this.sendToRenderer('update-available', info);
      this.showUpdateAvailableDialog(info);
    });

    autoUpdater.on('update-not-available', (info: any) => {
      console.log('Update not available:', info);
      this.sendToRenderer('update-not-available', info);
    });

    autoUpdater.on('error', (err: Error) => {
      console.error('Auto-updater error:', err);
      this.sendToRenderer('update-error', err.message);
      this.showUpdateErrorDialog(err);
    });

    autoUpdater.on('download-progress', (progressObj: any) => {
      console.log('Download progress:', progressObj);
      this.sendToRenderer('update-download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info: any) => {
      console.log('Update downloaded:', info);
      this.updateDownloaded = true;
      this.sendToRenderer('update-downloaded', info);
      this.showUpdateDownloadedDialog(info);
    });
  }

  async checkForUpdates(): Promise<void> {
    if (isDev()) {
      console.log('Skipping update check in development mode');
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  async downloadUpdate(): Promise<void> {
    if (!this.updateAvailable) {
      throw new Error('No update available to download');
    }

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
      throw error;
    }
  }

  quitAndInstall(): void {
    if (!this.updateDownloaded) {
      throw new Error('No update downloaded to install');
    }

    autoUpdater.quitAndInstall();
  }

  private showUpdateAvailableDialog(info: any) {
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `StudyCollab ${info.version} is available`,
      detail: `You are currently running version ${app.getVersion()}. Would you like to download the update now?`,
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        this.downloadUpdate().catch(console.error);
      }
    });
  }

  private showUpdateDownloadedDialog(info: any) {
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
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

  private showUpdateErrorDialog(error: Error) {
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Error',
      message: 'Failed to check for updates',
      detail: `An error occurred while checking for updates: ${error.message}`,
      buttons: ['OK'],
    });
  }

  private sendToRenderer(channel: string, ...args: any[]) {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(channel, ...args);
    }
  }

  // Manual update check (called from menu or UI)
  async manualUpdateCheck(): Promise<void> {
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) return;

    if (isDev()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Development Mode',
        message: 'Update checking is disabled in development mode',
        buttons: ['OK'],
      });
      return;
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      
      if (!result || !result.updateInfo) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'No Updates',
          message: 'You are running the latest version of StudyCollab',
          buttons: ['OK'],
        });
      }
    } catch (error) {
      this.showUpdateErrorDialog(error as Error);
    }
  }

  // Get current update status
  getUpdateStatus() {
    return {
      updateAvailable: this.updateAvailable,
      updateDownloaded: this.updateDownloaded,
      currentVersion: app.getVersion(),
    };
  }
}