import { BrowserWindow, screen } from 'electron';
import Store from 'electron-store';
import { join } from 'path';
import { getAppUrl, getPreloadPath, isDev } from '../utils/environment';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
  isFullScreen?: boolean;
}

interface DesktopConfig {
  customLogo?: string;
  hideMenuBar: boolean;
  customTitleBar: boolean;
  systemTrayIntegration: boolean;
  multiWindowSupport: boolean;
  branding: {
    appName: string;
    windowTitle: string;
  };
}

interface SecondaryWindowConfig {
  id: string;
  type: 'study-group' | 'notes' | 'canvas' | 'settings';
  title: string;
  url: string;
  options?: Partial<Electron.BrowserWindowConstructorOptions>;
}

interface StoreSchema {
  windowState: WindowState;
  desktopConfig: DesktopConfig;
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private secondaryWindows: Map<string, BrowserWindow> = new Map();
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      defaults: {
        windowState: {
          width: 1200,
          height: 800,
          x: undefined,
          y: undefined,
          isMaximized: false,
          isFullScreen: false,
        },
        desktopConfig: {
          hideMenuBar: true,
          customTitleBar: true,
          systemTrayIntegration: true,
          multiWindowSupport: true,
          branding: {
            appName: 'StudyCollab',
            windowTitle: 'StudyCollab - Your Study Companion',
          },
        },
      },
    });
  }

  async createMainWindow(): Promise<BrowserWindow> {
    const windowState = this.getWindowState();
    const config = this.getDesktopConfig();

    console.log('🔧 Creating main window with state:', windowState);
    console.log('🔧 Desktop config:', config);

    this.mainWindow = new BrowserWindow({
      ...windowState,
      minWidth: 800,
      minHeight: 600,
      show: false,
      icon: this.getAppIcon(),
      frame: !config.customTitleBar,
      titleBarStyle: this.getTitleBarStyle(config),
      titleBarOverlay: config.customTitleBar && process.platform === 'win32' ? {
        color: '#1f2937',
        symbolColor: '#ffffff',
        height: 32
      } : undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: getPreloadPath(),
        webSecurity: !isDev(),
      },
    });

    console.log('🔧 Main window created:', this.mainWindow.id);

    // Hide menu bar if configured
    if (config.hideMenuBar) {
      this.mainWindow.setMenuBarVisibility(false);
      this.mainWindow.setAutoHideMenuBar(true);
    }

    // Handle window events
    this.setupWindowEvents();

    // Load the app
    const appUrl = getAppUrl();
    console.log('🔧 Loading app URL:', appUrl);
    console.log('🔧 Is dev mode:', isDev());
    
    if (isDev()) {
      console.log('🔧 Loading in dev mode, opening DevTools');
      await this.mainWindow.loadURL(appUrl);
      this.mainWindow.webContents.openDevTools();
    } else {
      console.log('🔧 Loading in production mode');
      await this.mainWindow.loadURL(appUrl);
    }

    console.log('🔧 App loaded, setting up ready-to-show event');

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      console.log('🔧 Window ready to show!');
      if (this.mainWindow) {
        console.log('🔧 Showing main window');
        this.mainWindow.show();
        
        // Force focus and bring to front
        this.mainWindow.focus();
        this.mainWindow.moveTop();

        if (windowState.isMaximized) {
          console.log('🔧 Maximizing window');
          this.mainWindow.maximize();
        }

        if (windowState.isFullScreen) {
          console.log('🔧 Setting fullscreen');
          this.mainWindow.setFullScreen(true);
        }
        
        console.log('🔧 Window should now be visible');
      }
    });
    
    // Also show window after a short delay as a fallback
    setTimeout(() => {
      if (this.mainWindow && !this.mainWindow.isVisible()) {
        console.log('🔧 Fallback: forcing window to show');
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    }, 1000);

    return this.mainWindow;
  }

  private setupWindowEvents() {
    if (!this.mainWindow) return;

    // Save window state on resize/move
    this.mainWindow.on('resize', () => this.saveWindowState());
    this.mainWindow.on('move', () => this.saveWindowState());
    this.mainWindow.on('maximize', () => this.saveWindowState());
    this.mainWindow.on('unmaximize', () => this.saveWindowState());
    this.mainWindow.on('enter-full-screen', () => this.saveWindowState());
    this.mainWindow.on('leave-full-screen', () => this.saveWindowState());

    // Handle window close
    this.mainWindow.on('close', (event) => {
      if (process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow?.hide();
      } else {
        // On Windows/Linux, minimize to tray instead of closing
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle navigation
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      // Allow navigation within the app
      const appUrl = getAppUrl();
      const baseUrl = 'http://localhost:3000';
      
      // Allow navigation to any localhost:3000 URL (internal app navigation)
      if (url.startsWith(baseUrl)) {
        console.log('🔧 Allowing internal navigation to:', url);
        return; // Allow the navigation
      }
      
      // Block external navigation
      console.log('🔧 Blocking external navigation to:', url);
      event.preventDefault();
      import('electron').then(({ shell }) => shell.openExternal(url));
    });

    // Handle new window requests
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      import('electron').then(({ shell }) => shell.openExternal(url));
      return { action: 'deny' };
    });
  }

  private getWindowState(): WindowState {
    const savedState = (this.store as any)['windowState'] || {};
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Ensure window fits on screen
    const state: WindowState = {
      width: Math.min(savedState.width || 1200, screenWidth),
      height: Math.min(savedState.height || 800, screenHeight),
      isMaximized: savedState.isMaximized || false,
      isFullScreen: savedState.isFullScreen || false,
    };

    // Center window if no position saved or if position is off-screen
    if (savedState.x !== undefined && savedState.y !== undefined) {
      const displays = screen.getAllDisplays();
      const isOnScreen = displays.some(display => {
        const { x, y, width, height } = display.bounds;
        return (
          savedState.x! >= x &&
          savedState.y! >= y &&
          savedState.x! + state.width <= x + width &&
          savedState.y! + state.height <= y + height
        );
      });

      if (isOnScreen) {
        state.x = savedState.x;
        state.y = savedState.y;
      }
    }

    // If no valid position, center the window
    if (state.x === undefined || state.y === undefined) {
      state.x = Math.round((screenWidth - state.width) / 2);
      state.y = Math.round((screenHeight - state.height) / 2);
    }

    return state;
  }

  saveWindowState() {
    if (!this.mainWindow) return;

    const bounds = this.mainWindow.getBounds();
    const windowState: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: this.mainWindow.isMaximized(),
      isFullScreen: this.mainWindow.isFullScreen(),
    };

    (this.store as any)['windowState'] = windowState;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private getAppIcon(): string | undefined {
    if (process.platform === 'win32') {
      return join(__dirname, '../../assets/icon.ico');
    } else if (process.platform === 'darwin') {
      return join(__dirname, '../../assets/icon.icns');
    } else {
      return join(__dirname, '../../assets/icon.png');
    }
  }

  private getTitleBarStyle(config: DesktopConfig): 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover' {
    if (process.platform === 'darwin') {
      return config.customTitleBar ? 'hiddenInset' : 'default';
    } else if (process.platform === 'win32') {
      return config.customTitleBar ? 'hidden' : 'default';
    }
    return 'default';
  }

  // Enhanced window creation with better custom title bar support
  private setupCustomTitleBar(config: DesktopConfig): Partial<Electron.BrowserWindowConstructorOptions> {
    if (!config.customTitleBar) {
      return { frame: true };
    }

    const baseOptions: Partial<Electron.BrowserWindowConstructorOptions> = {
      frame: false,
      titleBarStyle: this.getTitleBarStyle(config),
    };

    if (process.platform === 'win32') {
      return {
        ...baseOptions,
        titleBarOverlay: {
          color: '#1f2937',
          symbolColor: '#ffffff',
          height: 32,
        },
      };
    } else if (process.platform === 'darwin') {
      return {
        ...baseOptions,
        trafficLightPosition: { x: 20, y: 13 },
      };
    }

    return baseOptions;
  }

  createSecondaryWindow(config: SecondaryWindowConfig): BrowserWindow {
    const config_desktop = this.getDesktopConfig();
    const customTitleBarOptions = this.setupCustomTitleBar(config_desktop);
    
    const secondaryWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      parent: this.mainWindow || undefined,
      modal: false,
      show: false,
      title: config.title,
      icon: this.getAppIcon(),
      ...customTitleBarOptions,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: getPreloadPath(),
        webSecurity: !isDev(),
      },
      ...config.options,
    });

    // Store reference to secondary window
    this.secondaryWindows.set(config.id, secondaryWindow);

    // Hide menu bar for secondary windows too
    if (config_desktop.hideMenuBar) {
      secondaryWindow.setMenuBarVisibility(false);
      secondaryWindow.setAutoHideMenuBar(true);
    }

    // Setup window events for secondary windows
    this.setupSecondaryWindowEvents(secondaryWindow, config.id);

    // Load the URL
    secondaryWindow.loadURL(config.url);
    
    secondaryWindow.once('ready-to-show', () => {
      secondaryWindow.show();
    });

    return secondaryWindow;
  }

  private setupSecondaryWindowEvents(window: BrowserWindow, windowId: string) {
    // Handle window close
    window.on('closed', () => {
      this.secondaryWindows.delete(windowId);
    });

    // Handle navigation for secondary windows
    window.webContents.on('will-navigate', (event, url) => {
      const appUrl = getAppUrl();
      if (!url.startsWith(appUrl)) {
        event.preventDefault();
        import('electron').then(({ shell }) => shell.openExternal(url));
      }
    });

    // Handle new window requests
    window.webContents.setWindowOpenHandler(({ url }) => {
      import('electron').then(({ shell }) => shell.openExternal(url));
      return { action: 'deny' };
    });
  }

  // Enhanced window management methods
  getSecondaryWindow(windowId: string): BrowserWindow | undefined {
    return this.secondaryWindows.get(windowId);
  }

  closeSecondaryWindow(windowId: string): void {
    const window = this.secondaryWindows.get(windowId);
    if (window && !window.isDestroyed()) {
      window.close();
    }
  }

  closeAllSecondaryWindows(): void {
    this.secondaryWindows.forEach((window, id) => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    this.secondaryWindows.clear();
  }

  getAllWindows(): BrowserWindow[] {
    const windows: BrowserWindow[] = [];
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      windows.push(this.mainWindow);
    }
    this.secondaryWindows.forEach(window => {
      if (!window.isDestroyed()) {
        windows.push(window);
      }
    });
    return windows;
  }

  focusMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  // Configuration management methods
  getDesktopConfig(): DesktopConfig {
    return (this.store as any)['desktopConfig'] || {
      hideMenuBar: true,
      customTitleBar: true,
      systemTrayIntegration: true,
      multiWindowSupport: true,
      branding: {
        appName: 'StudyCollab',
        windowTitle: 'StudyCollab - Your Study Companion',
      },
    };
  }

  updateDesktopConfig(updates: Partial<DesktopConfig>): void {
    const currentConfig = this.getDesktopConfig();
    const newConfig = { ...currentConfig, ...updates };
    (this.store as any)['desktopConfig'] = newConfig;
  }

  updateCustomLogo(logoPath: string): void {
    this.updateDesktopConfig({ customLogo: logoPath });
  }

  updateBranding(appName: string, windowTitle: string): void {
    this.updateDesktopConfig({
      branding: { appName, windowTitle }
    });
    
    // Update main window title if it exists
    if (this.mainWindow) {
      this.mainWindow.setTitle(windowTitle);
    }
  }

  // Enhanced window control methods
  minimizeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.minimize();
    }
  }

  maximizeMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  closeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  isMainWindowMaximized(): boolean {
    return this.mainWindow?.isMaximized() || false;
  }

  // Window state management
  restoreWindowState(): void {
    if (!this.mainWindow) return;

    const windowState = this.getWindowState();
    this.mainWindow.setBounds({
      x: windowState.x || 0,
      y: windowState.y || 0,
      width: windowState.width,
      height: windowState.height,
    });

    if (windowState.isMaximized) {
      this.mainWindow.maximize();
    }

    if (windowState.isFullScreen) {
      this.mainWindow.setFullScreen(true);
    }
  }
}