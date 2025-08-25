// Electron Security Configuration and Utilities

import { BrowserWindow, session } from 'electron';
import { SecurityConfig, SecurityError } from './types';

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;

  private constructor() {
    this.config = this.getSecurityConfig();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private getSecurityConfig(): SecurityConfig {
    return {
      csp: {
        defaultSrc: isDev 
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:", "ws://localhost:*", "http://localhost:*"]
          : ["'self'", "data:", "blob:"],
        scriptSrc: isDev 
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
          : ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: isDev 
          ? ["'self'", "ws://localhost:*", "http://localhost:*", "https://*.supabase.co", "wss://*.supabase.co"]
          : ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
        fontSrc: ["'self'", "data:"]
      },
      permissions: {
        notifications: true,
        microphone: false,
        camera: false,
        geolocation: false
      }
    };
  }

  public async setupSecurity(): Promise<void> {
    try {
      await this.setupCSP();
      await this.setupPermissions();
      await this.setupSessionSecurity();
      this.setupWebContentsSecurityHandlers();
    } catch (error) {
      throw new SecurityError('setup', 'Failed to setup security configuration', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private async setupCSP(): Promise<void> {
    const cspString = this.buildCSPString();
    
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [cspString],
          'X-Content-Type-Options': ['nosniff'],
          'X-Frame-Options': ['DENY'],
          'X-XSS-Protection': ['1; mode=block'],
          'Referrer-Policy': ['strict-origin-when-cross-origin']
        }
      });
    });
  }

  private buildCSPString(): string {
    const { csp } = this.config;
    return [
      `default-src ${csp.defaultSrc.join(' ')}`,
      `script-src ${csp.scriptSrc.join(' ')}`,
      `style-src ${csp.styleSrc.join(' ')}`,
      `img-src ${csp.imgSrc.join(' ')}`,
      `connect-src ${csp.connectSrc.join(' ')}`,
      `font-src ${csp.fontSrc.join(' ')}`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`
    ].join('; ');
  }

  private async setupPermissions(): Promise<void> {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      const { permissions } = this.config;
      
      switch (permission) {
        case 'notifications':
          callback(permissions.notifications);
          break;
        case 'media':
          callback(permissions.microphone || permissions.camera);
          break;
        case 'geolocation':
          callback(permissions.geolocation);
          break;
        default:
          callback(false);
      }
    });
  }

  private async setupSessionSecurity(): Promise<void> {
    // Clear potentially sensitive data in production
    if (!isDev) {
      await session.defaultSession.clearCache();
      await session.defaultSession.clearStorageData({
        storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers']
      });
    }

    // Block external resource loading in production
    if (!isDev) {
      session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const url = new URL(details.url);
        
        // Allow local resources and Supabase
        if (url.protocol === 'file:' || 
            url.hostname === 'localhost' || 
            url.hostname.endsWith('.supabase.co') ||
            url.hostname.endsWith('.supabase.com')) {
          callback({});
          return;
        }
        
        // Block everything else
        callback({ cancel: true });
      });
    }
  }

  private setupWebContentsSecurityHandlers(): void {
    // This will be called for each new webContents
    const setupWebContentsSecurity = (webContents: Electron.WebContents) => {
      // Prevent new window creation
      webContents.setWindowOpenHandler(({ url }) => {
        // Only allow external URLs to be opened in default browser
        if (url.startsWith('http://') || url.startsWith('https://')) {
          require('electron').shell.openExternal(url);
        }
        return { action: 'deny' };
      });

      // Prevent navigation to external URLs
      webContents.on('will-navigate', (event, navigationUrl) => {
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

      // Note: new-window event is deprecated, using setWindowOpenHandler instead

      // Handle console messages in production
      if (!isDev) {
        webContents.on('console-message', (event, level, message) => {
          console.log(`Renderer console [${level}]:`, message);
        });
      }
    };

    // Apply to existing webContents
    BrowserWindow.getAllWindows().forEach(window => {
      setupWebContentsSecurity(window.webContents);
    });

    // Apply to new webContents
    require('electron').app.on('web-contents-created', (_: any, contents: any) => {
      setupWebContentsSecurity(contents);
    });
  }

  public validateIPCMessage(data: any): boolean {
    try {
      // Basic validation - can be enhanced based on specific needs
      if (typeof data === 'object' && data !== null) {
        // Check for potentially dangerous properties
        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        const hasDangerousKeys = dangerousKeys.some(key => key in data);
        
        if (hasDangerousKeys) {
          throw new SecurityError('ipc-validation', 'Dangerous properties detected in IPC message');
        }
        
        // Check for circular references
        try {
          JSON.stringify(data);
        } catch (error) {
          throw new SecurityError('ipc-validation', 'Circular reference detected in IPC message');
        }
      }
      
      return true;
    } catch (error) {
      console.error('IPC message validation failed:', error);
      return false;
    }
  }

  public sanitizeString(input: string, maxLength: number = 500): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .substring(0, maxLength);
  }

  public validateBounds(bounds: any): boolean {
    if (!bounds || typeof bounds !== 'object') {
      return false;
    }
    
    const { width, height, x, y } = bounds;
    
    // Validate dimensions
    if (typeof width !== 'number' || typeof height !== 'number' ||
        width < 400 || height < 300 ||
        width > 4000 || height > 4000) {
      return false;
    }
    
    // Validate position (optional)
    if (x !== undefined && (typeof x !== 'number' || x < -2000 || x > 10000)) {
      return false;
    }
    
    if (y !== undefined && (typeof y !== 'number' || y < -2000 || y > 10000)) {
      return false;
    }
    
    return true;
  }

  public validateFilePath(filePath: string): boolean {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      return false;
    }
    
    // Check for dangerous path patterns
    const dangerousPatterns = [
      /\.\./g, // Directory traversal
      /^\/etc/i, // System directories
      /^\/proc/i,
      /^\/sys/i,
      /^C:\\Windows/i,
      /^C:\\System32/i,
      /\.exe$/i, // Executable files
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.com$/i,
      /\.pif$/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(filePath));
  }

  public validateNotificationOptions(options: any): boolean {
    if (!options || typeof options !== 'object') {
      return true; // Options are optional
    }
    
    // Validate icon path if provided
    if (options.icon && (typeof options.icon !== 'string' || options.icon.length > 500)) {
      return false;
    }
    
    // Validate urgency level
    if (options.urgency && !['normal', 'critical', 'low'].includes(options.urgency)) {
      return false;
    }
    
    // Validate silent flag
    if (options.silent !== undefined && typeof options.silent !== 'boolean') {
      return false;
    }
    
    return true;
  }

  public createIPCResponse<T>(success: boolean, data?: T, error?: string): IPCResponse<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now()
    };
  }
}

// Enhanced IPCResponse interface
interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}



