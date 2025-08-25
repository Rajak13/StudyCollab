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
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const security_1 = require("./security");
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
class StudyCollabApp {
    constructor() {
        this.mainWindow = null;
        this.isQuitting = false;
        this.windowState = {
            width: 1200,
            height: 800,
            isMaximized: false,
            isFullScreen: false
        };
        this.windowStateFile = path.join(electron_1.app.getPath('userData'), 'window-state.json');
        this.securityManager = security_1.SecurityManager.getInstance();
        this.setupApp();
    }
    setupApp() {
        // Load window state
        this.loadWindowState();
        // Security: Set app user model ID for Windows
        if (process.platform === 'win32') {
            electron_1.app.setAppUserModelId('com.studycollab.desktop');
        }
        // Security: Disable hardware acceleration if needed for security
        if (!isDev) {
            electron_1.app.disableHardwareAcceleration();
        }
        // Handle app ready
        electron_1.app.whenReady().then(async () => {
            await this.securityManager.setupSecurity();
            this.createWindow();
            this.setupMenu();
            this.setupAutoUpdater();
            this.setupIPC();
            this.setupDeepLinkHandling();
        });
        // Handle window closed
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        // Handle app activate (macOS)
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
        // Handle before quit
        electron_1.app.on('before-quit', () => {
            this.isQuitting = true;
            this.saveWindowState();
        });
        // Security: Prevent new window creation and handle external links
        electron_1.app.on('web-contents-created', (_, contents) => {
            // Prevent new window creation
            contents.setWindowOpenHandler(({ url }) => {
                // Only allow external URLs to be opened in default browser
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    electron_1.shell.openExternal(url);
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
        electron_1.app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
            if (isDev) {
                // In development, ignore certificate errors for localhost
                event.preventDefault();
                callback(true);
            }
            else {
                // In production, use default behavior
                callback(false);
            }
        });
    }
    loadWindowState() {
        try {
            if (fs.existsSync(this.windowStateFile)) {
                const data = fs.readFileSync(this.windowStateFile, 'utf8');
                this.windowState = { ...this.windowState, ...JSON.parse(data) };
            }
        }
        catch (error) {
            console.warn('Failed to load window state:', error);
        }
    }
    saveWindowState() {
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
        }
        catch (error) {
            console.warn('Failed to save window state:', error);
        }
    }
    createWindow() {
        // Create the browser window with enhanced security settings
        this.mainWindow = new electron_1.BrowserWindow({
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
                }
                else {
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
    setupDeepLinkHandling() {
        // Handle deep links on Windows and Linux
        if (process.platform === 'win32' || process.platform === 'linux') {
            electron_1.app.setAsDefaultProtocolClient('studycollab');
        }
        // Handle deep links when app is already running
        electron_1.app.on('second-instance', (event, commandLine) => {
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
        electron_1.app.on('open-url', (event, url) => {
            event.preventDefault();
            this.handleDeepLink(url);
        });
    }
    handleDeepLink(url) {
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
        }
        catch (error) {
            console.error('Failed to parse deep link:', error);
        }
    }
    setupMenu() {
        const template = [
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
                            const result = await electron_1.dialog.showOpenDialog(this.mainWindow, {
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
                            electron_1.app.quit();
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
                            electron_1.shell.openExternal('https://study-collab-pi.vercel.app/');
                        }
                    }
                ]
            }
        ];
        const menu = electron_1.Menu.buildFromTemplate(template);
        electron_1.Menu.setApplicationMenu(menu);
    }
    setupAutoUpdater() {
        if (!isDev) {
            electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
            electron_updater_1.autoUpdater.on('update-available', () => {
                if (electron_1.Notification.isSupported()) {
                    new electron_1.Notification({
                        title: 'StudyCollab Update Available',
                        body: 'A new version is available. It will be downloaded in the background.'
                    }).show();
                }
            });
            electron_updater_1.autoUpdater.on('update-downloaded', () => {
                if (electron_1.Notification.isSupported()) {
                    new electron_1.Notification({
                        title: 'StudyCollab Update Ready',
                        body: 'Update downloaded. The application will restart to apply the update.'
                    }).show();
                }
                setTimeout(() => {
                    electron_updater_1.autoUpdater.quitAndInstall();
                }, 5000);
            });
        }
    }
    setupIPC() {
        // Handle desktop API calls from renderer with error handling
        electron_1.ipcMain.handle('desktop-api:show-notification', async (event, title, body) => {
            try {
                // Validate input
                if (typeof title !== 'string' || typeof body !== 'string') {
                    throw new Error('Invalid notification parameters');
                }
                if (electron_1.Notification.isSupported()) {
                    const notification = new electron_1.Notification({
                        title: this.securityManager.sanitizeString(title, 100),
                        body: this.securityManager.sanitizeString(body, 300)
                    });
                    notification.show();
                    return { success: true, data: true };
                }
                return { success: false, data: false, error: 'Notifications not supported' };
            }
            catch (error) {
                console.error('Notification error:', error);
                return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        electron_1.ipcMain.handle('desktop-api:show-save-dialog', async (event, options) => {
            try {
                if (!this.securityManager.validateIPCMessage(options)) {
                    throw new Error('Invalid dialog options');
                }
                const result = await electron_1.dialog.showSaveDialog(this.mainWindow, {
                    ...options,
                    // Security: Ensure safe default properties
                    securityScopedBookmarks: false
                });
                return result;
            }
            catch (error) {
                console.error('Save dialog error:', error);
                return { canceled: true, filePath: undefined };
            }
        });
        electron_1.ipcMain.handle('desktop-api:show-open-dialog', async (event, options) => {
            try {
                if (!this.securityManager.validateIPCMessage(options)) {
                    throw new Error('Invalid dialog options');
                }
                const result = await electron_1.dialog.showOpenDialog(this.mainWindow, {
                    ...options,
                    // Security: Ensure safe default properties
                    securityScopedBookmarks: false
                });
                return result;
            }
            catch (error) {
                console.error('Open dialog error:', error);
                return { canceled: true, filePaths: [] };
            }
        });
        electron_1.ipcMain.handle('desktop-api:get-app-version', () => {
            try {
                return { success: true, data: electron_1.app.getVersion() };
            }
            catch (error) {
                console.error('Get version error:', error);
                return { success: false, data: '0.0.0', error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        electron_1.ipcMain.handle('desktop-api:minimize-to-tray', () => {
            try {
                this.mainWindow?.hide();
                return { success: true, data: true };
            }
            catch (error) {
                console.error('Minimize to tray error:', error);
                return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        electron_1.ipcMain.handle('desktop-api:show-window', () => {
            try {
                if (this.mainWindow) {
                    this.mainWindow.show();
                    this.mainWindow.focus();
                    return { success: true, data: true };
                }
                return { success: false, data: false, error: 'No window available' };
            }
            catch (error) {
                console.error('Show window error:', error);
                return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        electron_1.ipcMain.handle('desktop-api:toggle-fullscreen', () => {
            try {
                if (this.mainWindow) {
                    const isFullScreen = this.mainWindow.isFullScreen();
                    this.mainWindow.setFullScreen(!isFullScreen);
                    return { success: true, data: { isFullScreen: !isFullScreen } };
                }
                return { success: false, data: { isFullScreen: false }, error: 'No window available' };
            }
            catch (error) {
                console.error('Toggle fullscreen error:', error);
                return { success: false, data: { isFullScreen: false }, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        electron_1.ipcMain.handle('desktop-api:get-window-bounds', () => {
            try {
                const bounds = this.mainWindow?.getBounds();
                return { success: true, data: bounds || null };
            }
            catch (error) {
                console.error('Get window bounds error:', error);
                return { success: false, data: null, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        electron_1.ipcMain.handle('desktop-api:set-window-bounds', (event, bounds) => {
            try {
                if (!this.securityManager.validateBounds(bounds)) {
                    throw new Error('Invalid bounds data');
                }
                this.mainWindow?.setBounds(bounds);
                return { success: true, data: true };
            }
            catch (error) {
                console.error('Set window bounds error:', error);
                return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        // Handle app lifecycle events
        electron_1.ipcMain.handle('desktop-api:restart-app', () => {
            try {
                electron_1.app.relaunch();
                electron_1.app.exit(0);
                return { success: true, data: true };
            }
            catch (error) {
                console.error('Restart app error:', error);
                return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        electron_1.ipcMain.handle('desktop-api:quit-app', () => {
            try {
                this.isQuitting = true;
                electron_1.app.quit();
                return { success: true, data: true };
            }
            catch (error) {
                console.error('Quit app error:', error);
                return { success: false, data: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        // Handle window state management
        electron_1.ipcMain.handle('desktop-api:get-window-state', () => {
            try {
                return {
                    success: true,
                    data: {
                        isMaximized: this.mainWindow?.isMaximized() || false,
                        isMinimized: this.mainWindow?.isMinimized() || false,
                        isFullScreen: this.mainWindow?.isFullScreen() || false,
                        isFocused: this.mainWindow?.isFocused() || false
                    }
                };
            }
            catch (error) {
                console.error('Get window state error:', error);
                return {
                    success: false,
                    data: {
                        isMaximized: false,
                        isMinimized: false,
                        isFullScreen: false,
                        isFocused: false
                    },
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        // Security: Log IPC usage in development
        if (isDev) {
            electron_1.ipcMain.on('*', (event, ...args) => {
                console.log('IPC Event:', event, args);
            });
        }
    }
}
// Initialize the app
new StudyCollabApp();
//# sourceMappingURL=main.js.map