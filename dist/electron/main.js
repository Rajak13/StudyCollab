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
const child_process_1 = require("child_process");
const electron_1 = require("electron");
const http_1 = __importDefault(require("http"));
const path_1 = require("path");
const url_1 = require("url");
const auto_updater_manager_1 = require("./managers/auto-updater-manager");
const ipc_manager_1 = require("./managers/ipc-manager");
const offline_data_manager_1 = require("./managers/offline-data-manager");
const system_integration_manager_1 = require("./managers/system-integration-manager");
const system_tray_manager_1 = require("./managers/system-tray-manager");
const window_manager_1 = require("./managers/window-manager");
const environment_1 = require("./utils/environment");
// Load environment variables from .env.local
try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
    console.log('🔧 Environment variables loaded from .env.local');
}
catch (error) {
    console.error('❌ Failed to load .env.local:', error);
}
class StudyCollabApp {
    constructor() {
        this.serverProcess = null;
        this.serverLoaded = false;
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
            if (this.serverProcess) {
                try {
                    this.serverProcess.kill();
                }
                catch { }
            }
        });
    }
    async onReady() {
        console.log('🚀 App is ready, starting initialization...');
        console.log('🔧 Is dev mode:', (0, environment_1.isDev)());
        // Debug environment variables
        console.log('🔧 Environment variables:');
        console.log('  - NODE_ENV:', process.env.NODE_ENV);
        console.log('  - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
        console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
        // In production, start the bundled Next.js server first
        if (!(0, environment_1.isDev)()) {
            console.log('🔧 Starting embedded server for production...');
            await this.startEmbeddedServer();
            await this.waitForServerReady('http://localhost:3000', 30000);
        }
        else {
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
        if (!(0, environment_1.isDev)()) {
            console.log('🔧 Checking for updates...');
            this.autoUpdaterManager.checkForUpdates();
        }
        console.log('🔧 App initialization completed successfully');
        // Offline data is initialized in initializeManagers
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
    async startEmbeddedServer() {
        try {
            // Ensure a port is set for the server (default to 3000)
            if (!process.env.PORT) {
                process.env.PORT = '3000';
            }
            // Resolve path to the bundled server.js
            // When packaged, __dirname points to app.asar/dist/electron
            const serverPathCandidates = [
                (0, path_1.join)(__dirname, '../../server.js'),
            ];
            const serverPath = serverPathCandidates.find((p) => p);
            if (serverPath) {
                try {
                    // Try dynamic import to run in-process (works with asar)
                    const fileUrl = (0, url_1.pathToFileURL)(serverPath).href;
                    await Promise.resolve(`${fileUrl}`).then(s => __importStar(require(s)));
                    this.serverLoaded = true;
                }
                catch (err) {
                    // Fallback to fork if dynamic import fails
                    this.serverProcess = (0, child_process_1.fork)(serverPath, [], {
                        env: { ...process.env, PORT: process.env.PORT || '3000', NODE_ENV: 'production' },
                        stdio: 'inherit',
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to start embedded server:', error);
        }
    }
    async waitForServerReady(url, timeoutMs) {
        const start = Date.now();
        const tryRequest = () => {
            return new Promise((resolve) => {
                try {
                    const req = http_1.default.get(url, (res) => {
                        // Any HTTP response means server is up
                        res.resume();
                        resolve(true);
                    });
                    req.on('error', () => resolve(false));
                    req.setTimeout(3000, () => {
                        req.destroy();
                        resolve(false);
                    });
                }
                catch {
                    resolve(false);
                }
            });
        };
        while (Date.now() - start < timeoutMs) {
            const ok = await tryRequest();
            if (ok)
                return;
            await new Promise((r) => setTimeout(r, 500));
        }
        console.warn('Server did not become ready within timeout; proceeding anyway.');
    }
}
// Initialize the application
const studyCollabApp = new StudyCollabApp();
studyCollabApp.initialize().catch(console.error);
// Handle protocol for file associations
electron_1.app.setAsDefaultProtocolClient('studycollab');
// Handle file associations on Windows/Linux
electron_1.app.on('second-instance', (event, commandLine) => {
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
