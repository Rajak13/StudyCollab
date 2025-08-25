import { contextBridge, ipcRenderer } from 'electron';

// Enhanced response interface for better error handling
interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

// File operation interfaces
interface FileOperationResult {
  success: boolean;
  filePath?: string;
  content?: string;
  error?: string;
}

interface DragDropFile {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
}

// Desktop API interface with enhanced error handling and expanded functionality
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
  restartApp(): Promise<IPCResponse<boolean>>;
  quitApp(): Promise<IPCResponse<boolean>>;
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

interface NotificationOptions {
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
}

// Enhanced security validation helpers
const validateInput = (input: any, type: string, options?: any): boolean => {
  switch (type) {
    case 'string':
      const maxLength = options?.maxLength || 1000;
      const minLength = options?.minLength || 0;
      return typeof input === 'string' && 
             input.length >= minLength && 
             input.length <= maxLength &&
             !containsDangerousPatterns(input);
    case 'object':
      return typeof input === 'object' && 
             input !== null && 
             !hasCircularReferences(input) &&
             !hasDangerousProperties(input);
    case 'number':
      const min = options?.min ?? Number.MIN_SAFE_INTEGER;
      const max = options?.max ?? Number.MAX_SAFE_INTEGER;
      return typeof input === 'number' && 
             !isNaN(input) && 
             input >= min && 
             input <= max;
    case 'bounds':
      return validateBounds(input);
    default:
      return false;
  }
};

// Security: Check for dangerous patterns in strings
const containsDangerousPatterns = (input: string): boolean => {
  const dangerousPatterns = [
    /javascript:/gi,
    /data:.*script/gi,
    /vbscript:/gi,
    /<script/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
};

// Security: Check for circular references
const hasCircularReferences = (obj: any): boolean => {
  try {
    JSON.stringify(obj);
    return false;
  } catch (error) {
    return true;
  }
};

// Security: Check for dangerous object properties
const hasDangerousProperties = (obj: any): boolean => {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  return dangerousKeys.some(key => key in obj);
};

// Security: Validate window bounds
const validateBounds = (bounds: any): boolean => {
  if (!bounds || typeof bounds !== 'object') return false;
  
  const { width, height, x, y } = bounds;
  
  // Validate required dimensions
  if (typeof width !== 'number' || typeof height !== 'number') return false;
  if (width < 400 || height < 300 || width > 4000 || height > 4000) return false;
  
  // Validate optional position
  if (x !== undefined && (typeof x !== 'number' || x < -2000 || x > 10000)) return false;
  if (y !== undefined && (typeof y !== 'number' || y < -2000 || y > 10000)) return false;
  
  return true;
};

// Security: Enhanced string sanitization
const sanitizeString = (input: string, maxLength: number = 500): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .replace(/vbscript:/gi, '') // Remove vbscript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .substring(0, maxLength);
};

// Error handling wrapper for IPC calls
const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string
): Promise<IPCResponse<T>> => {
  try {
    const result = await operation();
    return {
      success: true,
      data: result,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`${operationName} error:`, error);
    return {
      success: false,
      data: fallbackValue,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const desktopAPI: DesktopAPI = {
  // System Integration
  showNotification: async (title: string, body: string, options?: NotificationOptions) => {
    return withErrorHandling(async () => {
      if (!validateInput(title, 'string', { maxLength: 100 }) || 
          !validateInput(body, 'string', { maxLength: 300 })) {
        throw new Error('Invalid notification parameters');
      }
      
      const sanitizedOptions = options ? {
        icon: options.icon ? sanitizeString(options.icon, 200) : undefined,
        silent: typeof options.silent === 'boolean' ? options.silent : false,
        urgency: ['normal', 'critical', 'low'].includes(options.urgency || '') ? options.urgency : 'normal'
      } : {};
      
      const result = await ipcRenderer.invoke('desktop-api:show-notification', 
        sanitizeString(title, 100), 
        sanitizeString(body, 300),
        sanitizedOptions
      );
      return result.data;
    }, false, 'showNotification');
  },
  
  minimizeToTray: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:minimize-to-tray');
      return result.data;
    }, false, 'minimizeToTray');
  },
  
  showWindow: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:show-window');
      return result.data;
    }, false, 'showWindow');
  },
  
  setTrayBadge: async (count: number) => {
    return withErrorHandling(async () => {
      if (!validateInput(count, 'number', { min: 0, max: 999 })) {
        throw new Error('Invalid badge count');
      }
      
      const result = await ipcRenderer.invoke('desktop-api:set-tray-badge', count);
      return result.data;
    }, false, 'setTrayBadge');
  },
  
  // File Operations
  showSaveDialog: async (options: Electron.SaveDialogOptions) => {
    try {
      if (!validateInput(options, 'object')) {
        return { canceled: true, filePath: undefined };
      }
      
      // Sanitize file dialog options
      const sanitizedOptions = {
        ...options,
        title: options.title ? sanitizeString(options.title, 100) : undefined,
        defaultPath: options.defaultPath ? sanitizeString(options.defaultPath, 500) : undefined,
        buttonLabel: options.buttonLabel ? sanitizeString(options.buttonLabel, 50) : undefined
      };
      
      return await ipcRenderer.invoke('desktop-api:show-save-dialog', sanitizedOptions);
    } catch (error) {
      console.error('Save dialog error:', error);
      return { canceled: true, filePath: undefined };
    }
  },
  
  showOpenDialog: async (options: Electron.OpenDialogOptions) => {
    try {
      if (!validateInput(options, 'object')) {
        return { canceled: true, filePaths: [] };
      }
      
      // Sanitize file dialog options
      const sanitizedOptions = {
        ...options,
        title: options.title ? sanitizeString(options.title, 100) : undefined,
        defaultPath: options.defaultPath ? sanitizeString(options.defaultPath, 500) : undefined,
        buttonLabel: options.buttonLabel ? sanitizeString(options.buttonLabel, 50) : undefined
      };
      
      return await ipcRenderer.invoke('desktop-api:show-open-dialog', sanitizedOptions);
    } catch (error) {
      console.error('Open dialog error:', error);
      return { canceled: true, filePaths: [] };
    }
  },
  
  readFile: async (filePath: string) => {
    return withErrorHandling(async () => {
      if (!validateInput(filePath, 'string', { maxLength: 500 })) {
        throw new Error('Invalid file path');
      }
      
      const result = await ipcRenderer.invoke('desktop-api:read-file', sanitizeString(filePath, 500));
      return result.data;
    }, '', 'readFile');
  },
  
  writeFile: async (filePath: string, content: string) => {
    return withErrorHandling(async () => {
      if (!validateInput(filePath, 'string', { maxLength: 500 }) ||
          !validateInput(content, 'string', { maxLength: 10000000 })) { // 10MB limit
        throw new Error('Invalid file parameters');
      }
      
      const result = await ipcRenderer.invoke('desktop-api:write-file', 
        sanitizeString(filePath, 500), content);
      return result.data;
    }, false, 'writeFile');
  },
  
  watchFile: async (filePath: string) => {
    return withErrorHandling(async () => {
      if (!validateInput(filePath, 'string', { maxLength: 500 })) {
        throw new Error('Invalid file path');
      }
      
      const result = await ipcRenderer.invoke('desktop-api:watch-file', sanitizeString(filePath, 500));
      return result.data;
    }, false, 'watchFile');
  },
  
  unwatchFile: async (filePath: string) => {
    return withErrorHandling(async () => {
      if (!validateInput(filePath, 'string', { maxLength: 500 })) {
        throw new Error('Invalid file path');
      }
      
      const result = await ipcRenderer.invoke('desktop-api:unwatch-file', sanitizeString(filePath, 500));
      return result.data;
    }, false, 'unwatchFile');
  },
  
  // Drag and Drop
  onFileDrop: (callback: (files: DragDropFile[]) => void) => {
    ipcRenderer.on('file-drop', (_, files: DragDropFile[]) => {
      try {
        // Validate and sanitize dropped files
        const sanitizedFiles = files.filter(file => 
          validateInput(file.name, 'string', { maxLength: 255 }) &&
          validateInput(file.path, 'string', { maxLength: 500 }) &&
          validateInput(file.size, 'number', { min: 0, max: 100000000 }) // 100MB limit
        ).map(file => ({
          ...file,
          name: sanitizeString(file.name, 255),
          path: sanitizeString(file.path, 500)
        }));
        
        callback(sanitizedFiles);
      } catch (error) {
        console.error('File drop callback error:', error);
      }
    });
  },
  
  // Window Management
  toggleFullscreen: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:toggle-fullscreen');
      return result.data;
    }, { isFullScreen: false }, 'toggleFullscreen');
  },
  
  getWindowBounds: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:get-window-bounds');
      return result.data;
    }, null, 'getWindowBounds');
  },
  
  setWindowBounds: async (bounds: Electron.Rectangle) => {
    return withErrorHandling(async () => {
      if (!validateInput(bounds, 'bounds')) {
        throw new Error('Invalid bounds object');
      }
      
      const result = await ipcRenderer.invoke('desktop-api:set-window-bounds', bounds);
      return result.data;
    }, false, 'setWindowBounds');
  },
  
  setWindowTitle: async (title: string) => {
    return withErrorHandling(async () => {
      if (!validateInput(title, 'string', { maxLength: 100 })) {
        throw new Error('Invalid window title');
      }
      
      const result = await ipcRenderer.invoke('desktop-api:set-window-title', sanitizeString(title, 100));
      return result.data;
    }, false, 'setWindowTitle');
  },
  
  getWindowState: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:get-window-state');
      return result.data;
    }, {
      isMaximized: false,
      isMinimized: false,
      isFullScreen: false,
      isFocused: false
    }, 'getWindowState');
  },
  
  // App Lifecycle
  getAppVersion: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:get-app-version');
      return result.data;
    }, '0.0.0', 'getAppVersion');
  },
  
  getAppInfo: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:get-app-info');
      return result.data;
    }, {
      name: 'StudyCollab',
      version: '0.0.0',
      platform: 'unknown',
      arch: 'unknown',
      isDev: false
    }, 'getAppInfo');
  },
  
  restartApp: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:restart-app');
      return result.data;
    }, false, 'restartApp');
  },
  
  quitApp: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:quit-app');
      return result.data;
    }, false, 'quitApp');
  },
  
  checkForUpdates: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:check-for-updates');
      return result.data;
    }, false, 'checkForUpdates');
  },
  
  // Event Listeners
  onMenuAction: (callback: (action: string, data?: any) => void) => {
    const menuHandlers = [
      'menu-new-session',
      'menu-open-file',
      'menu-about'
    ];
    
    menuHandlers.forEach(channel => {
      ipcRenderer.on(channel, (_, data) => {
        try {
          // Validate and sanitize callback data
          const sanitizedData = data && typeof data === 'object' ? 
            JSON.parse(JSON.stringify(data)) : data; // Deep clone to prevent prototype pollution
          callback(channel.replace('menu-', ''), sanitizedData);
        } catch (error) {
          console.error('Menu action callback error:', error);
        }
      });
    });
  },
  
  onDeepLink: (callback: (linkData: any) => void) => {
    ipcRenderer.on('deep-link', (_, linkData) => {
      try {
        // Validate deep link data
        if (linkData && typeof linkData === 'object') {
          const sanitizedLinkData = {
            protocol: sanitizeString(linkData.protocol || '', 20),
            hostname: sanitizeString(linkData.hostname || '', 100),
            pathname: sanitizeString(linkData.pathname || '', 200),
            search: sanitizeString(linkData.search || '', 200),
            hash: sanitizeString(linkData.hash || '', 100)
          };
          callback(sanitizedLinkData);
        }
      } catch (error) {
        console.error('Deep link callback error:', error);
      }
    });
  },
  
  onFileWatch: (callback: (filePath: string, eventType: string) => void) => {
    ipcRenderer.on('file-watch', (_, filePath: string, eventType: string) => {
      try {
        if (validateInput(filePath, 'string', { maxLength: 500 }) &&
            validateInput(eventType, 'string', { maxLength: 20 })) {
          callback(sanitizeString(filePath, 500), sanitizeString(eventType, 20));
        }
      } catch (error) {
        console.error('File watch callback error:', error);
      }
    });
  },
  
  onUpdateAvailable: (callback: (updateInfo: any) => void) => {
    ipcRenderer.on('update-available', (_, updateInfo) => {
      try {
        // Sanitize update info
        const sanitizedInfo = updateInfo && typeof updateInfo === 'object' ? {
          version: sanitizeString(updateInfo.version || '', 20),
          releaseDate: sanitizeString(updateInfo.releaseDate || '', 50),
          releaseNotes: sanitizeString(updateInfo.releaseNotes || '', 1000)
        } : null;
        
        if (sanitizedInfo) {
          callback(sanitizedInfo);
        }
      } catch (error) {
        console.error('Update available callback error:', error);
      }
    });
  },
  
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => {
      try {
        callback();
      } catch (error) {
        console.error('Update downloaded callback error:', error);
      }
    });
  },
  
  removeAllListeners: () => {
    try {
      const channels = [
        'menu-new-session',
        'menu-open-file', 
        'menu-about',
        'deep-link',
        'file-drop',
        'file-watch',
        'update-available',
        'update-downloaded'
      ];
      
      channels.forEach(channel => {
        ipcRenderer.removeAllListeners(channel);
      });
    } catch (error) {
      console.error('Remove listeners error:', error);
    }
  },
  
  // Utility
  isElectron: () => {
    return true; // This will only be available in Electron context
  },
  
  ping: async () => {
    return withErrorHandling(async () => {
      const result = await ipcRenderer.invoke('desktop-api:ping');
      return result.data;
    }, 'pong', 'ping');
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('desktopAPI', desktopAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    desktopAPI: DesktopAPI;
  }
}