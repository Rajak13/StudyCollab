"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const auto_updater_manager_1 = require("./managers/auto-updater-manager");
const ipc_manager_1 = require("./managers/ipc-manager");
const offline_data_manager_1 = require("./managers/offline-data-manager");
const system_integration_manager_1 = require("./managers/system-integration-manager");
const system_tray_manager_1 = require("./managers/system-tray-manager");
const window_manager_1 = require("./managers/window-manager");
const environment_1 = require("./utils/environment");
class StudyCollabApp {
    constructor() {
        this.windowManager = new window_manager_1.WindowManager();
        this.systemTrayManager = new system_tray_manager_1.SystemTrayManager();
        this.systemIntegrationManager = new system_integration_manager_1.SystemIntegrationManager();
        this.ipcManager = new ipc_manager_1.IPCManager();
        this.autoUpdaterManager = new auto_updater_manager_1.AutoUpdaterManager();
        this.offlineDataManager = new offline_data_manager_1.OfflineDataManager();
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
    handleAppEvents() {
        electron_1.app.whenReady().then(() => {
            this.onReady();
        });
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                this.windowManager.createMainWindow();
            }
        });
        electron_1.app.on('before-quit', () => {
            this.onBeforeQuit();
        });
        electron_1.app.on('will-quit', () => {
            // Cleanup is now handled by SystemIntegrationManager
            this.systemIntegrationManager.cleanup();
        });
    }
    async onReady() {
        // Create main window
        await this.windowManager.createMainWindow();
        // Setup system tray
        this.systemTrayManager.setup();
        // Check for updates
        if (!(0, environment_1.isDev)()) {
            this.autoUpdaterManager.checkForUpdates();
        }
        // Initialize offline sync
        await this.offlineDataManager.initialize();
    }
    async initializeManagers() {
        await this.ipcManager.initialize();
        await this.offlineDataManager.initialize();
        await this.systemIntegrationManager.initialize();
    }
    setupSecurity() {
        // Prevent new window creation
        electron_1.app.on('web-contents-created', (event, contents) => {
            contents.setWindowOpenHandler(({ url }) => {
                electron_1.shell.openExternal(url);
                return { action: 'deny' };
            });
        });
        // Prevent navigation to external URLs
        electron_1.app.on('web-contents-created', (event, contents) => {
            contents.on('will-navigate', (navigationEvent, navigationURL) => {
                const parsedUrl = new URL(navigationURL);
                if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'https://studycollab.app') {
                    navigationEvent.preventDefault();
                }
            });
        });
    }
    // Global shortcuts are now handled by SystemIntegrationManager
    onBeforeQuit() {
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
electron_1.app.setAsDefaultProtocolClient('studycollab');
// Handle file associations on Windows/Linux
electron_1.app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    const mainWindow = studyCollabApp['windowManager'].getMainWindow();
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.focus();
    }
    // Check if a file was passed as argument
    const filePath = commandLine.find(arg => arg.endsWith('.scnote') || arg.endsWith('.sctask') || arg.endsWith('.scboard'));
    if (filePath) {
        studyCollabApp['systemIntegrationManager'].handleFileOpen(filePath);
    }
});
// Handle protocol on macOS
electron_1.app.on('open-url', (event, url) => {
    event.preventDefault();
    studyCollabApp['systemIntegrationManager'].handleProtocolUrl(url.replace('studycollab://', ''));
});
// Handle file opening on macOS
electron_1.app.on('open-file', (event, filePath) => {
    event.preventDefault();
    studyCollabApp['systemIntegrationManager'].handleFileOpen(filePath);
});
// Handle command line arguments for file opening
if (process.argv.length > 1) {
    const filePath = process.argv.find(arg => arg.endsWith('.scnote') || arg.endsWith('.sctask') || arg.endsWith('.scboard'));
    if (filePath) {
        electron_1.app.whenReady().then(() => {
            studyCollabApp['systemIntegrationManager'].handleFileOpen(filePath);
        });
    }
}
