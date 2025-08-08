import { app, BrowserWindow, shell } from 'electron';
import { AutoUpdaterManager } from './managers/auto-updater-manager';
import { IPCManager } from './managers/ipc-manager';
import { OfflineDataManager } from './managers/offline-data-manager';
import { SystemIntegrationManager } from './managers/system-integration-manager';
import { SystemTrayManager } from './managers/system-tray-manager';
import { WindowManager } from './managers/window-manager';
import { isDev } from './utils/environment';

class StudyCollabApp {
  private windowManager: WindowManager;
  private systemTrayManager: SystemTrayManager;
  private systemIntegrationManager: SystemIntegrationManager;
  private ipcManager: IPCManager;
  private autoUpdaterManager: AutoUpdaterManager;
  private offlineDataManager: OfflineDataManager;

  constructor() {
    this.windowManager = new WindowManager();
    this.systemTrayManager = new SystemTrayManager();
    this.systemIntegrationManager = new SystemIntegrationManager();
    this.ipcManager = new IPCManager();
    this.autoUpdaterManager = new AutoUpdaterManager();
    this.offlineDataManager = new OfflineDataManager();
    
    // Set up manager dependencies
    this.systemTrayManager.setWindowManager(this.windowManager);
    this.systemIntegrationManager.setWindowManager(this.windowManager);
    this.autoUpdaterManager.setWindowManager(this.windowManager);
    this.ipcManager.setManagers(this.windowManager, this.offlineDataManager, this.autoUpdaterManager, this.systemIntegrationManager);
  }

  async initialize() {
    // Handle app events
    this.handleAppEvents();
    
    // Initialize managers
    await this.initializeManagers();
    
    // Set up security
    this.setupSecurity();
    
    // Initialize system integration (replaces registerGlobalShortcuts)
    await this.systemIntegrationManager.initialize();
  }

  private handleAppEvents() {
    app.whenReady().then(() => {
      this.onReady();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      this.onBeforeQuit();
    });

    app.on('will-quit', () => {
      // Cleanup is now handled by SystemIntegrationManager
      this.systemIntegrationManager.cleanup();
    });
  }

  private async onReady() {
    // Create main window
    await this.windowManager.createMainWindow();
    
    // Setup system tray
    this.systemTrayManager.setup();
    
    // Check for updates
    if (!isDev()) {
      this.autoUpdaterManager.checkForUpdates();
    }
    
    // Initialize offline sync
    await this.offlineDataManager.initialize();
  }

  private async initializeManagers() {
    await this.ipcManager.initialize();
    await this.offlineDataManager.initialize();
    await this.systemIntegrationManager.initialize();
  }

  private setupSecurity() {
    // Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });

    // Prevent navigation to external URLs
    app.on('web-contents-created', (event, contents) => {
      contents.on('will-navigate', (navigationEvent, navigationURL) => {
        const parsedUrl = new URL(navigationURL);
        
        if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'https://studycollab.app') {
          navigationEvent.preventDefault();
        }
      });
    });
  }

  // Global shortcuts are now handled by SystemIntegrationManager

  private onBeforeQuit() {
    // Save app state
    this.windowManager.saveWindowState();
    
    // Sync offline data
    this.offlineDataManager.syncBeforeQuit();
    
    // Cleanup system integration
    this.systemIntegrationManager.cleanup();
  }
}

// Initialize the application
const studyCollabApp = new StudyCollabApp();
studyCollabApp.initialize().catch(console.error);

// Handle protocol for file associations
app.setAsDefaultProtocolClient('studycollab');

// Handle file associations on Windows/Linux
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  const mainWindow = studyCollabApp['windowManager'].getMainWindow();
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  
  // Check if a file was passed as argument
  const filePath = commandLine.find(arg => arg.endsWith('.scnote') || arg.endsWith('.sctask') || arg.endsWith('.scboard'));
  if (filePath) {
    studyCollabApp['systemIntegrationManager'].handleFileOpen(filePath);
  }
});

// Handle protocol on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  studyCollabApp['systemIntegrationManager'].handleProtocolUrl(url.replace('studycollab://', ''));
});

// Handle file opening on macOS
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  studyCollabApp['systemIntegrationManager'].handleFileOpen(filePath);
});

// Handle command line arguments for file opening
if (process.argv.length > 1) {
  const filePath = process.argv.find(arg => arg.endsWith('.scnote') || arg.endsWith('.sctask') || arg.endsWith('.scboard'));
  if (filePath) {
    app.whenReady().then(() => {
      studyCollabApp['systemIntegrationManager'].handleFileOpen(filePath);
    });
  }
}