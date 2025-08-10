"use strict";
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
            },
        });
    }
    async createMainWindow() {
        const windowState = this.getWindowState();
        this.mainWindow = new electron_1.BrowserWindow({
            ...windowState,
            minWidth: 800,
            minHeight: 600,
            show: false,
            icon: this.getAppIcon(),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: (0, environment_1.getPreloadPath)(),
                webSecurity: !(0, environment_1.isDev)(),
            },
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        });
        // Handle window events
        this.setupWindowEvents();
        // Load the app
        if ((0, environment_1.isDev)()) {
            await this.mainWindow.loadURL((0, environment_1.getAppUrl)());
            this.mainWindow.webContents.openDevTools();
        }
        else {
            await this.mainWindow.loadURL((0, environment_1.getAppUrl)());
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
                require('electron').shell.openExternal(url);
            }
        });
        // Handle new window requests
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            require('electron').shell.openExternal(url);
            return { action: 'deny' };
        });
    }
    getWindowState() {
        const savedState = this.store['windowState'];
        const primaryDisplay = electron_1.screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        // Ensure window fits on screen
        const state = {
            width: Math.min(savedState.width, screenWidth),
            height: Math.min(savedState.height, screenHeight),
            isMaximized: savedState.isMaximized,
            isFullScreen: savedState.isFullScreen,
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
    createSecondaryWindow(url, options = {}) {
        const secondaryWindow = new electron_1.BrowserWindow({
            width: 800,
            height: 600,
            parent: this.mainWindow || undefined,
            modal: false,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: (0, environment_1.getPreloadPath)(),
                webSecurity: !(0, environment_1.isDev)(),
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
exports.WindowManager = WindowManager;
