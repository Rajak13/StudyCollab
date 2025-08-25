// Electron Desktop Application Types

export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

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

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

export interface DeepLinkData {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
}

// File operation types
export interface FileOperationResult {
  success: boolean;
  filePath?: string;
  content?: string;
  error?: string;
}

export interface DragDropFile {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
}

// IPC Channel types for type safety
export type IPCChannel = 
  | 'desktop-api:ping'
  | 'desktop-api:show-notification'
  | 'desktop-api:minimize-to-tray'
  | 'desktop-api:show-window'
  | 'desktop-api:set-tray-badge'
  | 'desktop-api:show-save-dialog'
  | 'desktop-api:show-open-dialog'
  | 'desktop-api:read-file'
  | 'desktop-api:write-file'
  | 'desktop-api:watch-file'
  | 'desktop-api:unwatch-file'
  | 'desktop-api:toggle-fullscreen'
  | 'desktop-api:get-window-bounds'
  | 'desktop-api:set-window-bounds'
  | 'desktop-api:set-window-title'
  | 'desktop-api:get-window-state'
  | 'desktop-api:get-app-version'
  | 'desktop-api:get-app-info'
  | 'desktop-api:restart-app'
  | 'desktop-api:quit-app'
  | 'desktop-api:check-for-updates';

// Event channel types
export type EventChannel =
  | 'menu-new-session'
  | 'menu-open-file'
  | 'menu-about'
  | 'deep-link'
  | 'file-drop'
  | 'file-watch'
  | 'update-available'
  | 'update-downloaded';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  arch: string;
  isDev: boolean;
}

// Security-related types
export interface SecurityConfig {
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
  };
  permissions: {
    notifications: boolean;
    microphone: boolean;
    camera: boolean;
    geolocation: boolean;
  };
}

// Menu-related types
export interface MenuAction {
  type: 'new-session' | 'open-file' | 'about' | 'quit' | 'preferences';
  data?: any;
}

// Update-related types
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
  size: number;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

// Error types
export class ElectronError extends Error {
  constructor(
    public code: string,
    public operation: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ElectronError';
  }
}

export class IPCError extends ElectronError {
  constructor(
    public channel: string,
    public data: any,
    originalError: Error
  ) {
    super('IPC_ERROR', 'ipc-communication', `IPC communication failed on channel: ${channel}`, originalError);
  }
}

export class SecurityError extends ElectronError {
  constructor(
    public securityType: string,
    message: string,
    originalError?: Error
  ) {
    super('SECURITY_ERROR', 'security-validation', message, originalError);
  }
}