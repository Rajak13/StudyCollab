// Desktop Error Handling Setup and Integration

import type { DesktopError } from '@/types/desktop-errors';
import { DesktopErrorSeverity, DesktopErrorType } from '@/types/desktop-errors';
import { desktopErrorManager } from './desktop-error-manager';

/**
 * Initialize desktop error handling system
 * Call this early in your application startup
 */
export function initializeDesktopErrorHandling() {
  // Set up global error handlers for the renderer process
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      desktopErrorManager.reportException(
        new Error(event.reason),
        DesktopErrorType.UNKNOWN_ERROR,
        'An unexpected error occurred. The application will continue running.',
        { 
          type: 'unhandledrejection', 
          reason: event.reason,
          promise: 'Promise object (not serializable)'
        }
      );
      
      // Prevent the default browser behavior
      event.preventDefault();
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      desktopErrorManager.reportException(
        event.error || new Error(event.message),
        DesktopErrorType.UNKNOWN_ERROR,
        'An unexpected error occurred. The application will continue running.',
        {
          type: 'error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          message: event.message
        }
      );
    });

    // Handle network errors
    window.addEventListener('offline', () => {
      desktopErrorManager.reportError(
        DesktopErrorType.OFFLINE_ERROR,
        'Network connection lost',
        'You are now offline. Some features may not work properly.',
        { networkStatus: 'offline' }
      );
    });

    window.addEventListener('online', () => {
      desktopErrorManager.log('Network connection restored');
      // Clear offline errors when back online
      const offlineErrors = desktopErrorManager.getActiveErrors()
        .filter(error => error.type === DesktopErrorType.OFFLINE_ERROR);
      
      offlineErrors.forEach(error => {
        desktopErrorManager.clearError(error.id);
      });
    });

    // Report to main process if in Electron
    if (window.desktopAPI) {
      // Set up error reporting to main process
      desktopErrorManager.onError(async (error) => {
        try {
          if (window.electronAPI) {
            await window.electronAPI.invoke('error-handler:report-renderer-error', {
              type: error.type,
              message: error.message,
              stack: error.originalError?.stack,
              context: error.context
            });
          }
        } catch (reportError) {
          console.error('Failed to report error to main process:', reportError);
        }
      });
    }
  }

  // Log initialization
  desktopErrorManager.log('Desktop error handling system initialized');
  desktopErrorManager.recordUserAction('Error handling system started');
}

/**
 * Create error handling wrapper for async functions
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorType: DesktopErrorType = DesktopErrorType.UNKNOWN_ERROR,
  userMessage: string = 'An error occurred while performing this operation.'
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      desktopErrorManager.reportException(
        error instanceof Error ? error : new Error(String(error)),
        errorType,
        userMessage,
        { 
          functionName: fn.name,
          arguments: args.map((arg, index) => ({ index, type: typeof arg }))
        }
      );
      return null;
    }
  };
}

/**
 * Create error handling wrapper for synchronous functions
 */
export function withSyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => R,
  errorType: DesktopErrorType = DesktopErrorType.UNKNOWN_ERROR,
  userMessage: string = 'An error occurred while performing this operation.'
) {
  return (...args: T): R | null => {
    try {
      return fn(...args);
    } catch (error) {
      desktopErrorManager.reportException(
        error instanceof Error ? error : new Error(String(error)),
        errorType,
        userMessage,
        { 
          functionName: fn.name,
          arguments: args.map((arg, index) => ({ index, type: typeof arg }))
        }
      );
      return null;
    }
  };
}

/**
 * Decorator for class methods to add error handling
 */
export function errorHandler(
  errorType: DesktopErrorType = DesktopErrorType.UNKNOWN_ERROR,
  userMessage?: string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const message = userMessage || `Error in ${target.constructor.name}.${propertyKey}`;
        
        desktopErrorManager.reportException(
          error instanceof Error ? error : new Error(String(error)),
          errorType,
          message,
          {
            className: target.constructor.name,
            methodName: propertyKey,
            arguments: args.map((arg, index) => ({ index, type: typeof arg }))
          }
        );
        
        throw error; // Re-throw to maintain original behavior
      }
    };
    
    return descriptor;
  };
}

/**
 * Utility functions for common error scenarios
 */
export const ErrorHandlingUtils = {
  /**
   * Handle file operation errors
   */
  handleFileError: (error: Error, operation: string, filePath?: string) => {
    let errorType = DesktopErrorType.FILE_READ_ERROR;
    
    if (operation.includes('write') || operation.includes('save')) {
      errorType = DesktopErrorType.FILE_WRITE_ERROR;
    } else if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      errorType = DesktopErrorType.FILE_NOT_FOUND_ERROR;
    } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
      errorType = DesktopErrorType.FILE_PERMISSION_ERROR;
    }
    
    return desktopErrorManager.reportException(
      error,
      errorType,
      `Failed to ${operation}${filePath ? ` file: ${filePath}` : ''}`,
      { operation, filePath }
    );
  },

  /**
   * Handle network/IPC errors
   */
  handleNetworkError: (error: Error, operation: string) => {
    let errorType = DesktopErrorType.IPC_CHANNEL_ERROR;
    
    if (error.message.includes('timeout')) {
      errorType = DesktopErrorType.IPC_TIMEOUT_ERROR;
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      errorType = DesktopErrorType.IPC_VALIDATION_ERROR;
    }
    
    return desktopErrorManager.reportException(
      error,
      errorType,
      `Network operation failed: ${operation}`,
      { operation, networkError: true }
    );
  },

  /**
   * Handle system integration errors
   */
  handleSystemError: (error: Error, feature: string) => {
    let errorType = DesktopErrorType.SYSTEM_TRAY_ERROR;
    
    if (feature.includes('notification')) {
      errorType = DesktopErrorType.NOTIFICATION_ERROR;
    } else if (feature.includes('shortcut')) {
      errorType = DesktopErrorType.SHORTCUT_ERROR;
    } else if (feature.includes('file association')) {
      errorType = DesktopErrorType.FILE_ASSOCIATION_ERROR;
    }
    
    return desktopErrorManager.reportException(
      error,
      errorType,
      `System feature '${feature}' is not working properly`,
      { feature, systemIntegration: true }
    );
  },

  /**
   * Handle update errors
   */
  handleUpdateError: (error: Error, phase: string) => {
    let errorType = DesktopErrorType.UPDATE_CHECK_ERROR;
    
    if (phase.includes('download')) {
      errorType = DesktopErrorType.UPDATE_DOWNLOAD_ERROR;
    } else if (phase.includes('install')) {
      errorType = DesktopErrorType.UPDATE_INSTALL_ERROR;
    } else if (phase.includes('signature') || phase.includes('verify')) {
      errorType = DesktopErrorType.UPDATE_SIGNATURE_ERROR;
    }
    
    return desktopErrorManager.reportException(
      error,
      errorType,
      `Update ${phase} failed`,
      { phase, updateError: true }
    );
  }
};

/**
 * Performance monitoring with error reporting
 */
export class PerformanceMonitor {
  private static thresholds = {
    memoryUsage: 100 * 1024 * 1024, // 100MB
    cpuUsage: 80, // 80%
    responseTime: 5000 // 5 seconds
  };

  static monitorMemoryUsage() {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      
      if (memory.usedJSHeapSize > this.thresholds.memoryUsage) {
        desktopErrorManager.reportError(
          DesktopErrorType.MEMORY_ERROR,
          `High memory usage detected: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          'The application is using a lot of memory and may become slow.',
          {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        );
      }
    }
  }

  static monitorResponseTime<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      
      try {
        const result = await fn();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > this.thresholds.responseTime) {
          desktopErrorManager.reportError(
            DesktopErrorType.UNKNOWN_ERROR,
            `Slow operation detected: ${operation} took ${Math.round(duration)}ms`,
            `The operation '${operation}' is taking longer than expected.`,
            { operation, duration, threshold: this.thresholds.responseTime }
          );
        }
        
        resolve(result);
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        desktopErrorManager.reportException(
          error instanceof Error ? error : new Error(String(error)),
          DesktopErrorType.UNKNOWN_ERROR,
          `Operation '${operation}' failed after ${Math.round(duration)}ms`,
          { operation, duration, failed: true }
        );
        
        reject(error);
      }
    });
  }

  static startPeriodicMonitoring(interval: number = 30000) {
    setInterval(() => {
      this.monitorMemoryUsage();
    }, interval);
  }
}

/**
 * Export everything for easy access
 */
export {
    desktopErrorManager, DesktopErrorSeverity, DesktopErrorType
};

    export type { DesktopError };
