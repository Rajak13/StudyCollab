import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// Simple test version of main process for development verification
class TestElectronApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    app.whenReady().then(() => {
      this.createWindow();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load a simple HTML page for testing
    this.mainWindow.loadURL('data:text/html,<h1>StudyCollab Electron Test</h1><p>Electron environment is working!</p>');

    this.mainWindow.webContents.openDevTools();

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }
}

new TestElectronApp();