// Desktop Error Manager - Centralized error handling and recovery for StudyCollab Electron App

import { useDesktopAPI } from '@/hooks/useDesktopAPI';
import type {
    CrashReport,
    DesktopError,
    DesktopErrorRecoveryAction,
    DesktopErrorSeverity,
    DesktopErrorType,
    DiagnosticInfo,
    ErrorRecoveryStrategy
} from '@/types/desktop-errors';
import { createDesktopError } from '@/types/desktop-errors';

export class DesktopErrorManager {
  private static instance: DesktopErrorManager;
  private errors: Map<string, DesktopError> = new Map();
  private errorListeners: Set<(error: DesktopError) => void> = new Set();
  private recoveryListeners: Set<(errorId: string, success: boolean) => void> = new Set();
  private crashReportListeners: Set<(report: CrashReport) => void> = new Set();
  private userActions: string[] = [];
  private logs: string[] = [];
  private maxLogEntries = 1000;
  private maxUserActions = 100;

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.startPeriodicCleanup();
  }

  public static getInstance(): DesktopErrorManager {
    if (!DesktopErrorManager.instance) {
      DesktopErrorManager.instance = new DesktopErrorManager();
    }
    return DesktopErrorManager.instance;
  }

  /**
   * Report a new desktop error
   */
  public reportError(
    type: DesktopErrorType,
    message: string,
    userMessage: string,
    options: Partial<DesktopError> = {}
  ): DesktopError {
    const error = createDesktopError(type, message, userMessage, options);
    this.errors.set(error.id, error);
    
    this.log(`Error reported: ${error.type} - ${error.message}`);
    
    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Auto-handle critical errors
    if (error.severity === DesktopErrorSeverity.CRITICAL) {
      this.handleCriticalError(error);
    }

    // Auto-retry recoverable errors with retry count < max
    if (error.isRecoverable && error.retryCount < error.maxRetries) {
      this.scheduleAutoRetry(error);
    }

    return error;
  }

  /**
   * Report an error from a caught exception
   */
  public reportException(
    error: Error,
    type: DesktopErrorType = DesktopErrorType.UNKNOWN_ERROR,
    userMessage?: string,
    context?: Record<string, any>
  ): DesktopError {
    const desktopError = this.reportError(
      type,
      error.message,
      userMessage || this.getDefaultUserMessage(type),
      {
        originalError: error,
        context,
        technicalDetails: error.stack
      }
    );

    return desktopError;
  }

  /**
   * Get recovery strategies for an error
   */
  public getRecoveryStrategies(errorId: string): ErrorRecoveryStrategy[] {
    const error = this.errors.get(errorId);
    if (!error) return [];

    return error.recoveryActions.map(action => this.createRecoveryStrategy(error, action));
  }

  /**
   * Execute a recovery action for an error
   */
  public async executeRecovery(errorId: string, action: DesktopErrorRecoveryAction): Promise<boolean> {
    const error = this.errors.get(errorId);
    if (!error) return false;

    this.log(`Executing recovery action: ${action} for error: ${errorId}`);
    this.recordUserAction(`Recovery: ${action} for ${error.type}`);

    try {
      const success = await this.performRecoveryAction(error, action);
      
      if (success) {
        error.retryCount = 0; // Reset retry count on successful recovery
        this.log(`Recovery successful for error: ${errorId}`);
      } else {
        error.retryCount++;
        this.log(`Recovery failed for error: ${errorId}`);
      }

      // Notify recovery listeners
      this.recoveryListeners.forEach(listener => {
        try {
          listener(errorId, success);
        } catch (e) {
          console.error('Error in recovery listener:', e);
        }
      });

      return success;
    } catch (recoveryError) {
      this.log(`Recovery action failed with exception: ${recoveryError}`);
      error.retryCount++;
      return false;
    }
  }

  /**
   * Clear an error (mark as resolved)
   */
  public clearError(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) return false;

    this.errors.delete(errorId);
    this.log(`Error cleared: ${errorId}`);
    return true;
  }

  /**
   * Get all active errors
   */
  public getActiveErrors(): DesktopError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: DesktopErrorSeverity): DesktopError[] {
    return this.getActiveErrors().filter(error => error.severity === severity);
  }

  /**
   * Generate diagnostic information
   */
  public async generateDiagnosticInfo(): Promise<DiagnosticInfo> {
    const { desktopAPI } = useDesktopAPI();
    
    try {
      const [appInfo, windowBounds, windowState] = await Promise.all([
        desktopAPI.getAppInfo(),
        desktopAPI.getWindowBounds(),
        desktopAPI.getWindowState()
      ]);

      return {
        timestamp: Date.now(),
        appInfo: appInfo.data || {
          name: 'StudyCollab',
          version: '1.0.0',
          platform: 'unknown',
          arch: 'unknown',
          isDev: false
        },
        systemInfo: {
          totalMemory: this.getTotalMemory(),
          freeMemory: this.getFreeMemory(),
          cpuUsage: this.getCpuUsage(),
          uptime: this.getUptime(),
          nodeVersion: process.version || 'unknown',
          electronVersion: process.versions?.electron || 'unknown'
        },
        windowInfo: {
          bounds: windowBounds.data,
          isMaximized: windowState.data?.isMaximized || false,
          isMinimized: windowState.data?.isMinimized || false,
          isFullScreen: windowState.data?.isFullScreen || false,
          isFocused: windowState.data?.isFocused || false
        },
        featureStatus: {
          systemTray: true, // TODO: Get actual status
          notifications: true, // TODO: Get actual status
          autoUpdates: true, // TODO: Get actual status
          offlineMode: false // TODO: Get actual status
        },
        recentErrors: this.getActiveErrors().slice(-10),
        performanceMetrics: {
          startupTime: this.getStartupTime(),
          memoryUsage: this.getMemoryUsage(),
          ipcLatency: await this.measureIpcLatency()
        }
      };
    } catch (error) {
      // Fallback diagnostic info
      return {
        timestamp: Date.now(),
        appInfo: {
          name: 'StudyCollab',
          version: '1.0.0',
          platform: 'unknown',
          arch: 'unknown',
          isDev: false
        },
        systemInfo: {
          totalMemory: 0,
          freeMemory: 0,
          cpuUsage: 0,
          uptime: 0,
          nodeVersion: 'unknown',
          electronVersion: 'unknown'
        },
        windowInfo: {
          bounds: null,
          isMaximized: false,
          isMinimized: false,
          isFullScreen: false,
          isFocused: false
        },
        featureStatus: {
          systemTray: false,
          notifications: false,
          autoUpdates: false,
          offlineMode: false
        },
        recentErrors: this.getActiveErrors().slice(-10),
        performanceMetrics: {
          startupTime: 0,
          memoryUsage: 0,
          ipcLatency: 0
        }
      };
    }
  }

  /**
   * Generate crash report
   */
  public async generateCrashReport(error: DesktopError, userConsent: boolean = false): Promise<CrashReport> {
    const diagnosticInfo = await this.generateDiagnosticInfo();
    
    const crashReport: CrashReport = {
      id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      appVersion: diagnosticInfo.appInfo.version,
      platform: diagnosticInfo.appInfo.platform,
      arch: diagnosticInfo.appInfo.arch,
      error,
      systemInfo: diagnosticInfo.systemInfo,
      userActions: [...this.userActions],
      logs: [...this.logs],
      stackTrace: error.originalError?.stack,
      userConsent
    };

    // Notify crash report listeners
    this.crashReportListeners.forEach(listener => {
      try {
        listener(crashReport);
      } catch (e) {
        console.error('Error in crash report listener:', e);
      }
    });

    return crashReport;
  }

  /**
   * Add error listener
   */
  public onError(listener: (error: DesktopError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Add recovery listener
   */
  public onRecovery(listener: (errorId: string, success: boolean) => void): () => void {
    this.recoveryListeners.add(listener);
    return () => this.recoveryListeners.delete(listener);
  }

  /**
   * Add crash report listener
   */
  public onCrashReport(listener: (report: CrashReport) => void): () => void {
    this.crashReportListeners.add(listener);
    return () => this.crashReportListeners.delete(listener);
  }

  /**
   * Record user action for debugging
   */
  public recordUserAction(action: string): void {
    this.userActions.push(`${new Date().toISOString()}: ${action}`);
    if (this.userActions.length > this.maxUserActions) {
      this.userActions = this.userActions.slice(-this.maxUserActions);
    }
  }

  /**
   * Log message for debugging
   */
  public log(message: string): void {
    const logEntry = `${new Date().toISOString()}: ${message}`;
    this.logs.push(logEntry);
    console.log(`[DesktopErrorManager] ${logEntry}`);
    
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  // Private methods

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.reportException(
          new Error(event.reason),
          DesktopErrorType.UNKNOWN_ERROR,
          'An unexpected error occurred. The application will continue running.',
          { type: 'unhandledrejection', reason: event.reason }
        );
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.reportException(
          event.error || new Error(event.message),
          DesktopErrorType.UNKNOWN_ERROR,
          'An unexpected error occurred. The application will continue running.',
          { 
            type: 'error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        );
      });
    }
  }

  private startPeriodicCleanup(): void {
    // Clean up old errors every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      for (const [id, error] of this.errors.entries()) {
        if (now - error.timestamp > maxAge) {
          this.errors.delete(id);
        }
      }
    }, 5 * 60 * 1000);
  }

  private async handleCriticalError(error: DesktopError): Promise<void> {
    this.log(`Handling critical error: ${error.type}`);
    
    // Generate crash report
    const crashReport = await this.generateCrashReport(error, false);
    
    // Try to recover automatically for some critical errors
    if (error.recoveryActions.includes(DesktopErrorRecoveryAction.RESTART_COMPONENT)) {
      await this.executeRecovery(error.id, DesktopErrorRecoveryAction.RESTART_COMPONENT);
    }
  }

  private scheduleAutoRetry(error: DesktopError): void {
    const delay = Math.min(1000 * Math.pow(2, error.retryCount), 30000); // Exponential backoff, max 30s
    
    setTimeout(async () => {
      if (this.errors.has(error.id) && error.retryCount < error.maxRetries) {
        this.log(`Auto-retrying error: ${error.id} (attempt ${error.retryCount + 1})`);
        await this.executeRecovery(error.id, DesktopErrorRecoveryAction.RETRY);
      }
    }, delay);
  }

  private createRecoveryStrategy(error: DesktopError, action: DesktopErrorRecoveryAction): ErrorRecoveryStrategy {
    const strategies: Record<DesktopErrorRecoveryAction, Omit<ErrorRecoveryStrategy, 'execute'>> = {
      [DesktopErrorRecoveryAction.RETRY]: {
        label: 'Try Again',
        description: 'Attempt the operation again',
        isDestructive: false,
        requiresConfirmation: false
      },
      [DesktopErrorRecoveryAction.RESTART_APP]: {
        label: 'Restart Application',
        description: 'Restart the entire application to resolve the issue',
        isDestructive: true,
        requiresConfirmation: true
      },
      [DesktopErrorRecoveryAction.RESTART_COMPONENT]: {
        label: 'Restart Component',
        description: 'Restart the affected component',
        isDestructive: false,
        requiresConfirmation: false
      },
      [DesktopErrorRecoveryAction.FALLBACK_MODE]: {
        label: 'Use Fallback Mode',
        description: 'Continue with limited functionality',
        isDestructive: false,
        requiresConfirmation: false
      },
      [DesktopErrorRecoveryAction.DISABLE_FEATURE]: {
        label: 'Disable Feature',
        description: 'Disable the problematic feature and continue',
        isDestructive: false,
        requiresConfirmation: true
      },
      [DesktopErrorRecoveryAction.USER_ACTION_REQUIRED]: {
        label: 'Manual Action Required',
        description: 'Follow the provided instructions to resolve the issue',
        isDestructive: false,
        requiresConfirmation: false
      },
      [DesktopErrorRecoveryAction.CONTACT_SUPPORT]: {
        label: 'Contact Support',
        description: 'Get help from the support team',
        isDestructive: false,
        requiresConfirmation: false
      },
      [DesktopErrorRecoveryAction.NO_ACTION]: {
        label: 'Continue',
        description: 'Continue without taking any action',
        isDestructive: false,
        requiresConfirmation: false
      }
    };

    const strategy = strategies[action];
    
    return {
      action,
      ...strategy,
      execute: () => this.performRecoveryAction(error, action)
    };
  }

  private async performRecoveryAction(error: DesktopError, action: DesktopErrorRecoveryAction): Promise<boolean> {
    const { desktopAPI } = useDesktopAPI();
    
    try {
      switch (action) {
        case DesktopErrorRecoveryAction.RETRY:
          // The actual retry logic should be implemented by the calling code
          return true;

        case DesktopErrorRecoveryAction.RESTART_APP:
          // Request app restart
          if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
          }
          return true;

        case DesktopErrorRecoveryAction.RESTART_COMPONENT:
          // Component restart logic would be handled by the specific component
          return true;

        case DesktopErrorRecoveryAction.FALLBACK_MODE:
          // Enable fallback mode
          return true;

        case DesktopErrorRecoveryAction.DISABLE_FEATURE:
          // Disable the problematic feature
          return true;

        case DesktopErrorRecoveryAction.USER_ACTION_REQUIRED:
          // Show user instructions
          return true;

        case DesktopErrorRecoveryAction.CONTACT_SUPPORT:
          // Open support contact
          return true;

        case DesktopErrorRecoveryAction.NO_ACTION:
          return true;

        default:
          return false;
      }
    } catch (recoveryError) {
      this.log(`Recovery action ${action} failed: ${recoveryError}`);
      return false;
    }
  }

  private getDefaultUserMessage(type: DesktopErrorType): string {
    const messages: Record<DesktopErrorType, string> = {
      [DesktopErrorType.SYSTEM_TRAY_ERROR]: 'System tray functionality is not available.',
      [DesktopErrorType.NOTIFICATION_ERROR]: 'Desktop notifications are not working properly.',
      [DesktopErrorType.SHORTCUT_ERROR]: 'Keyboard shortcuts are not responding.',
      [DesktopErrorType.FILE_ASSOCIATION_ERROR]: 'File associations could not be set up.',
      [DesktopErrorType.IPC_CHANNEL_ERROR]: 'Communication with the desktop system failed.',
      [DesktopErrorType.IPC_TIMEOUT_ERROR]: 'The operation timed out. Please try again.',
      [DesktopErrorType.IPC_VALIDATION_ERROR]: 'Invalid data was provided to the system.',
      [DesktopErrorType.IPC_SECURITY_ERROR]: 'A security violation was detected.',
      [DesktopErrorType.FILE_READ_ERROR]: 'The file could not be read.',
      [DesktopErrorType.FILE_WRITE_ERROR]: 'The file could not be saved.',
      [DesktopErrorType.FILE_PERMISSION_ERROR]: 'Permission denied. Please check file permissions.',
      [DesktopErrorType.FILE_NOT_FOUND_ERROR]: 'The requested file was not found.',
      [DesktopErrorType.DIRECTORY_ERROR]: 'Directory operation failed.',
      [DesktopErrorType.WINDOW_CREATION_ERROR]: 'The application window could not be created.',
      [DesktopErrorType.WINDOW_STATE_ERROR]: 'Window state could not be saved or restored.',
      [DesktopErrorType.FULLSCREEN_ERROR]: 'Fullscreen mode is not available.',
      [DesktopErrorType.UPDATE_CHECK_ERROR]: 'Could not check for updates.',
      [DesktopErrorType.UPDATE_DOWNLOAD_ERROR]: 'Update download failed.',
      [DesktopErrorType.UPDATE_INSTALL_ERROR]: 'Update installation failed.',
      [DesktopErrorType.UPDATE_SIGNATURE_ERROR]: 'Update signature verification failed.',
      [DesktopErrorType.MEMORY_ERROR]: 'The application is running low on memory.',
      [DesktopErrorType.CPU_ERROR]: 'High CPU usage detected.',
      [DesktopErrorType.STARTUP_ERROR]: 'The application failed to start properly.',
      [DesktopErrorType.RESOURCE_LEAK_ERROR]: 'Resource leak detected.',
      [DesktopErrorType.SECURITY_VIOLATION_ERROR]: 'A security violation was detected.',
      [DesktopErrorType.CONTEXT_ISOLATION_ERROR]: 'Security context isolation failed.',
      [DesktopErrorType.CSP_VIOLATION_ERROR]: 'Content security policy violation.',
      [DesktopErrorType.OFFLINE_ERROR]: 'Offline functionality is not available.',
      [DesktopErrorType.SYNC_ERROR]: 'Data synchronization failed.',
      [DesktopErrorType.CACHE_ERROR]: 'Cache operation failed.',
      [DesktopErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred.',
      [DesktopErrorType.INITIALIZATION_ERROR]: 'Application initialization failed.',
      [DesktopErrorType.CONFIGURATION_ERROR]: 'Configuration error detected.'
    };

    return messages[type] || 'An error occurred.';
  }

  // System info helper methods
  private getTotalMemory(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapTotal;
    }
    return 0;
  }

  private getFreeMemory(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapTotal - usage.heapUsed;
    }
    return 0;
  }

  private getCpuUsage(): number {
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const usage = process.cpuUsage();
      return (usage.user + usage.system) / 1000000; // Convert to milliseconds
    }
    return 0;
  }

  private getUptime(): number {
    if (typeof process !== 'undefined' && process.uptime) {
      return process.uptime() * 1000; // Convert to milliseconds
    }
    return 0;
  }

  private getStartupTime(): number {
    // This would need to be set during app initialization
    return 0;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  private async measureIpcLatency(): Promise<number> {
    const { desktopAPI } = useDesktopAPI();
    
    try {
      const start = performance.now();
      await desktopAPI.ping();
      const end = performance.now();
      return end - start;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const desktopErrorManager = DesktopErrorManager.getInstance();