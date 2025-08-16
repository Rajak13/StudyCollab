"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const path_1 = require("path");
const environment_1 = require("../utils/environment");
class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.secondaryWindows = new Map();
        this.store = new electron_store_1.default({
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
    async createMainWindow() {
        const windowState = this.getWindowState();
        const config = this.getDesktopConfig();
        console.log('🔧 Creating main window with state:', windowState);
        console.log('🔧 Desktop config:', config);
        this.mainWindow = new electron_1.BrowserWindow({
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
                preload: (0, environment_1.getPreloadPath)(),
                webSecurity: !(0, environment_1.isDev)(),
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
        const appUrl = (0, environment_1.getAppUrl)();
        console.log('🔧 Loading app URL:', appUrl);
        console.log('🔧 Is dev mode:', (0, environment_1.isDev)());
        if ((0, environment_1.isDev)()) {
            console.log('🔧 Loading in dev mode, opening DevTools');
            await this.mainWindow.loadURL(appUrl);
            this.mainWindow.webContents.openDevTools();
        }
        else {
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
    setupWindowEvents() {
        if (!this.mainWindow)
            return;
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
            }
            else {
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
            const appUrl = (0, environment_1.getAppUrl)();
            if (!url.startsWith(appUrl)) {
                event.preventDefault();
                Promise.resolve().then(() => __importStar(require('electron'))).then(({ shell }) => shell.openExternal(url));
            }
        });
        // Handle new window requests
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            Promise.resolve().then(() => __importStar(require('electron'))).then(({ shell }) => shell.openExternal(url));
            return { action: 'deny' };
        });
    }
    getWindowState() {
        const savedState = this.store['windowState'] || {};
        const primaryDisplay = electron_1.screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        // Ensure window fits on screen
        const state = {
            width: Math.min(savedState.width || 1200, screenWidth),
            height: Math.min(savedState.height || 800, screenHeight),
            isMaximized: savedState.isMaximized || false,
            isFullScreen: savedState.isFullScreen || false,
        };
        // Center window if no position saved or if position is off-screen
        if (savedState.x !== undefined && savedState.y !== undefined) {
            const displays = electron_1.screen.getAllDisplays();
            const isOnScreen = displays.some(display => {
                const { x, y, width, height } = display.bounds;
                return (savedState.x >= x &&
                    savedState.y >= y &&
                    savedState.x + state.width <= x + width &&
                    savedState.y + state.height <= y + height);
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
        if (!this.mainWindow)
            return;
        const bounds = this.mainWindow.getBounds();
        const windowState = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            isMaximized: this.mainWindow.isMaximized(),
            isFullScreen: this.mainWindow.isFullScreen(),
        };
        this.store['windowState'] = windowState;
    }
    getMainWindow() {
        return this.mainWindow;
    }
    getAppIcon() {
        if (process.platform === 'win32') {
            return (0, path_1.join)(__dirname, '../../assets/icon.ico');
        }
        else if (process.platform === 'darwin') {
            return (0, path_1.join)(__dirname, '../../assets/icon.icns');
        }
        else {
            return (0, path_1.join)(__dirname, '../../assets/icon.png');
        }
    }
    getTitleBarStyle(config) {
        if (process.platform === 'darwin') {
            return config.customTitleBar ? 'hiddenInset' : 'default';
        }
        else if (process.platform === 'win32') {
            return config.customTitleBar ? 'hidden' : 'default';
        }
        return 'default';
    }
    // Enhanced window creation with better custom title bar support
    setupCustomTitleBar(config) {
        if (!config.customTitleBar) {
            return { frame: true };
        }
        const baseOptions = {
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
        }
        else if (process.platform === 'darwin') {
            return {
                ...baseOptions,
                trafficLightPosition: { x: 20, y: 13 },
            };
        }
        return baseOptions;
    }
    createSecondaryWindow(config) {
        const config_desktop = this.getDesktopConfig();
        const customTitleBarOptions = this.setupCustomTitleBar(config_desktop);
        const secondaryWindow = new electron_1.BrowserWindow({
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
                preload: (0, environment_1.getPreloadPath)(),
                webSecurity: !(0, environment_1.isDev)(),
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
    setupSecondaryWindowEvents(window, windowId) {
        // Handle window close
        window.on('closed', () => {
            this.secondaryWindows.delete(windowId);
        });
        // Handle navigation for secondary windows
        window.webContents.on('will-navigate', (event, url) => {
            const appUrl = (0, environment_1.getAppUrl)();
            if (!url.startsWith(appUrl)) {
                event.preventDefault();
                Promise.resolve().then(() => __importStar(require('electron'))).then(({ shell }) => shell.openExternal(url));
            }
        });
        // Handle new window requests
        window.webContents.setWindowOpenHandler(({ url }) => {
            Promise.resolve().then(() => __importStar(require('electron'))).then(({ shell }) => shell.openExternal(url));
            return { action: 'deny' };
        });
    }
    // Enhanced window management methods
    getSecondaryWindow(windowId) {
        return this.secondaryWindows.get(windowId);
    }
    closeSecondaryWindow(windowId) {
        const window = this.secondaryWindows.get(windowId);
        if (window && !window.isDestroyed()) {
            window.close();
        }
    }
    closeAllSecondaryWindows() {
        this.secondaryWindows.forEach((window, id) => {
            if (!window.isDestroyed()) {
                window.close();
            }
        });
        this.secondaryWindows.clear();
    }
    getAllWindows() {
        const windows = [];
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
    getDesktopConfig() {
        return this.store['desktopConfig'] || {
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
    updateDesktopConfig(updates) {
        const currentConfig = this.getDesktopConfig();
        const newConfig = { ...currentConfig, ...updates };
        this.store['desktopConfig'] = newConfig;
    }
    updateCustomLogo(logoPath) {
        this.updateDesktopConfig({ customLogo: logoPath });
    }
    updateBranding(appName, windowTitle) {
        this.updateDesktopConfig({
            branding: { appName, windowTitle }
        });
        // Update main window title if it exists
        if (this.mainWindow) {
            this.mainWindow.setTitle(windowTitle);
        }
    }
    // Enhanced window control methods
    minimizeMainWindow() {
        if (this.mainWindow) {
            this.mainWindow.minimize();
        }
    }
    maximizeMainWindow() {
        if (this.mainWindow) {
            if (this.mainWindow.isMaximized()) {
                this.mainWindow.unmaximize();
            }
            else {
                this.mainWindow.maximize();
            }
        }
    }
    closeMainWindow() {
        if (this.mainWindow) {
            this.mainWindow.close();
        }
    }
    isMainWindowMaximized() {
        return this.mainWindow?.isMaximized() || false;
    }
    // Window state management
    restoreWindowState() {
        if (!this.mainWindow)
            return;
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
exports.WindowManager = WindowManager;
