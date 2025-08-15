# StudyCollab Desktop Installer and Distribution Setup

This document describes the complete setup for building, distributing, and auto-updating the StudyCollab desktop application.

## Overview

The StudyCollab desktop application uses:
- **electron-builder** for creating installers
- **electron-updater** for automatic updates
- **GitHub Releases** for distribution
- **NSIS** for Windows installer
- **Custom API endpoints** for download management

## Build Configuration

### Package.json Configuration

The `package.json` includes comprehensive electron-builder configuration:

```json
{
  "build": {
    "appId": "com.studycollab.app",
    "productName": "StudyCollab",
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "runAfterFinish": true,
      "fileAssociations": [...],
      "protocols": [...]
    }
  }
}
```

### File Associations

The installer automatically registers these file types:
- `.scnote` - StudyCollab Note files
- `.sctask` - StudyCollab Task files  
- `.scboard` - StudyCollab Study Board files

### Protocol Handler

Registers `studycollab://` protocol for deep linking into the application.

## Build Scripts

### Development
```bash
npm run electron:dev          # Run in development mode
npm run electron:compile      # Compile TypeScript
```

### Building
```bash
npm run electron:build        # Build Next.js + compile Electron
npm run electron:pack         # Create unpacked app
npm run electron:dist         # Create installer (current platform)
npm run electron:dist:win     # Create Windows installer
npm run electron:dist:mac     # Create macOS installer  
npm run electron:dist:linux   # Create Linux installer
```

### Publishing
```bash
npm run electron:publish      # Build and publish to GitHub
npm run electron:publish:win  # Build and publish Windows version
```

## Auto-Updater System

### Configuration

The auto-updater is configured to:
- Check for updates every 4 hours
- Download updates manually (user confirmation required)
- Install updates on app quit
- Use GitHub Releases as the update source

### Update Flow

1. App checks for updates on startup and periodically
2. If update available, shows dialog to user
3. User can choose to download now or later
4. Once downloaded, prompts to restart and install
5. Update installs on next app launch

### API Endpoints

#### `/api/download`
- **GET**: Redirects to appropriate installer for user's platform
- **POST**: Logs download analytics

#### `/api/releases/latest`
- **GET**: Returns latest release info in electron-updater format
- **POST**: Checks if update is available for specific version

## Distribution Workflow

### GitHub Actions

The `.github/workflows/build-and-release.yml` workflow:

1. **Triggers**: On version tags (`v*`) or manual dispatch
2. **Builds**: Creates installers for Windows, macOS, and Linux
3. **Releases**: Publishes to GitHub Releases with auto-generated notes
4. **Assets**: Uploads all installer files and update metadata

### Release Process

1. Update version in `package.json`
2. Create and push version tag: `git tag v1.0.0 && git push origin v1.0.0`
3. GitHub Actions automatically builds and creates release
4. Users can download from website or get auto-update notification

## Asset Requirements

### Icons
- `assets/icon.ico` - Main application icon (Windows)
- `assets/icon.icns` - Main application icon (macOS)
- `assets/icon.png` - Main application icon (Linux)
- `assets/note-icon.ico` - Note file type icon
- `assets/task-icon.ico` - Task file type icon
- `assets/board-icon.ico` - Board file type icon

### Installer Graphics
- `assets/installer-header.bmp` - Installer header (150x57 pixels)
- `assets/installer-sidebar.bmp` - Installer sidebar (164x314 pixels)
- `assets/uninstaller-sidebar.bmp` - Uninstaller sidebar (164x314 pixels)

## Environment Variables

### Required for Building
```bash
# For GitHub publishing
GH_TOKEN=your_github_token

# For custom release repository
NEXT_PUBLIC_RELEASE_OWNER=studycollab
NEXT_PUBLIC_RELEASE_REPO=studycollab-desktop

# For GitHub API rate limits
GITHUB_TOKEN=your_github_token
```

### Optional for Code Signing
```bash
# Windows code signing
CSC_LINK=path_to_certificate.p12
CSC_KEY_PASSWORD=certificate_password

# macOS code signing  
CSC_IDENTITY_AUTO_DISCOVERY=false
APPLE_ID=your_apple_id
APPLE_ID_PASSWORD=app_specific_password
```

## Installation Features

### Windows (NSIS)
- Custom installer with branding
- Desktop and Start Menu shortcuts
- File associations for StudyCollab files
- Protocol handler registration
- Uninstaller with cleanup
- Optional auto-start with Windows

### macOS (DMG)
- Drag-and-drop installation
- Code signing support (when configured)
- Notarization support (when configured)
- File associations
- Protocol handler

### Linux (AppImage/DEB/RPM)
- Universal AppImage for maximum compatibility
- DEB packages for Debian/Ubuntu
- RPM packages for Red Hat/Fedora
- Desktop entry creation
- File associations

## Troubleshooting

### Build Issues
- Ensure all required assets exist in `assets/` directory
- Check that Node.js version is compatible (18+)
- Verify electron-builder configuration syntax

### Update Issues
- Check GitHub token permissions
- Verify release repository settings
- Ensure update server is accessible
- Check app version format (semver)

### Distribution Issues
- Verify GitHub Actions permissions
- Check artifact upload paths
- Ensure release assets are properly named

## Security Considerations

### Code Signing
- Windows: Use Authenticode certificate
- macOS: Use Apple Developer certificate and notarization
- Linux: GPG signing for packages

### Update Security
- Updates are verified against GitHub releases
- HTTPS-only update channels
- Signature verification (when code signing is enabled)

### File Associations
- Only register safe file types
- Validate file content before opening
- Sandbox file operations

## Monitoring and Analytics

### Download Tracking
- Platform detection and logging
- Download completion analytics
- Error tracking and reporting

### Update Metrics
- Update check frequency
- Update adoption rates
- Update failure tracking

## Future Enhancements

### Planned Features
- Delta updates for smaller downloads
- Background update downloads
- Update rollback capability
- Custom update channels (beta, stable)
- Offline installer support

### Infrastructure Improvements
- CDN distribution for faster downloads
- Mirror servers for reliability
- Update caching and optimization
- Advanced analytics dashboard