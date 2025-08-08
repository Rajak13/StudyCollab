// Simple test file to verify Electron setup
import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load a simple HTML page for testing
  mainWindow.loadURL('data:text/html,<h1>StudyCollab Desktop App Test</h1><p>Electron setup is working!</p>');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});