# StudyCollab Desktop Application Setup

This document describes the desktop application foundation that has been implemented for StudyCollab.

## Overview

The desktop application is built using Electron and provides the same functionality as the web version with additional native features like:

- System tray integration
- Global keyboard shortcuts
- Offline data synchronization
- Native file operations
- Auto-updates
- System notifications

## Architecture

### Main Process (`electron/main.ts`)
The main process manages the application lifecycle and coordinates between different managers:

- **WindowManager**: Handles window creation, state management, and positioning
- **SystemTrayManager**: Manages system tray icon and context menu
- **IPCManager**: Handles communication between main and renderer processes
- **AutoUpdaterManager**: Manages automatic application updates
- **OfflineDataManager**: Handles offline data storage and synchronization

### Renderer Process Integration
The renderer process uses the existing Next.js application with additional Electron-specific features:

- **Preload Script** (`electron/preload/preload.ts`): Safely exposes Electron APIs to the renderer
- **React Hooks** (`src/hooks/use-electron.ts`): Provides React hooks for Electron functionality
- **UI Components**: Electron-specific components for window controls, sync status, and updates

## Available Scripts

### Development
```bash
# Start the web app and Electron in development mode
npm run electron:dev

# Compile Electron TypeScript files
npm run electron:compile

# Run Electron with compiled files
npm run electron
```

### Building and Distribution
```bash
# Build the complete application (Next.js + Electron)
npm run electron:build

# Package the application (creates unpacked directory)
npm run electron:pack

# Create distributable packages for all platforms
npm run electron:dist

# Create distributable packages for specific platforms
npm run electron:dist:win    # Windows
npm run electron:dist:mac    # macOS
npm run electron:dist:linux  # Linux
```

## Features Implemented

### 1. Window Management
- Persistent window state (size, position, maximized state)
- Multi-display support
- Custom title bar on macOS
- Window controls integration

### 2. System Tray Integration
- System tray icon with context menu
- Quick access to common actions
- Show/hide application functionality
- Platform-specific behavior

### 3. IPC Communication
- Secure communication between main and renderer processes
- File operations (open, save, read, write)
- System integration (show in folder, open external links)
- Settings management

### 4. Offline Data Management
- Local data storage using electron-store
- Sync queue for offline changes
- Conflict resolution
- Network status detection
- Automatic synchronization when online

### 5. Auto-Updates
- Automatic update checking
- User-friendly update notifications
- Download progress tracking
- Safe update installation

### 6. Global Shortcuts
- `Ctrl/Cmd + Shift + S`: Show/hide main window
- `Ctrl/Cmd + Shift + N`: Create new note
- Additional shortcuts can be configured

## File Structure

```
electron/
├── main.ts                     # Main process entry point
├── managers/
│   ├── window-manager.ts       # Window management
│   ├── system-tray-manager.ts  # System tray functionality
│   ├── ipc-manager.ts          # IPC communication
│   ├── auto-updater-manager.ts # Auto-update functionality
│   └── offline-data-manager.ts # Offline data management
├── preload/
│   └── preload.ts              # Preload script for renderer
└── utils/
    └── environment.ts          # Environment utilities

src/
├── hooks/
│   └── use-electron.ts         # React hooks for Electron
└── components/
    └── electron/
        ├── electron-window-controls.tsx  # Window controls
        ├── electron-sync-status.tsx      # Sync status indicator
        └── electron-updater.tsx          # Update notifications
```

## Configuration

### Electron Builder Configuration
The application packaging is configured in `package.json` under the `build` section:

- **App ID**: `com.studycollab.app`
- **Product Name**: StudyCollab
- **Output Directory**: `release/`
- **Supported Platforms**: Windows, macOS, Linux
- **Auto-updater**: Configured for GitHub releases

### Assets Required
The following assets need to be created for proper distribution:

- `assets/icon.png` - Linux icon (512x512)
- `assets/icon.ico` - Windows icon
- `assets/icon.icns` - macOS icon
- `assets/tray-icon.png` - System tray icon (16x16 or 32x32)
- `assets/entitlements.mac.plist` - macOS entitlements

## Security

The desktop application implements several security measures:

- **Context Isolation**: Renderer process is isolated from Node.js
- **No Node Integration**: Renderer cannot directly access Node.js APIs
- **Preload Script**: Safe API exposure through contextBridge
- **Content Security**: External navigation is blocked and opened in system browser
- **Code Signing**: Ready for code signing certificates

## Development Notes

### TypeScript Configuration
- Separate TypeScript configuration for Electron (`tsconfig.electron.json`)
- Compiled output goes to `dist/electron/`
- Type definitions included for Electron APIs

### Hot Reload
In development mode:
- Next.js runs on `http://localhost:3000`
- Electron loads the development server
- Changes to renderer code trigger hot reload
- Changes to main process code require restart

### Debugging
- Renderer process: Use Chrome DevTools (automatically opened in dev mode)
- Main process: Use VS Code debugger or console logging
- IPC communication: Monitor through DevTools console

## Next Steps

To complete the desktop application implementation:

1. **Create actual application icons** to replace placeholder files
2. **Set up code signing** for Windows and macOS distribution
3. **Configure auto-update server** for production releases
4. **Implement additional native features** as needed
5. **Test on all target platforms** before distribution

## Usage in React Components

```tsx
import { useElectron, useElectronWindow, useElectronSync } from '@/hooks/use-electron';

function MyComponent() {
  const { isElectron } = useElectron();
  const { minimize, maximize, close } = useElectronWindow();
  const { syncStatus, triggerSync } = useElectronSync();

  if (!isElectron) {
    return <div>Web version</div>;
  }

  return (
    <div>
      <button onClick={minimize}>Minimize</button>
      <button onClick={maximize}>Maximize</button>
      <button onClick={close}>Close</button>
      <button onClick={triggerSync}>Sync Now</button>
      <p>Pending changes: {syncStatus.pendingChanges}</p>
    </div>
  );
}
```

This desktop application foundation provides a solid base for building native desktop features while maintaining compatibility with the existing web application.