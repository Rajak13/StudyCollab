import { ChildProcess, fork } from 'child_process';
import { app, BrowserWindow, shell } from 'electron';
import http from 'http';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { AutoUpdaterManager } from './managers/auto-updater-manager';
import { IPCManager } from './managers/ipc-manager';
import { OfflineDataManager } from './managers/offline-data-manager';
import { SystemIntegrationManager } from './managers/system-integration-manager';
import { SystemTrayManager } from './managers/system-tray-manager';
import { WindowManager } from './managers/window-manager';
import { isDev } from './utils/environment';

// Load environment variables from .env.local
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
  console.log('🔧 Environment variables loaded from .env.local');
} catch (error) {
  console.error('❌ Failed to load .env.local:', error);
}

class StudyCollabApp {
  private windowManager: WindowManager;
  private systemTrayManager: SystemTrayManager;
  private systemIntegrationManager: SystemIntegrationManager;
  private ipcManager: IPCManager;
  private autoUpdaterManager: AutoUpdaterManager;
  private offlineDataManager: OfflineDataManager;
  private serverProcess: ChildProcess | null = null;
  private serverLoaded: boolean = false;

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
    this.ipcManager.setManagers(this.windowManager, this.offlineDataManager, this.autoUpdaterManager, undefined, this.systemIntegrationManager);
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
      if (this.serverProcess) {
        try { this.serverProcess.kill(); } catch {}
      }
    });
  }

  private async onReady() {
    console.log('🚀 App is ready, starting initialization...');
    console.log('🔧 Is dev mode:', isDev());
    
    // Debug environment variables
    console.log('🔧 Environment variables:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    
    // In production, start the bundled Next.js server first
    if (!isDev()) {
      console.log('🔧 Starting embedded server for production...');
      await this.startEmbeddedServer();
      await this.waitForServerReady('http://localhost:3000', 30000);
    } else {
      console.log('🔧 Running in dev mode, using existing server');
    }

    // Create main window
    console.log('🔧 Creating main window...');
    await this.windowManager.createMainWindow();
    console.log('🔧 Main window creation completed');
    
    // Setup system tray
    console.log('🔧 Setting up system tray...');
    this.systemTrayManager.setup();
    
    // Check for updates
    if (!isDev()) {
      console.log('🔧 Checking for updates...');
      this.autoUpdaterManager.checkForUpdates();
    }
    
    console.log('🔧 App initialization completed successfully');
    // Offline data is initialized in initializeManagers
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

  private async startEmbeddedServer(): Promise<void> {
    try {
      // Ensure a port is set for the server (default to 3000)
      if (!process.env.PORT) {
        process.env.PORT = '3000';
      }

      // Resolve path to the bundled server.js
      // When packaged, __dirname points to app.asar/dist/electron
      const serverPathCandidates = [
        join(__dirname, '../../server.js'),
      ];

      const serverPath = serverPathCandidates.find((p) => p);
      if (serverPath) {
        try {
          // Try dynamic import to run in-process (works with asar)
          const fileUrl = pathToFileURL(serverPath).href;
          await import(fileUrl);
          this.serverLoaded = true;
        } catch (err) {
          // Fallback to fork if dynamic import fails
          this.serverProcess = fork(serverPath, [], {
            env: { ...process.env, PORT: process.env.PORT || '3000', NODE_ENV: 'production' },
            stdio: 'inherit',
          });
        }
      }
    } catch (error) {
      console.error('Failed to start embedded server:', error);
    }
  }

  private async waitForServerReady(url: string, timeoutMs: number): Promise<void> {
    const start = Date.now();
    const tryRequest = (): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          const req = http.get(url, (res) => {
            // Any HTTP response means server is up
            res.resume();
            resolve(true);
          });
          req.on('error', () => resolve(false));
          req.setTimeout(3000, () => {
            req.destroy();
            resolve(false);
          });
        } catch {
          resolve(false);
        }
      });
    };

    while (Date.now() - start < timeoutMs) {
      const ok = await tryRequest();
      if (ok) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    console.warn('Server did not become ready within timeout; proceeding anyway.');
  }
}

// Initialize the application
const studyCollabApp = new StudyCollabApp();
studyCollabApp.initialize().catch(console.error);

// Handle protocol for file associations
app.setAsDefaultProtocolClient('studycollab');

// Handle file associations on Windows/Linux
app.on('second-instance', (event, commandLine) => {
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