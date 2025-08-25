// Desktop API type definitions for StudyCollab Electron App

interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

interface NotificationOptions {
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
}

interface DragDropFile {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface DesktopAPI {
  // System Integration
  showNotification(title: string, body: string, options?: NotificationOptions): Promise<IPCResponse<boolean>>;
  minimizeToTray(): Promise<IPCResponse<boolean>>;
  showWindow(): Promise<IPCResponse<boolean>>;
  setTrayBadge(count: number): Promise<IPCResponse<boolean>>;
  
  // File Operations
  showSaveDialog(options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue>;
  showOpenDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>;
  readFile(filePath: string): Promise<IPCResponse<string>>;
  writeFile(filePath: string, content: string): Promise<IPCResponse<boolean>>;
  watchFile(filePath: string): Promise<IPCResponse<boolean>>;
  unwatchFile(filePath: string): Promise<IPCResponse<boolean>>;
  
  // Drag and Drop
  onFileDrop(callback: (files: DragDropFile[]) => void): void;
  
  // Window Management
  toggleFullscreen(): Promise<IPCResponse<{ isFullScreen: boolean }>>;
  getWindowBounds(): Promise<IPCResponse<Electron.Rectangle | null>>;
  setWindowBounds(bounds: Electron.Rectangle): Promise<IPCResponse<boolean>>;
  setWindowTitle(title: string): Promise<IPCResponse<boolean>>;
  getWindowState(): Promise<IPCResponse<{
    isMaximized: boolean;
    isMinimized: boolean;
    isFullScreen: boolean;
    isFocused: boolean;
  }>>;
  
  // App Lifecycle
  getAppVersion(): Promise<IPCResponse<string>>;
  getAppInfo(): Promise<IPCResponse<{
    name: string;
    version: string;
    platform: string;
    arch: string;
    isDev: boolean;
  }>>;
  checkForUpdates(): Promise<IPCResponse<boolean>>;
  
  // Event Listeners
  onMenuAction(callback: (action: string, data?: any) => void): void;
  onDeepLink(callback: (linkData: any) => void): void;
  onFileWatch(callback: (filePath: string, eventType: string) => void): void;
  onUpdateAvailable(callback: (updateInfo: any) => void): void;
  onUpdateDownloaded(callback: () => void): void;
  removeAllListeners(): void;
  
  // Utility
  isElectron(): boolean;
  ping(): Promise<IPCResponse<string>>;
}

// Extend the global Window interface
declare global {
  interface Window {
    desktopAPI?: DesktopAPI;
  }
}

// Desktop-specific configuration types
export interface DesktopConfig {
  window: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    resizable: boolean;
    frame: boolean;
  };
  
  features: {
    systemTray: boolean;
    notifications: boolean;
    autoUpdates: boolean;
    globalShortcuts: boolean;
  };
  
  security: {
    nodeIntegration: boolean;
    contextIsolation: boolean;
    sandbox: boolean;
    webSecurity: boolean;
  };
  
  branding: {
    appName: string;
    iconPath: string;
    trayIconPath: string;
    splashScreenPath: string;
  };
}

// Desktop state management types
export interface DesktopState {
  // Landing Page State
  currentLandingSection: string;
  landingCompleted: boolean;
  
  // Desktop Features
  systemTrayVisible: boolean;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  
  // Window State
  windowBounds: Electron.Rectangle | null;
  isFullscreen: boolean;
  isMinimized: boolean;
  
  // Actions
  setLandingSection: (section: string) => void;
  toggleSystemTray: () => void;
  updateWindowBounds: (bounds: Electron.Rectangle) => void;
}

// Utility function to check if running in Electron
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.desktopAPI !== undefined;
}