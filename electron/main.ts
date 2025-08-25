import { app, BrowserWindow, dialog, ipcMain, Menu, Notification, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityManager } from './security';
import { IPCResponse, WindowState } from './types';

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

class StudyCollabApp {
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;
  private windowState: WindowState = {
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullScreen: false
  };
  private windowStateFile = path.join(app.getPath('userData'), 'window-state.json');
  private securityManager: SecurityManager;

  constructor() {
    this.securityManager = SecurityManager.getInstance();
    this.setupApp();
  }

  private setupApp(): void {
    // Load window state
    this.loadWindowState();

    // Security: Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.studycollab.desktop');
    }

    // Security: Disable hardware acceleration if needed for security
    if (!isDev) {
      app.disableHardwareAcceleration();
    }

    // Handle app ready
    app.whenReady().then(async () => {
      await this.securityManager.setupSecurity();
      this.createWindow();
      this.setupMenu();
      this.setupAutoUpdater();
      this.setupIPC();
      this.setupDeepLinkHandling();
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle app activate (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Handle before quit
    app.on('before-quit', () => {
      this.isQuitting = true;
      this.saveWindowState();
    });

    // Security: Prevent new window creation and handle external links
    app.on('web-contents-created', (_, contents) => {
      // Prevent new window creation
      contents.setWindowOpenHandler(({ url }) => {
        // Only allow external URLs to be opened in default browser
        if (url.startsWith('http://') || url.startsWith('https://')) {
          shell.openExternal(url);
        }
        return { action: 'deny' };
      });

      // Security: Prevent navigation to external URLs
      contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        // Allow navigation to localhost in development
        if (isDev && parsedUrl.hostname === 'localhost') {
          return;
        }
        
        // Allow navigation to file:// protocol for production builds
        if (!isDev && parsedUrl.protocol === 'file:') {
          return;
        }
        
        // Prevent all other navigation
        event.preventDefault();
      });

      // Security: Handle window open attempts (new-window is deprecated)
      // This is now handled by setWindowOpenHandler above
    });

    // Handle certificate errors
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      if (isDev) {
        // In development, ignore certificate errors for localhost
        event.preventDefault();
        callback(true);
      } else {
        // In production, use default behavior
        callback(false);
      }
    });
  }



  private loadWindowState(): void {
    try {
      if (fs.existsSync(this.windowStateFile)) {
        const data = fs.readFileSync(this.windowStateFile, 'utf8');
        this.windowState = { ...this.windowState, ...JSON.parse(data) };
      }
    } catch (error) {
      console.warn('Failed to load window state:', error);
    }
  }

  private saveWindowState(): void {
    try {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds();
        this.windowState = {
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
          isMaximized: this.mainWindow.isMaximized(),
          isFullScreen: this.mainWindow.isFullScreen()
        };
        
        fs.writeFileSync(this.windowStateFile, JSON.stringify(this.windowState, null, 2));
      }
    } catch (error) {
      console.warn('Failed to save window state:', error);
    }
  }

  private createWindow(): void {
    // Create the browser window with enhanced security settings
    this.mainWindow = new BrowserWindow({
      width: this.windowState.width,
      height: this.windowState.height,
      x: this.windowState.x,
      y: this.windowState.y,
      minWidth: 800,
      minHeight: 600,
      show: false,
      icon: path.join(__dirname, '../assets/icon.png'),
      webPreferences: {
        // Security: Disable node integration
        nodeIntegration: false,
        
        // Security: Enable context isolation
        contextIsolation: true,
        
        // Security: Enable sandbox mode
        sandbox: false, // Disabled for now to allow preload script access
        
        // Preload script for secure IPC
        preload: path.join(__dirname, 'preload.js'),
        
        // Security: Enable web security
        webSecurity: true,
        
        // Security: Disable insecure content
        allowRunningInsecureContent: false,
        
        // Security: Disable experimental features
        experimentalFeatures: false,
        
        // Security: Disable plugins
        plugins: false,
        
        // Security: Enable same origin policy (already set above)
        
        // Security: Disable auxiliary click
        disableBlinkFeatures: 'Auxclick',
        
        // Security: Additional isolation
        additionalArguments: ['--disable-features=VizDisplayCompositor']
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      
      // Window appearance
      backgroundColor: '#ffffff',
      
      // Security: Disable menu bar by default (will be set programmatically)
      autoHideMenuBar: !isDev,
      
      // macOS specific settings
      ...(process.platform === 'darwin' && {
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 20, y: 20 }
      })
    });

    // Restore window state
    if (this.windowState.isMaximized) {
      this.mainWindow.maximize();
    }

    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../out/index.html')}`;
    
    this.mainWindow.loadURL(startUrl);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      // Focus the window
      this.mainWindow?.focus();
      
      // Restore fullscreen state
      if (this.windowState.isFullScreen) {
        this.mainWindow?.setFullScreen(true);
      }
      
      if (isDev) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window minimize (hide to tray on Windows/Linux)
    this.mainWindow.on('minimize', () => {
      if (process.platform !== 'darwin') {
        this.mainWindow?.hide();
      }
    });

    // Handle window close (hide to tray instead of quit)
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        
        if (process.platform === 'darwin') {
          this.mainWindow?.hide();
        } else {
          this.mainWindow?.hide();
        }
        
        return false;
      }
      
      // Save window state before closing
      this.saveWindowState();
    });

    // Handle window resize and move events for state persistence
    this.mainWindow.on('resize', () => {
      if (!this.mainWindow?.isMaximized() && !this.mainWindow?.isFullScreen()) {
        this.saveWindowState();
      }
    });

    this.mainWindow.on('move', () => {
      if (!this.mainWindow?.isMaximized() && !this.mainWindow?.isFullScreen()) {
        this.saveWindowState();
      }
    });

    // Handle maximize/unmaximize events
    this.mainWindow.on('maximize', () => {
      this.windowState.isMaximized = true;
      this.saveWindowState();
    });

    this.mainWindow.on('unmaximize', () => {
      this.windowState.isMaximized = false;
      this.saveWindowState();
    });

    // Handle fullscreen events
    this.mainWindow.on('enter-full-screen', () => {
      this.windowState.isFullScreen = true;
      this.saveWindowState();
    });

    this.mainWindow.on('leave-full-screen', () => {
      this.windowState.isFullScreen = false;
      this.saveWindowState();
    });

    // Security: Handle page title updates
    this.mainWindow.webContents.on('page-title-updated', (event, title) => {
      // Prevent title changes from web content
      event.preventDefault();
      this.mainWindow?.setTitle('StudyCollab');
    });

    // Security: Handle console messages in production
    if (!isDev) {
      this.mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log(`Renderer console [${level}]:`, message);
      });
    }
  }

  private setupDeepLinkHandling(): void {
    // Handle deep links on Windows and Linux
    if (process.platform === 'win32' || process.platform === 'linux') {
      app.setAsDefaultProtocolClient('studycollab');
    }

    // Handle deep links when app is already running
    app.on('second-instance', (event, commandLine) => {
      // Someone tried to run a second instance, focus our window instead
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.focus();
        
        // Handle deep link from command line
        const url = commandLine.find(arg => arg.startsWith('studycollab://'));
        if (url) {
          this.handleDeepLink(url);
        }
      }
    });

    // Handle deep links on macOS
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleDeepLink(url);
    });
  }

  private handleDeepLink(url: string): void {
    try {
      const parsedUrl = new URL(url);
      
      // Send deep link to renderer process
      this.mainWindow?.webContents.send('deep-link', {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        hash: parsedUrl.hash
      });
    } catch (error) {
      console.error('Failed to parse deep link:', error);
    }
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Study Session',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-session');
            }
          },
          {
            label: 'Open File',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow!, {
                properties: ['openFile'],
                filters: [
                  { name: 'Study Files', extensions: ['study', 'md', 'txt'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                this.mainWindow?.webContents.send('menu-open-file', result.filePaths[0]);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About StudyCollab',
            click: () => {
              this.mainWindow?.webContents.send('menu-about');
            }
          },
          {
            label: 'Learn More',
            click: () => {
              shell.openExternal('https://study-collab-pi.vercel.app/');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupAutoUpdater(): void {
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
      
      autoUpdater.on('update-available', () => {
        if (Notification.isSupported()) {
          new Notification({
            title: 'StudyCollab Update Available',
            body: 'A new version is available. It will be downloaded in the background.'
          }).show();
        }
      });

      autoUpdater.on('update-downloaded', () => {
        if (Notification.isSupported()) {
          new Notification({
            title: 'StudyCollab Update Ready',
            body: 'Update downloaded. The application will restart to apply the update.'
          }).show();
        }
        
        setTimeout(() => {
          autoUpdater.quitAndInstall();
        }, 5000);
      });
    }
  }

  private setupIPC(): void {
    // Ping handler for connection testing
    ipcMain.handle('desktop-api:ping', async (): Promise<IPCResponse<string>> => {
      try {
        return { success: true, data: 'pong', timestamp: Date.now() };
      } catch (error) {
        console.error('Ping error:', error);
        return { success: false, data: 'error', error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    // Enhanced notification handler
    ipcMain.handle('desktop-api:show-notification', async (event, title: string, body: string, options?: any): Promise<IPCResponse<boolean>> => {
      try {
        // Validate input
        if (typeof title !== 'string' || typeof body !== 'string') {
          throw new Error('Invalid notification parameters');
        }
        
        if (Notification.isSupported()) {
          const notificationOptions: Electron.NotificationConstructorOptions = {
            title: this.securityManager.sanitizeString(title, 100),
            body: this.securityManager.sanitizeString(body, 300)
          };
          
          // Add optional parameters if provided
          if (options && typeof options === 'object') {
            if (options.icon && typeof options.icon === 'string') {
              notificationOptions.icon = this.securityManager.sanitizeString(options.icon, 200);
            }
            if (typeof options.silent === 'boolean') {
              notificationOptions.silent = options.silent;
            }
            if (options.urgency && ['normal', 'critical', 'low'].includes(options.urgency)) {
              notificationOptions.urgency = options.urgency;
            }
          }
          
          const notification = new Notification(notificationOptions);
          notification.show();
          return { success: true, data: true, timestamp: Date.now() };
        }
        return { success: false, data: false, error: 'Notifications not supported', timestamp: Date.now() };
      } catch (error) {
        console.error('Notification error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    // Tray badge handler
    ipcMain.handle('desktop-api:set-tray-badge', async (event, count: number): Promise<IPCResponse<boolean>> => {
      try {
        if (typeof count !== 'number' || count < 0 || count > 999) {
          throw new Error('Invalid badge count');
        }
        
        // Implementation would depend on system tray setup
        // For now, just return success
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Set tray badge error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    // File dialog handlers
    ipcMain.handle('desktop-api:show-save-dialog', async (event, options) => {
      try {
        if (!this.securityManager.validateIPCMessage(options)) {
          throw new Error('Invalid dialog options');
        }
        
        const result = await dialog.showSaveDialog(this.mainWindow!, {
          ...options,
          // Security: Ensure safe default properties
          securityScopedBookmarks: false
        });
        return result;
      } catch (error) {
        console.error('Save dialog error:', error);
        return { canceled: true, filePath: undefined };
      }
    });

    ipcMain.handle('desktop-api:show-open-dialog', async (event, options) => {
      try {
        if (!this.securityManager.validateIPCMessage(options)) {
          throw new Error('Invalid dialog options');
        }
        
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          ...options,
          // Security: Ensure safe default properties
          securityScopedBookmarks: false
        });
        return result;
      } catch (error) {
        console.error('Open dialog error:', error);
        return { canceled: true, filePaths: [] };
      }
    });

    // File operation handlers
    ipcMain.handle('desktop-api:read-file', async (event, filePath: string): Promise<IPCResponse<string>> => {
      try {
        if (typeof filePath !== 'string' || filePath.length === 0) {
          throw new Error('Invalid file path');
        }
        
        const sanitizedPath = this.securityManager.sanitizeString(filePath, 500);
        const content = await fs.promises.readFile(sanitizedPath, 'utf8');
        return { success: true, data: content, timestamp: Date.now() };
      } catch (error) {
        console.error('Read file error:', error);
        return { success: false, data: '', error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:write-file', async (event, filePath: string, content: string): Promise<IPCResponse<boolean>> => {
      try {
        if (typeof filePath !== 'string' || typeof content !== 'string') {
          throw new Error('Invalid file parameters');
        }
        
        const sanitizedPath = this.securityManager.sanitizeString(filePath, 500);
        await fs.promises.writeFile(sanitizedPath, content, 'utf8');
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Write file error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:watch-file', async (event, filePath: string): Promise<IPCResponse<boolean>> => {
      try {
        if (typeof filePath !== 'string') {
          throw new Error('Invalid file path');
        }
        
        const sanitizedPath = this.securityManager.sanitizeString(filePath, 500);
        
        // Set up file watcher
        fs.watchFile(sanitizedPath, (curr, prev) => {
          this.mainWindow?.webContents.send('file-watch', sanitizedPath, 'change');
        });
        
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Watch file error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:unwatch-file', async (event, filePath: string): Promise<IPCResponse<boolean>> => {
      try {
        if (typeof filePath !== 'string') {
          throw new Error('Invalid file path');
        }
        
        const sanitizedPath = this.securityManager.sanitizeString(filePath, 500);
        fs.unwatchFile(sanitizedPath);
        
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Unwatch file error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    // Window title handler
    ipcMain.handle('desktop-api:set-window-title', async (event, title: string): Promise<IPCResponse<boolean>> => {
      try {
        if (typeof title !== 'string') {
          throw new Error('Invalid window title');
        }
        
        const sanitizedTitle = this.securityManager.sanitizeString(title, 100);
        this.mainWindow?.setTitle(sanitizedTitle);
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Set window title error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    // Enhanced app info handlers
    ipcMain.handle('desktop-api:get-app-version', (): IPCResponse<string> => {
      try {
        return { success: true, data: app.getVersion(), timestamp: Date.now() };
      } catch (error) {
        console.error('Get version error:', error);
        return { success: false, data: '0.0.0', error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:get-app-info', (): IPCResponse<{
      name: string;
      version: string;
      platform: string;
      arch: string;
      isDev: boolean;
    }> => {
      try {
        return {
          success: true,
          data: {
            name: app.getName(),
            version: app.getVersion(),
            platform: process.platform,
            arch: process.arch,
            isDev: isDev
          },
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('Get app info error:', error);
        return {
          success: false,
          data: {
            name: 'StudyCollab',
            version: '0.0.0',
            platform: 'unknown',
            arch: 'unknown',
            isDev: false
          },
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        };
      }
    });

    ipcMain.handle('desktop-api:check-for-updates', async (): Promise<IPCResponse<boolean>> => {
      try {
        if (!isDev) {
          autoUpdater.checkForUpdatesAndNotify();
          return { success: true, data: true, timestamp: Date.now() };
        }
        return { success: false, data: false, error: 'Updates not available in development mode', timestamp: Date.now() };
      } catch (error) {
        console.error('Check for updates error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:minimize-to-tray', (): IPCResponse<boolean> => {
      try {
        this.mainWindow?.hide();
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Minimize to tray error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:show-window', (): IPCResponse<boolean> => {
      try {
        if (this.mainWindow) {
          this.mainWindow.show();
          this.mainWindow.focus();
          return { success: true, data: true, timestamp: Date.now() };
        }
        return { success: false, data: false, error: 'No window available', timestamp: Date.now() };
      } catch (error) {
        console.error('Show window error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:toggle-fullscreen', (): IPCResponse<{ isFullScreen: boolean }> => {
      try {
        if (this.mainWindow) {
          const isFullScreen = this.mainWindow.isFullScreen();
          this.mainWindow.setFullScreen(!isFullScreen);
          return { success: true, data: { isFullScreen: !isFullScreen }, timestamp: Date.now() };
        }
        return { success: false, data: { isFullScreen: false }, error: 'No window available', timestamp: Date.now() };
      } catch (error) {
        console.error('Toggle fullscreen error:', error);
        return { success: false, data: { isFullScreen: false }, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:get-window-bounds', (): IPCResponse<Electron.Rectangle | null> => {
      try {
        const bounds = this.mainWindow?.getBounds();
        return { success: true, data: bounds || null, timestamp: Date.now() };
      } catch (error) {
        console.error('Get window bounds error:', error);
        return { success: false, data: null, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:set-window-bounds', (event, bounds): IPCResponse<boolean> => {
      try {
        if (!this.securityManager.validateBounds(bounds)) {
          throw new Error('Invalid bounds data');
        }
        
        this.mainWindow?.setBounds(bounds);
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Set window bounds error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    // Handle app lifecycle events
    ipcMain.handle('desktop-api:restart-app', (): IPCResponse<boolean> => {
      try {
        app.relaunch();
        app.exit(0);
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Restart app error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    ipcMain.handle('desktop-api:quit-app', (): IPCResponse<boolean> => {
      try {
        this.isQuitting = true;
        app.quit();
        return { success: true, data: true, timestamp: Date.now() };
      } catch (error) {
        console.error('Quit app error:', error);
        return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() };
      }
    });

    // Handle window state management
    ipcMain.handle('desktop-api:get-window-state', (): IPCResponse<{
      isMaximized: boolean;
      isMinimized: boolean;
      isFullScreen: boolean;
      isFocused: boolean;
    }> => {
      try {
        return {
          success: true,
          data: {
            isMaximized: this.mainWindow?.isMaximized() || false,
            isMinimized: this.mainWindow?.isMinimized() || false,
            isFullScreen: this.mainWindow?.isFullScreen() || false,
            isFocused: this.mainWindow?.isFocused() || false
          },
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('Get window state error:', error);
        return { 
          success: false, 
          data: {
            isMaximized: false,
            isMinimized: false,
            isFullScreen: false,
            isFocused: false
          }, 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        };
      }
    });

    // Security: Log IPC usage in development
    if (isDev) {
      ipcMain.on('*', (event, ...args) => {
        console.log('IPC Event:', event, args);
      });
    }
  }
}

// Initialize the app
new StudyCollabApp();