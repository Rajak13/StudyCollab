// Desktop-specific error types and interfaces for StudyCollab Electron App

export enum DesktopErrorType {
  // System Integration Errors
  SYSTEM_TRAY_ERROR = 'SYSTEM_TRAY_ERROR',
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',
  SHORTCUT_ERROR = 'SHORTCUT_ERROR',
  FILE_ASSOCIATION_ERROR = 'FILE_ASSOCIATION_ERROR',
  
  // IPC Communication Errors
  IPC_CHANNEL_ERROR = 'IPC_CHANNEL_ERROR',
  IPC_TIMEOUT_ERROR = 'IPC_TIMEOUT_ERROR',
  IPC_VALIDATION_ERROR = 'IPC_VALIDATION_ERROR',
  IPC_SECURITY_ERROR = 'IPC_SECURITY_ERROR',
  
  // File System Errors
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  FILE_PERMISSION_ERROR = 'FILE_PERMISSION_ERROR',
  FILE_NOT_FOUND_ERROR = 'FILE_NOT_FOUND_ERROR',
  DIRECTORY_ERROR = 'DIRECTORY_ERROR',
  
  // Window Management Errors
  WINDOW_CREATION_ERROR = 'WINDOW_CREATION_ERROR',
  WINDOW_STATE_ERROR = 'WINDOW_STATE_ERROR',
  FULLSCREEN_ERROR = 'FULLSCREEN_ERROR',
  
  // Update Errors
  UPDATE_CHECK_ERROR = 'UPDATE_CHECK_ERROR',
  UPDATE_DOWNLOAD_ERROR = 'UPDATE_DOWNLOAD_ERROR',
  UPDATE_INSTALL_ERROR = 'UPDATE_INSTALL_ERROR',
  UPDATE_SIGNATURE_ERROR = 'UPDATE_SIGNATURE_ERROR',
  
  // Performance Errors
  MEMORY_ERROR = 'MEMORY_ERROR',
  CPU_ERROR = 'CPU_ERROR',
  STARTUP_ERROR = 'STARTUP_ERROR',
  RESOURCE_LEAK_ERROR = 'RESOURCE_LEAK_ERROR',
  
  // Security Errors
  SECURITY_VIOLATION_ERROR = 'SECURITY_VIOLATION_ERROR',
  CONTEXT_ISOLATION_ERROR = 'CONTEXT_ISOLATION_ERROR',
  CSP_VIOLATION_ERROR = 'CSP_VIOLATION_ERROR',
  
  // Network and Sync Errors
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  
  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export enum DesktopErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum DesktopErrorRecoveryAction {
  RETRY = 'RETRY',
  RESTART_APP = 'RESTART_APP',
  RESTART_COMPONENT = 'RESTART_COMPONENT',
  FALLBACK_MODE = 'FALLBACK_MODE',
  DISABLE_FEATURE = 'DISABLE_FEATURE',
  USER_ACTION_REQUIRED = 'USER_ACTION_REQUIRED',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  NO_ACTION = 'NO_ACTION'
}

export interface DesktopError {
  id: string;
  type: DesktopErrorType;
  severity: DesktopErrorSeverity;
  message: string;
  userMessage: string;
  technicalDetails?: string;
  timestamp: number;
  component?: string;
  operation?: string;
  originalError?: Error;
  context?: Record<string, any>;
  recoveryActions: DesktopErrorRecoveryAction[];
  isRecoverable: boolean;
  hasBeenReported: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorRecoveryStrategy {
  action: DesktopErrorRecoveryAction;
  label: string;
  description: string;
  isDestructive: boolean;
  requiresConfirmation: boolean;
  execute: () => Promise<boolean>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: DesktopError | null;
  errorId: string | null;
  fallbackComponent?: React.ComponentType<any>;
  retryAttempts: number;
  maxRetryAttempts: number;
}

export interface CrashReport {
  id: string;
  timestamp: number;
  appVersion: string;
  platform: string;
  arch: string;
  error: DesktopError;
  systemInfo: {
    totalMemory: number;
    freeMemory: number;
    cpuUsage: number;
    uptime: number;
  };
  userActions: string[];
  logs: string[];
  stackTrace?: string;
  userConsent: boolean;
}

export interface DiagnosticInfo {
  timestamp: number;
  appInfo: {
    name: string;
    version: string;
    platform: string;
    arch: string;
    isDev: boolean;
  };
  systemInfo: {
    totalMemory: number;
    freeMemory: number;
    cpuUsage: number;
    uptime: number;
    nodeVersion: string;
    electronVersion: string;
  };
  windowInfo: {
    bounds: Electron.Rectangle | null;
    isMaximized: boolean;
    isMinimized: boolean;
    isFullScreen: boolean;
    isFocused: boolean;
  };
  featureStatus: {
    systemTray: boolean;
    notifications: boolean;
    autoUpdates: boolean;
    offlineMode: boolean;
  };
  recentErrors: DesktopError[];
  performanceMetrics: {
    startupTime: number;
    memoryUsage: number;
    ipcLatency: number;
  };
}

// Error factory functions
export function createDesktopError(
  type: DesktopErrorType,
  message: string,
  userMessage: string,
  options: Partial<DesktopError> = {}
): DesktopError {
  const severity = getSeverityForErrorType(type);
  const recoveryActions = getRecoveryActionsForErrorType(type);
  
  return {
    id: `desktop_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    message,
    userMessage,
    timestamp: Date.now(),
    recoveryActions,
    isRecoverable: recoveryActions.length > 0,
    hasBeenReported: false,
    retryCount: 0,
    maxRetries: getMaxRetriesForErrorType(type),
    ...options
  };
}

function getSeverityForErrorType(type: DesktopErrorType): DesktopErrorSeverity {
  const severityMap: Record<DesktopErrorType, DesktopErrorSeverity> = {
    [DesktopErrorType.SYSTEM_TRAY_ERROR]: DesktopErrorSeverity.LOW,
    [DesktopErrorType.NOTIFICATION_ERROR]: DesktopErrorSeverity.LOW,
    [DesktopErrorType.SHORTCUT_ERROR]: DesktopErrorSeverity.LOW,
    [DesktopErrorType.FILE_ASSOCIATION_ERROR]: DesktopErrorSeverity.MEDIUM,
    
    [DesktopErrorType.IPC_CHANNEL_ERROR]: DesktopErrorSeverity.HIGH,
    [DesktopErrorType.IPC_TIMEOUT_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.IPC_VALIDATION_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.IPC_SECURITY_ERROR]: DesktopErrorSeverity.CRITICAL,
    
    [DesktopErrorType.FILE_READ_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.FILE_WRITE_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.FILE_PERMISSION_ERROR]: DesktopErrorSeverity.HIGH,
    [DesktopErrorType.FILE_NOT_FOUND_ERROR]: DesktopErrorSeverity.LOW,
    [DesktopErrorType.DIRECTORY_ERROR]: DesktopErrorSeverity.MEDIUM,
    
    [DesktopErrorType.WINDOW_CREATION_ERROR]: DesktopErrorSeverity.CRITICAL,
    [DesktopErrorType.WINDOW_STATE_ERROR]: DesktopErrorSeverity.LOW,
    [DesktopErrorType.FULLSCREEN_ERROR]: DesktopErrorSeverity.LOW,
    
    [DesktopErrorType.UPDATE_CHECK_ERROR]: DesktopErrorSeverity.LOW,
    [DesktopErrorType.UPDATE_DOWNLOAD_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.UPDATE_INSTALL_ERROR]: DesktopErrorSeverity.HIGH,
    [DesktopErrorType.UPDATE_SIGNATURE_ERROR]: DesktopErrorSeverity.CRITICAL,
    
    [DesktopErrorType.MEMORY_ERROR]: DesktopErrorSeverity.HIGH,
    [DesktopErrorType.CPU_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.STARTUP_ERROR]: DesktopErrorSeverity.CRITICAL,
    [DesktopErrorType.RESOURCE_LEAK_ERROR]: DesktopErrorSeverity.HIGH,
    
    [DesktopErrorType.SECURITY_VIOLATION_ERROR]: DesktopErrorSeverity.CRITICAL,
    [DesktopErrorType.CONTEXT_ISOLATION_ERROR]: DesktopErrorSeverity.CRITICAL,
    [DesktopErrorType.CSP_VIOLATION_ERROR]: DesktopErrorSeverity.HIGH,
    
    [DesktopErrorType.OFFLINE_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.SYNC_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.CACHE_ERROR]: DesktopErrorSeverity.LOW,
    
    [DesktopErrorType.UNKNOWN_ERROR]: DesktopErrorSeverity.MEDIUM,
    [DesktopErrorType.INITIALIZATION_ERROR]: DesktopErrorSeverity.CRITICAL,
    [DesktopErrorType.CONFIGURATION_ERROR]: DesktopErrorSeverity.HIGH
  };
  
  return severityMap[type] || DesktopErrorSeverity.MEDIUM;
}

function getRecoveryActionsForErrorType(type: DesktopErrorType): DesktopErrorRecoveryAction[] {
  const actionMap: Record<DesktopErrorType, DesktopErrorRecoveryAction[]> = {
    [DesktopErrorType.SYSTEM_TRAY_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.DISABLE_FEATURE],
    [DesktopErrorType.NOTIFICATION_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.DISABLE_FEATURE],
    [DesktopErrorType.SHORTCUT_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.DISABLE_FEATURE],
    [DesktopErrorType.FILE_ASSOCIATION_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    
    [DesktopErrorType.IPC_CHANNEL_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.RESTART_COMPONENT],
    [DesktopErrorType.IPC_TIMEOUT_ERROR]: [DesktopErrorRecoveryAction.RETRY],
    [DesktopErrorType.IPC_VALIDATION_ERROR]: [DesktopErrorRecoveryAction.RETRY],
    [DesktopErrorType.IPC_SECURITY_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP],
    
    [DesktopErrorType.FILE_READ_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    [DesktopErrorType.FILE_WRITE_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    [DesktopErrorType.FILE_PERMISSION_ERROR]: [DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    [DesktopErrorType.FILE_NOT_FOUND_ERROR]: [DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    [DesktopErrorType.DIRECTORY_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    
    [DesktopErrorType.WINDOW_CREATION_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP],
    [DesktopErrorType.WINDOW_STATE_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.FALLBACK_MODE],
    [DesktopErrorType.FULLSCREEN_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.FALLBACK_MODE],
    
    [DesktopErrorType.UPDATE_CHECK_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.DISABLE_FEATURE],
    [DesktopErrorType.UPDATE_DOWNLOAD_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    [DesktopErrorType.UPDATE_INSTALL_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.USER_ACTION_REQUIRED],
    [DesktopErrorType.UPDATE_SIGNATURE_ERROR]: [DesktopErrorRecoveryAction.CONTACT_SUPPORT],
    
    [DesktopErrorType.MEMORY_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP, DesktopErrorRecoveryAction.FALLBACK_MODE],
    [DesktopErrorType.CPU_ERROR]: [DesktopErrorRecoveryAction.FALLBACK_MODE],
    [DesktopErrorType.STARTUP_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP, DesktopErrorRecoveryAction.CONTACT_SUPPORT],
    [DesktopErrorType.RESOURCE_LEAK_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP],
    
    [DesktopErrorType.SECURITY_VIOLATION_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP],
    [DesktopErrorType.CONTEXT_ISOLATION_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP],
    [DesktopErrorType.CSP_VIOLATION_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP],
    
    [DesktopErrorType.OFFLINE_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.FALLBACK_MODE],
    [DesktopErrorType.SYNC_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.FALLBACK_MODE],
    [DesktopErrorType.CACHE_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.FALLBACK_MODE],
    
    [DesktopErrorType.UNKNOWN_ERROR]: [DesktopErrorRecoveryAction.RETRY, DesktopErrorRecoveryAction.RESTART_APP],
    [DesktopErrorType.INITIALIZATION_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP, DesktopErrorRecoveryAction.CONTACT_SUPPORT],
    [DesktopErrorType.CONFIGURATION_ERROR]: [DesktopErrorRecoveryAction.RESTART_APP, DesktopErrorRecoveryAction.USER_ACTION_REQUIRED]
  };
  
  return actionMap[type] || [DesktopErrorRecoveryAction.RETRY];
}

function getMaxRetriesForErrorType(type: DesktopErrorType): number {
  const retryMap: Record<DesktopErrorType, number> = {
    [DesktopErrorType.SYSTEM_TRAY_ERROR]: 3,
    [DesktopErrorType.NOTIFICATION_ERROR]: 3,
    [DesktopErrorType.SHORTCUT_ERROR]: 2,
    [DesktopErrorType.FILE_ASSOCIATION_ERROR]: 2,
    
    [DesktopErrorType.IPC_CHANNEL_ERROR]: 5,
    [DesktopErrorType.IPC_TIMEOUT_ERROR]: 3,
    [DesktopErrorType.IPC_VALIDATION_ERROR]: 2,
    [DesktopErrorType.IPC_SECURITY_ERROR]: 0,
    
    [DesktopErrorType.FILE_READ_ERROR]: 3,
    [DesktopErrorType.FILE_WRITE_ERROR]: 3,
    [DesktopErrorType.FILE_PERMISSION_ERROR]: 1,
    [DesktopErrorType.FILE_NOT_FOUND_ERROR]: 1,
    [DesktopErrorType.DIRECTORY_ERROR]: 2,
    
    [DesktopErrorType.WINDOW_CREATION_ERROR]: 1,
    [DesktopErrorType.WINDOW_STATE_ERROR]: 3,
    [DesktopErrorType.FULLSCREEN_ERROR]: 2,
    
    [DesktopErrorType.UPDATE_CHECK_ERROR]: 3,
    [DesktopErrorType.UPDATE_DOWNLOAD_ERROR]: 2,
    [DesktopErrorType.UPDATE_INSTALL_ERROR]: 1,
    [DesktopErrorType.UPDATE_SIGNATURE_ERROR]: 0,
    
    [DesktopErrorType.MEMORY_ERROR]: 1,
    [DesktopErrorType.CPU_ERROR]: 2,
    [DesktopErrorType.STARTUP_ERROR]: 1,
    [DesktopErrorType.RESOURCE_LEAK_ERROR]: 1,
    
    [DesktopErrorType.SECURITY_VIOLATION_ERROR]: 0,
    [DesktopErrorType.CONTEXT_ISOLATION_ERROR]: 0,
    [DesktopErrorType.CSP_VIOLATION_ERROR]: 1,
    
    [DesktopErrorType.OFFLINE_ERROR]: 5,
    [DesktopErrorType.SYNC_ERROR]: 3,
    [DesktopErrorType.CACHE_ERROR]: 3,
    
    [DesktopErrorType.UNKNOWN_ERROR]: 2,
    [DesktopErrorType.INITIALIZATION_ERROR]: 1,
    [DesktopErrorType.CONFIGURATION_ERROR]: 2
  };
  
  return retryMap[type] || 2;
}