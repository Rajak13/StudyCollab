import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import Store from 'electron-store';
import { promises as fs } from 'fs';
import { AutoUpdaterManager } from './auto-updater-manager';
import { BrandingManager } from './branding-manager';
import { OfflineDataManager } from './offline-data-manager';
import { WindowManager } from './window-manager';

// Forward declaration to avoid circular dependency
interface SystemIntegrationManager {
  showNotification(options: any): void;
  showReminderNotification(title: string, body: string, reminderData?: any): void;
  showGroupActivityNotification(groupName: string, activity: string, userName?: string): void;
  registerGlobalShortcut(accelerator: string, action: string, description: string): boolean;
  unregisterGlobalShortcut(accelerator: string): void;
  getRegisteredShortcuts(): any[];
  handleFileOpen(filePath: string): void;
  handleProtocolUrl(url: string): void;
}

export class IPCManager {
  private windowManager: WindowManager;
  private offlineDataManager: OfflineDataManager;
  private autoUpdaterManager: AutoUpdaterManager;
  private brandingManager: BrandingManager;
  private systemIntegrationManager: SystemIntegrationManager;
  private settingsStore: Store;

  constructor() {
    this.windowManager = new WindowManager();
    this.offlineDataManager = new OfflineDataManager();
    this.autoUpdaterManager = new AutoUpdaterManager();
    this.brandingManager = new BrandingManager();
    this.systemIntegrationManager = {} as SystemIntegrationManager; // Will be set later
    this.settingsStore = new Store({ name: 'settings' });
  }

  setManagers(
    windowManager: WindowManager,
    offlineDataManager: OfflineDataManager,
    autoUpdaterManager: AutoUpdaterManager,
    brandingManager?: BrandingManager,
    systemIntegrationManager?: SystemIntegrationManager
  ) {
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

  private setupWindowHandlers() {
    ipcMain.handle('window-minimize', () => {
      const mainWindow = this.windowManager.getMainWindow();
      mainWindow?.minimize();
    });

    ipcMain.handle('window-maximize', () => {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow?.maximize();
      }
    });

    ipcMain.handle('window-close', () => {
      const mainWindow = this.windowManager.getMainWindow();
      mainWindow?.close();
    });

    ipcMain.handle('window-is-maximized', () => {
      const mainWindow = this.windowManager.getMainWindow();
      return mainWindow?.isMaximized() || false;
    });
  }

  private setupFileHandlers() {
    ipcMain.handle('dialog-open', async (event, options: Electron.OpenDialogOptions) => {
      const mainWindow = this.windowManager.getMainWindow();
      if (!mainWindow) return { canceled: true, filePaths: [] };
      
      return await dialog.showOpenDialog(mainWindow, options);
    });

    ipcMain.handle('dialog-save', async (event, options: Electron.SaveDialogOptions) => {
      const mainWindow = this.windowManager.getMainWindow();
      if (!mainWindow) return { canceled: true, filePath: undefined };
      
      return await dialog.showSaveDialog(mainWindow, options);
    });

    ipcMain.handle('file-read', async (event, filePath: string) => {
      try {
        return await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to read file: ${error}`);
      }
    });

    ipcMain.handle('file-write', async (event, filePath: string, content: string) => {
      try {
        await fs.writeFile(filePath, content, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to write file: ${error}`);
      }
    });
  }

  private setupSystemHandlers() {
    ipcMain.handle('show-item-in-folder', (event, fullPath: string) => {
      shell.showItemInFolder(fullPath);
    });

    ipcMain.handle('open-external', async (event, url: string) => {
      await shell.openExternal(url);
    });

    ipcMain.on('start-drag', (event, filePath: string) => {
      event.sender.startDrag({
        file: filePath,
        icon: '', // You can add an icon path here
      });
    });
  }

  private setupAppHandlers() {
    ipcMain.handle('app-get-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('app-get-platform', () => {
      return process.platform;
    });
  }

  private setupOfflineDataHandlers() {
    ipcMain.handle('offline-data-get', async (event, key: string) => {
      return await this.offlineDataManager.getData(key);
    });

    ipcMain.handle('offline-data-set', async (event, key: string, value: any, entityType?: string) => {
      await this.offlineDataManager.setData(key, value, entityType);
    });

    ipcMain.handle('offline-data-remove', async (event, key: string, entityType?: string) => {
      await this.offlineDataManager.removeData(key, entityType);
    });

    ipcMain.handle('offline-data-clear', async () => {
      await this.offlineDataManager.clearData();
    });

    ipcMain.handle('offline-data-get-by-type', async (event, entityType: string) => {
      return await this.offlineDataManager.getDataByType(entityType);
    });

    ipcMain.handle('offline-data-get-conflicts', async () => {
      return await this.offlineDataManager.getConflictedEntities();
    });

    ipcMain.handle('offline-data-resolve-conflict', async (event, entityId: string, resolvedData: any) => {
      await this.offlineDataManager.resolveConflictManually(entityId, resolvedData);
    });
  }

  private setupSyncHandlers() {
    ipcMain.on('trigger-sync', () => {
      this.offlineDataManager.triggerSync();
    });

    ipcMain.handle('get-sync-status', async () => {
      return await this.offlineDataManager.getSyncStatus();
    });
  }

  private setupNotificationHandlers() {
    ipcMain.on('show-notification', (event, title: string, body: string, options?: any) => {
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

  private setupAutoUpdaterHandlers() {
    ipcMain.on('check-for-updates', () => {
      this.autoUpdaterManager.checkForUpdates();
    });

    ipcMain.on('install-update', () => {
      this.autoUpdaterManager.quitAndInstall();
    });
  }

  private setupSettingsHandlers() {
    ipcMain.handle('settings-get', (event, key: string) => {
      return (this.settingsStore as any).get(key);
    });

    ipcMain.handle('settings-set', (event, key: string, value: any) => {
      (this.settingsStore as any).set(key, value);
    });
  }

  private setupBrandingHandlers() {
    ipcMain.handle('branding-set-window-title', async (event, title: string) => {
      await this.brandingManager.setWindowTitle(title);
    });

    ipcMain.handle('branding-set-window-icon', async (event, iconPath: string) => {
      await this.brandingManager.setWindowIcon(iconPath);
    });

    ipcMain.handle('branding-set-tray-icon', async (event, iconPath: string) => {
      await this.brandingManager.setTrayIcon(iconPath);
    });

    ipcMain.handle('branding-set-tray-tooltip', async (event, tooltip: string) => {
      await this.brandingManager.setTrayTooltip(tooltip);
    });

    ipcMain.handle('branding-set-app-name', async (event, name: string) => {
      await this.brandingManager.setAppName(name);
    });

    ipcMain.handle('config-file-read', async (event, fileName: string) => {
      return await this.brandingManager.readConfigFile(fileName);
    });

    ipcMain.handle('config-file-write', async (event, fileName: string, content: string) => {
      await this.brandingManager.writeConfigFile(fileName, content);
    });
  }

  private setupSystemIntegrationHandlers() {
    // Enhanced notification handlers
    ipcMain.on('show-system-notification', (event, options) => {
      this.systemIntegrationManager.showNotification(options);
    });

    ipcMain.on('show-reminder-notification', (event, title: string, body: string, reminderData?: any) => {
      this.systemIntegrationManager.showReminderNotification(title, body, reminderData);
    });

    ipcMain.on('show-group-activity-notification', (event, groupName: string, activity: string, userName?: string) => {
      this.systemIntegrationManager.showGroupActivityNotification(groupName, activity, userName);
    });

    // Global shortcut management
    ipcMain.handle('register-global-shortcut', (event, accelerator: string, action: string, description: string) => {
      return this.systemIntegrationManager.registerGlobalShortcut(accelerator, action, description);
    });

    ipcMain.handle('unregister-global-shortcut', (event, accelerator: string) => {
      this.systemIntegrationManager.unregisterGlobalShortcut(accelerator);
    });

    ipcMain.handle('get-registered-shortcuts', () => {
      return this.systemIntegrationManager.getRegisteredShortcuts();
    });

    // File association handlers
    ipcMain.on('handle-file-open', (event, filePath: string) => {
      this.systemIntegrationManager.handleFileOpen(filePath);
    });

    ipcMain.on('handle-protocol-url', (event, url: string) => {
      this.systemIntegrationManager.handleProtocolUrl(url);
    });

    // Drag and drop support
    ipcMain.handle('get-dropped-files', (event, files: string[]) => {
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
  sendToRenderer(channel: string, ...args: any[]) {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(channel, ...args);
    }
  }

  // Method to send to all windows
  sendToAllWindows(channel: string, ...args: any[]) {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send(channel, ...args);
    });
  }
}