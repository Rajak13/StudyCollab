# Desktop Error Handling System

This document describes the comprehensive error handling and recovery system implemented for the StudyCollab Electron desktop application.

## Overview

The desktop error handling system provides:

- **Centralized Error Management**: All errors are managed through a single error manager
- **User-Friendly Error Messages**: Technical errors are translated to actionable user messages
- **Automatic Recovery**: Many errors can be automatically recovered from
- **Graceful Degradation**: Features fail gracefully with fallback options
- **Crash Reporting**: Detailed crash reports for debugging and improvement
- **Performance Monitoring**: Detection and reporting of performance issues

## Architecture

### Core Components

1. **DesktopErrorManager** (`src/lib/desktop-error-manager.ts`)
   - Central error management and reporting
   - Recovery strategy execution
   - Diagnostic information generation

2. **Error Types** (`src/types/desktop-errors.ts`)
   - Comprehensive error type definitions
   - Recovery action specifications
   - Error severity levels

3. **Error Boundary** (`src/components/desktop/error-boundary.tsx`)
   - React error boundary for component-level error handling
   - Automatic retry mechanisms
   - Integration with error manager

4. **Error Display** (`src/components/desktop/error-display.tsx`)
   - User-friendly error presentation
   - Recovery action buttons
   - Technical details on demand

5. **Graceful Degradation** (`src/components/desktop/graceful-degradation.tsx`)
   - Feature availability monitoring
   - Fallback mode activation
   - Degraded feature indicators

6. **Crash Reporter** (`src/components/desktop/crash-reporter.tsx`)
   - Crash report generation and submission
   - User consent management
   - Privacy controls

## Usage

### Basic Setup

```typescript
import { initializeDesktopErrorHandling } from '@/lib/desktop-error-setup';
import { DesktopErrorProvider } from '@/components/desktop/desktop-error-provider';

// Initialize error handling early in your app
initializeDesktopErrorHandling();

// Wrap your app with the error provider
function App() {
  return (
    <DesktopErrorProvider
      enableCrashReporting={true}
      enableErrorNotifications={true}
      enableGracefulDegradation={true}
    >
      <YourAppContent />
    </DesktopErrorProvider>
  );
}
```

### Reporting Errors

```typescript
import { desktopErrorManager } from '@/lib/desktop-error-manager';
import { DesktopErrorType } from '@/types/desktop-errors';

// Report a simple error
const error = desktopErrorManager.reportError(
  DesktopErrorType.FILE_READ_ERROR,
  'Failed to read config.json',
  'Unable to load your settings. Using default settings instead.',
  { filePath: 'config.json', component: 'SettingsManager' }
);

// Report an exception
try {
  await riskyOperation();
} catch (error) {
  desktopErrorManager.reportException(
    error,
    DesktopErrorType.NETWORK_ERROR,
    'Failed to sync your data. Please check your internet connection.'
  );
}
```

### Using Error Boundaries

```typescript
import { DesktopErrorBoundary } from '@/components/desktop/error-boundary';

function MyComponent() {
  return (
    <DesktopErrorBoundary
      component="MyComponent"
      onError={(error, errorInfo) => {
        console.log('Component error:', error);
      }}
    >
      <RiskyChildComponent />
    </DesktopErrorBoundary>
  );
}
```

### Error Handling Hooks

```typescript
import { useDesktopErrorHandling } from '@/hooks/use-desktop-error-handling';

function MyComponent() {
  const { reportError, activeErrors, executeRecovery } = useDesktopErrorHandling();

  const handleFileOperation = async () => {
    try {
      await fileOperation();
    } catch (error) {
      const desktopError = reportError(
        DesktopErrorType.FILE_WRITE_ERROR,
        error.message,
        'Failed to save your file. Please try again.'
      );
      
      // Optionally execute recovery
      await executeRecovery(desktopError.id, DesktopErrorRecoveryAction.RETRY);
    }
  };

  return (
    <div>
      {activeErrors.length > 0 && (
        <div>Active errors: {activeErrors.length}</div>
      )}
      <button onClick={handleFileOperation}>Save File</button>
    </div>
  );
}
```

### Graceful Degradation

```typescript
import { useGracefulDegradation, FeatureGate } from '@/components/desktop/graceful-degradation';

function NotificationSettings() {
  const { checkFeatureAvailability } = useGracefulDegradation();
  
  return (
    <FeatureGate
      feature="notifications"
      fallback={<div>Notifications are not available on this system.</div>}
    >
      <NotificationPreferences />
    </FeatureGate>
  );
}
```

### Async Error Handling

```typescript
import { useAsyncErrorHandler } from '@/hooks/use-desktop-error-handling';

function DataLoader() {
  const { execute, isLoading, error, result } = useAsyncErrorHandler(
    async (id: string) => {
      const response = await fetch(`/api/data/${id}`);
      return response.json();
    },
    DesktopErrorType.NETWORK_ERROR,
    'Failed to load data. Please check your connection.'
  );

  return (
    <div>
      <button onClick={() => execute('123')}>Load Data</button>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.userMessage}</div>}
      {result && <div>Data: {JSON.stringify(result)}</div>}
    </div>
  );
}
```

## Error Types

### System Integration Errors
- `SYSTEM_TRAY_ERROR`: System tray functionality issues
- `NOTIFICATION_ERROR`: Desktop notification problems
- `SHORTCUT_ERROR`: Keyboard shortcut registration failures
- `FILE_ASSOCIATION_ERROR`: File association setup issues

### IPC Communication Errors
- `IPC_CHANNEL_ERROR`: Communication channel failures
- `IPC_TIMEOUT_ERROR`: Operation timeouts
- `IPC_VALIDATION_ERROR`: Invalid data validation
- `IPC_SECURITY_ERROR`: Security violations

### File System Errors
- `FILE_READ_ERROR`: File reading failures
- `FILE_WRITE_ERROR`: File writing failures
- `FILE_PERMISSION_ERROR`: Permission denied errors
- `FILE_NOT_FOUND_ERROR`: Missing file errors

### Performance Errors
- `MEMORY_ERROR`: High memory usage
- `CPU_ERROR`: High CPU usage
- `STARTUP_ERROR`: Application startup failures
- `RESOURCE_LEAK_ERROR`: Resource leak detection

## Recovery Actions

### Available Recovery Actions
- `RETRY`: Attempt the operation again
- `RESTART_APP`: Restart the entire application
- `RESTART_COMPONENT`: Restart the affected component
- `FALLBACK_MODE`: Continue with limited functionality
- `DISABLE_FEATURE`: Disable the problematic feature
- `USER_ACTION_REQUIRED`: Show instructions to the user
- `CONTACT_SUPPORT`: Direct user to support resources

### Implementing Custom Recovery

```typescript
import { desktopErrorManager } from '@/lib/desktop-error-manager';

// Get recovery strategies for an error
const strategies = desktopErrorManager.getRecoveryStrategies(errorId);

// Execute a specific recovery action
const success = await desktopErrorManager.executeRecovery(
  errorId, 
  DesktopErrorRecoveryAction.RETRY
);
```

## Crash Reporting

### Automatic Crash Reports

Critical errors automatically trigger crash report generation:

```typescript
// Critical errors show crash reporter automatically
desktopErrorManager.reportError(
  DesktopErrorType.STARTUP_ERROR,
  'Application failed to initialize',
  'The application encountered a critical error during startup.'
);
```

### Manual Crash Reports

```typescript
import { useCrashReporter } from '@/components/desktop/crash-reporter';

function ErrorReportButton() {
  const { showCrashReporter } = useCrashReporter();
  
  const handleReportError = () => {
    const error = desktopErrorManager.reportError(
      DesktopErrorType.UNKNOWN_ERROR,
      'User-reported issue',
      'User manually reported an issue'
    );
    
    showCrashReporter(error);
  };
  
  return <button onClick={handleReportError}>Report Issue</button>;
}
```

## Performance Monitoring

### Automatic Monitoring

```typescript
import { PerformanceMonitor } from '@/lib/desktop-error-setup';

// Start periodic performance monitoring
PerformanceMonitor.startPeriodicMonitoring(30000); // Every 30 seconds

// Monitor specific operations
const result = await PerformanceMonitor.monitorResponseTime(
  'data-sync',
  async () => {
    return await syncUserData();
  }
);
```

### Memory Usage Monitoring

```typescript
// Manual memory check
PerformanceMonitor.monitorMemoryUsage();

// Automatic monitoring is included in periodic monitoring
```

## Testing

### Unit Tests

```typescript
import { desktopErrorManager } from '@/lib/desktop-error-manager';
import { DesktopErrorType } from '@/types/desktop-errors';

describe('Error Handling', () => {
  it('should report errors correctly', () => {
    const error = desktopErrorManager.reportError(
      DesktopErrorType.FILE_READ_ERROR,
      'Test error',
      'Test user message'
    );
    
    expect(error.type).toBe(DesktopErrorType.FILE_READ_ERROR);
    expect(error.message).toBe('Test error');
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopErrorProvider } from '@/components/desktop/desktop-error-provider';

test('error boundary catches errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  render(
    <DesktopErrorProvider>
      <ThrowError />
    </DesktopErrorProvider>
  );
  
  expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
});
```

## Configuration

### Error Provider Options

```typescript
<DesktopErrorProvider
  enableCrashReporting={true}          // Enable crash reporter
  enableErrorNotifications={true}      // Show error notifications
  enableGracefulDegradation={true}     // Enable feature degradation
  maxVisibleErrors={3}                 // Max concurrent error notifications
  autoHideErrorDelay={10000}           // Auto-hide delay for low severity errors
>
```

### Error Manager Configuration

```typescript
// Configure error manager behavior
desktopErrorManager.onError((error) => {
  // Custom error handling logic
  console.log('Error reported:', error);
});

desktopErrorManager.onRecovery((errorId, success) => {
  // Custom recovery handling
  console.log('Recovery attempt:', errorId, success);
});
```

## Best Practices

### 1. Error Reporting
- Always provide user-friendly messages
- Include relevant context information
- Use appropriate error types
- Don't expose sensitive information

### 2. Recovery Strategies
- Implement automatic retry for transient errors
- Provide clear user instructions for manual recovery
- Use graceful degradation when possible
- Avoid infinite retry loops

### 3. Performance
- Monitor memory usage regularly
- Set reasonable timeouts for operations
- Use performance monitoring for critical paths
- Clean up resources properly

### 4. User Experience
- Show progress indicators for recovery actions
- Provide clear feedback on error resolution
- Allow users to dismiss non-critical errors
- Offer help and support options

### 5. Testing
- Test error scenarios regularly
- Verify recovery mechanisms work
- Test graceful degradation paths
- Monitor error rates in production

## Troubleshooting

### Common Issues

1. **Errors not being caught**
   - Ensure error boundaries are properly placed
   - Check that error handling is initialized
   - Verify error types are correct

2. **Recovery actions not working**
   - Check recovery strategy implementation
   - Verify error is marked as recoverable
   - Ensure proper error context

3. **Performance issues**
   - Monitor memory usage patterns
   - Check for resource leaks
   - Optimize error handling overhead

### Debug Mode

Enable debug logging:

```typescript
// Enable verbose logging
desktopErrorManager.log('Debug mode enabled');

// Check active errors
console.log('Active errors:', desktopErrorManager.getActiveErrors());

// Generate diagnostic info
const diagnostics = await desktopErrorManager.generateDiagnosticInfo();
console.log('Diagnostics:', diagnostics);
```

## Contributing

When adding new error handling:

1. Define appropriate error types
2. Implement recovery strategies
3. Add user-friendly messages
4. Include comprehensive tests
5. Update documentation

For more information, see the implementation files in:
- `src/lib/desktop-error-manager.ts`
- `src/types/desktop-errors.ts`
- `src/components/desktop/`
- `src/hooks/use-desktop-error-handling.ts`