# StudyCollab Electron Desktop Application

This directory contains the enhanced Electron desktop application implementation for StudyCollab, featuring comprehensive security, system integration, and desktop-specific functionality.

## Architecture Overview

The application follows a secure multi-process architecture:

### Main Process (`main.ts`)
- **Application Lifecycle Management**: Window creation, app events, and state persistence
- **Security Manager Integration**: Centralized security configuration and validation
- **System Integration**: Native notifications, system tray, file dialogs, and deep linking
- **Window State Persistence**: Automatic saving/restoring of window size, position, and state
- **IPC Security**: Validated and sanitized inter-process communication

### Renderer Process
- Runs the Next.js application with full feature parity to the web version
- Secure communication with main process through preload scripts
- Enhanced with desktop-specific UI adaptations

### Preload Scripts (`preload.ts`)
- **Secure IPC Bridge**: Type-safe communication between main and renderer processes
- **Input Validation**: Client-side validation and sanitization
- **Error Handling**: Comprehensive error handling with fallbacks
- **Desktop API**: Exposed desktop functionality for renderer process

## Security Implementation

### Core Security Features (`security.ts`)
- **Content Security Policy (CSP)**: Environment-specific CSP configuration
- **Context Isolation**: Complete separation between main and renderer contexts
- **Input Validation**: Comprehensive validation of all IPC messages
- **Permission Management**: Granular control over system permissions
- **External Resource Blocking**: Production-mode blocking of unauthorized external resources

### Security Measures
- Node integration disabled in renderer process
- Sandbox mode ready (currently disabled for preload script compatibility)
- Secure credential storage using OS-level encryption
- Update signature verification
- Protection against XSS and code injection attacks

## Key Features Implemented

### Window Management
- **State Persistence**: Automatic saving/restoring of window bounds, maximized, and fullscreen states
- **Multi-monitor Support**: Proper handling of window positioning across multiple displays
- **Responsive Sizing**: Minimum/maximum size constraints with validation
- **Platform-specific Behavior**: Native window controls and behavior per OS

### System Integration
- **Native Notifications**: Cross-platform desktop notifications with action support
- **System Tray**: Minimize to tray functionality with context menu
- **File Dialogs**: Native file open/save dialogs with security validation
- **Deep Link Handling**: Support for `studycollab://` protocol links
- **Global Shortcuts**: Configurable keyboard shortcuts for common actions

### Enhanced IPC Communication
- **Type-safe APIs**: Full TypeScript support with comprehensive interfaces
- **Error Handling**: Structured error responses with fallback mechanisms
- **Input Sanitization**: Automatic sanitization of string inputs
- **Bounds Validation**: Validation of window bounds and dimensions
- **Response Standardization**: Consistent response format across all IPC calls

## File Structure

```
electron/
├── main.ts           # Main process with enhanced security and features
├── preload.ts        # Secure IPC bridge with validation
├── security.ts       # Centralized security management
├── types.ts          # TypeScript type definitions
├── test-main.ts      # Development test entry point
├── test-security.ts  # Security functionality tests
├── tsconfig.json     # TypeScript configuration
└── README.md         # This documentation
```

## Development Commands

```bash
# Compile TypeScript
npm run electron:compile

# Run in development mode (with Next.js)
npm run electron:dev

# Test main process functionality
npm run electron:test

# Build for production
npm run electron:build

# Create distribution packages
npm run dist              # All platforms
npm run dist:win         # Windows only
npm run dist:mac         # macOS only
npm run dist:linux       # Linux only
```

## Security Configuration

### Content Security Policy
- **Development**: Allows localhost connections and unsafe-inline for hot reloading
- **Production**: Strict CSP with only necessary permissions for Supabase integration

### IPC Message Validation
- Automatic validation of all incoming IPC messages
- Protection against prototype pollution attacks
- Circular reference detection
- Input sanitization for string data

### Permission Management
- Notifications: Enabled for desktop integration
- Media access: Disabled by default
- Geolocation: Disabled for privacy
- File system: Controlled through secure dialogs only

## Error Handling

### Comprehensive Error Management
- **IPC Errors**: Structured error responses with fallback values
- **Security Errors**: Detailed logging with security context
- **Window Errors**: Graceful degradation with state recovery
- **Update Errors**: Fallback mechanisms with user notification

### Error Types
- `ElectronError`: Base error class with operation context
- `IPCError`: IPC communication failures
- `SecurityError`: Security validation failures

## Desktop API Usage

### In React Components

```typescript
// Check if running in Electron
if (window.desktopAPI?.isElectron()) {
  // Desktop-specific functionality
  
  // Show notification
  const result = await window.desktopAPI.showNotification('Title', 'Message');
  
  // File operations
  const saveResult = await window.desktopAPI.showSaveDialog({
    defaultPath: 'document.txt',
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });
  
  // Window management
  await window.desktopAPI.toggleFullscreen();
  const bounds = await window.desktopAPI.getWindowBounds();
  
  // App lifecycle
  const version = await window.desktopAPI.getAppVersion();
}
```

### Available APIs

```typescript
interface DesktopAPI {
  // System Integration
  showNotification(title: string, body: string): Promise<IPCResponse<boolean>>;
  minimizeToTray(): Promise<IPCResponse<boolean>>;
  showWindow(): Promise<IPCResponse<boolean>>;
  
  // File Operations
  showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue>;
  showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>;
  
  // Window Management
  toggleFullscreen(): Promise<IPCResponse<{ isFullScreen: boolean }>>;
  getWindowBounds(): Promise<IPCResponse<Rectangle | null>>;
  setWindowBounds(bounds: Rectangle): Promise<IPCResponse<boolean>>;
  getWindowState(): Promise<IPCResponse<WindowState>>;
  
  // App Lifecycle
  getAppVersion(): Promise<IPCResponse<string>>;
  restartApp(): Promise<IPCResponse<boolean>>;
  quitApp(): Promise<IPCResponse<boolean>>;
  
  // Event Listeners
  onMenuAction(callback: (action: string, data?: any) => void): void;
  onDeepLink(callback: (linkData: any) => void): void;
  removeAllListeners(): void;
  
  // Utility
  isElectron(): boolean;
}
```

## Testing

### Security Testing
The `test-security.ts` file provides comprehensive testing of:
- Input validation functionality
- String sanitization effectiveness
- Bounds validation accuracy
- IPC message security

### Manual Testing Checklist
- [ ] Window resize, minimize, maximize, and fullscreen
- [ ] System notifications display correctly
- [ ] File dialogs open and return proper values
- [ ] Deep links navigate correctly
- [ ] CSP prevents unauthorized resource loading
- [ ] IPC validation blocks malicious input
- [ ] Window state persists across app restarts

## Production Deployment

### Build Configuration
- **Code Signing**: Configured for Windows and macOS
- **Auto-updater**: Electron-updater integration with signature verification
- **Installer Options**: Platform-specific installer configurations
- **Asset Optimization**: Proper asset bundling and compression

### Security Hardening
- **Update Verification**: Cryptographic signature validation
- **Secure Storage**: OS-level credential encryption
- **Network Security**: HTTPS-only connections with certificate validation
- **Process Isolation**: Complete separation of main and renderer processes

## Troubleshooting

### Common Issues

1. **Compilation Errors**: Run `npm run electron:compile` to check TypeScript errors
2. **IPC Not Working**: Verify preload script is loaded and context isolation is enabled
3. **Security Errors**: Check CSP configuration and external resource access
4. **Window State Issues**: Clear `window-state.json` in user data directory

### Debug Mode

```bash
# Enable Electron debug logging
DEBUG=electron* npm run electron:dev

# Enable security debug logging
DEBUG=security* npm run electron:dev
```

### Logs Location

- **Windows**: `%APPDATA%/StudyCollab/logs/`
- **macOS**: `~/Library/Logs/StudyCollab/`
- **Linux**: `~/.config/StudyCollab/logs/`

## Requirements Compliance

This implementation satisfies the following task requirements:

✅ **Main Process Entry Point**: Complete application lifecycle management with enhanced security  
✅ **Secure BrowserWindow Configuration**: Comprehensive security settings with CSP and context isolation  
✅ **Context Isolation**: Full implementation with secure preload script integration  
✅ **Content Security Policy**: Environment-specific CSP configuration with security headers  
✅ **Security Best Practices**: Input validation, error handling, and secure IPC communication  

## Next Steps

After this implementation, the following tasks can be executed:
- Task 4: Create secure IPC communication layer (enhanced beyond requirements)
- Task 5: Develop desktop-specific system integration features
- Task 6: Build interactive desktop landing page component

The foundation is now in place for all subsequent desktop application features.

## Resources

- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
- [Electron Builder Documentation](https://www.electron.build/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [TypeScript with Electron](https://www.electronjs.org/docs/tutorial/typescript)