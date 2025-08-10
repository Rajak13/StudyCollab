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
        },
      },
    });
  }

  async createMainWindow(): Promise<BrowserWindow> {
    const windowState = this.getWindowState();
    const config = this.getDesktopConfig();

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

    // Hide menu bar if configured
    if (config.hideMenuBar) {
      this.mainWindow.setMenuBarVisibility(false);
      this.mainWindow.setAutoHideMenuBar(true);
    }

    // Handle window events
    this.setupWindowEvents();

    // Load the app
    if (isDev()) {
      await this.mainWindow.loadURL(getAppUrl());
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadURL(getAppUrl());
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();

        if (windowState.isMaximized) {
          this.mainWindow.maximize();
        }

        if (windowState.isFullScreen) {
          this.mainWindow.setFullScreen(true);
        }
      }
    });

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
      if (!url.startsWith(appUrl)) {
        event.preventDefault();
        require('electron').shell.openExternal(url);
      }
    });

    // Handle new window requests
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private getWindowState(): WindowState {
    const savedState = (this.store as any)['windowState'];
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Ensure window fits on screen
    const state: WindowState = {
      width: Math.min(savedState.width, screenWidth),
      height: Math.min(savedState.height, screenHeight),
      isMaximized: savedState.isMaximized,
      isFullScreen: savedState.isFullScreen,
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

  createSecondaryWindow(url: string, options: Partial<Electron.BrowserWindowConstructorOptions> = {}): BrowserWindow {
    const secondaryWindow = new BrowserWindow({
      width: 800,
      height: 600,
      parent: this.mainWindow || undefined,
      modal: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: getPreloadPath(),
        webSecurity: !isDev(),
      },
      ...options,
    });

    secondaryWindow.loadURL(url);
    secondaryWindow.once('ready-to-show', () => {
      secondaryWindow.show();
    });

    return secondaryWindow;
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
}