# StudyCollab Desktop Update System

This document describes the comprehensive auto-update system implemented for StudyCollab Desktop application.

## Overview

The update system provides:
- Automatic update checking and downloading
- User consent and progress tracking
- Code signing for security verification
- Cross-platform support (Windows, macOS, Linux)
- Update server configuration and deployment pipeline

## Architecture

### Components

1. **UpdateManager** (`electron/update-manager.ts`)
   - Manages the entire update lifecycle
   - Handles electron-updater integration
   - Provides secure IPC communication
   - Manages user consent and notifications

2. **Update UI Components**
   - `UpdateNotification` - Floating notification for updates
   - `UpdateSettings` - Settings panel for update preferences
   - `useUpdateManager` - React hook for update state management

3. **Code Signing** (`scripts/sign-config.js`)
   - Platform-specific code signing configuration
   - Certificate validation and setup
   - Security best practices enforcement

4. **Update Server** (`scripts/update-server-config.js`)
   - GitHub Releases integration
   - Custom update server configuration
   - Deployment pipeline setup

## Features

### Automatic Updates
- Periodic update checking (configurable interval)
- Background downloading with progress tracking
- User consent before installation
- Automatic installation on app restart

### Security
- Code signing for all platforms
- Update signature verification
- Secure download channels
- Certificate validation

### User Experience
- Non-intrusive notifications
- Progress tracking with detailed information
- User control over update preferences
- Graceful error handling and recovery

### Cross-Platform Support
- **Windows**: NSIS installer with code signing
- **macOS**: DMG with notarization and Gatekeeper approval
- **Linux**: AppImage with optional GPG signing

## Configuration

### Environment Variables

#### Windows Code Signing
```bash
WIN_CSC_LINK=path/to/certificate.p12          # Certificate file path
WIN_CSC_KEY_PASSWORD=certificate_password      # Certificate password
WIN_CSC_SUBJECT_NAME=certificate_subject       # Certificate subject (optional)
```

#### macOS Code Signing & Notarization
```bash
APPLE_ID=your@apple.id                         # Apple ID for notarization
APPLE_ID_PASSWORD=app_specific_password        # App-specific password
APPLE_TEAM_ID=your_team_id                     # Apple Developer Team ID
CSC_LINK=path/to/certificate.p12              # Developer ID certificate
CSC_KEY_PASSWORD=certificate_password          # Certificate password
```

#### Linux GPG Signing (Optional)
```bash
GPG_PRIVATE_KEY=base64_encoded_private_key     # GPG private key
GPG_PASSPHRASE=gpg_passphrase                  # GPG key passphrase
```

#### Update Server
```bash
UPDATE_SERVER_URL=https://updates.example.com # Custom update server URL
GH_TOKEN=github_personal_access_token          # GitHub token for releases
```

### Package.json Configuration

The `build` section in `package.json` includes:
- Platform-specific build targets
- Code signing configuration
- Update server settings
- Security policies

## Usage

### Development

1. **Setup Code Signing**
   ```bash
   npm run setup:signing
   ```

2. **Setup Update Server**
   ```bash
   npm run setup:update-server
   ```

3. **Build with Updates**
   ```bash
   npm run electron:build
   ```

### Production Deployment

1. **GitHub Actions Workflow**
   - Automatically triggered on version tags
   - Builds for all platforms
   - Signs and notarizes applications
   - Creates GitHub releases

2. **Manual Release**
   ```bash
   # Build for all platforms
   npm run dist
   
   # Build for specific platform
   npm run dist:win    # Windows
   npm run dist:mac    # macOS
   npm run dist:linux  # Linux
   ```

## Update Flow

### 1. Update Check
- Periodic checks every 6 hours (configurable)
- Manual checks via UI
- Compares current version with latest release

### 2. Update Available
- Shows notification to user
- Displays version information and release notes
- Provides download option

### 3. Download
- Downloads update in background
- Shows progress to user
- Verifies download integrity

### 4. Installation
- Requests user consent (configurable)
- Provides install now or later options
- Restarts application to complete installation

## API Reference

### UpdateManager

```typescript
class UpdateManager {
  // Check for available updates
  checkForUpdates(): Promise<UpdateInfo | null>
  
  // Download available update
  downloadUpdate(): Promise<void>
  
  // Install downloaded update
  installUpdate(): Promise<void>
  
  // Get current update state
  getUpdateState(): UpdateState
  
  // Configure user consent requirement
  setUserConsentRequired(required: boolean): void
  
  // Start/stop periodic checking
  startPeriodicCheck(intervalHours: number): void
  stopPeriodicCheck(): void
}
```

### React Hook

```typescript
const {
  updateState,
  lastChecked,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  dismissUpdate
} = useUpdateManager();
```

### UI Components

```tsx
// Update notification
<UpdateNotification onClose={() => {}} />

// Update settings panel
<UpdateSettings />
```

## Security Considerations

### Code Signing
- All releases are code signed for security verification
- Certificates are validated before signing
- Secure certificate storage in CI/CD environment

### Update Verification
- Update signatures are verified before installation
- Secure HTTPS downloads only
- Certificate pinning for update server communication

### User Privacy
- No personal data collected during update process
- Optional analytics with user consent
- Transparent update process with user control

## Troubleshooting

### Common Issues

1. **Code Signing Failures**
   - Verify certificate validity and permissions
   - Check environment variable configuration
   - Ensure certificate is properly installed

2. **Update Check Failures**
   - Verify network connectivity
   - Check update server availability
   - Review firewall and proxy settings

3. **Download Failures**
   - Check available disk space
   - Verify download permissions
   - Review network stability

4. **Installation Failures**
   - Ensure application is not running
   - Check administrator permissions
   - Verify update file integrity

### Debug Mode

Enable debug logging:
```bash
DEBUG=electron-updater npm run electron:dev
```

### Log Files

Update logs are stored in:
- **Windows**: `%APPDATA%/StudyCollab/logs/`
- **macOS**: `~/Library/Logs/StudyCollab/`
- **Linux**: `~/.config/StudyCollab/logs/`

## Best Practices

### Development
- Test updates in development environment
- Verify code signing configuration
- Test update flow on all platforms

### Deployment
- Use staged rollouts for major updates
- Monitor update success rates
- Maintain rollback capabilities

### Security
- Regularly rotate signing certificates
- Monitor for security vulnerabilities
- Keep update server infrastructure secure

### User Experience
- Provide clear update information
- Allow user control over update timing
- Minimize disruption to user workflow

## Monitoring and Analytics

### Metrics Tracked
- Update check frequency and success rates
- Download completion rates
- Installation success rates
- Error rates and types
- User consent patterns

### Monitoring Setup
- Prometheus metrics endpoint
- Health check endpoints
- Structured logging
- Error reporting integration

## Future Enhancements

### Planned Features
- Delta updates for smaller downloads
- Update channels (stable, beta, alpha)
- Rollback capabilities
- A/B testing for updates
- Enhanced user notifications

### Performance Improvements
- Bandwidth throttling options
- Resume interrupted downloads
- Peer-to-peer update distribution
- CDN integration for faster downloads

## Support

For issues related to the update system:
1. Check the troubleshooting section
2. Review log files for error details
3. Create an issue on GitHub with relevant information
4. Contact the development team for critical issues

## License

The update system is part of StudyCollab Desktop and follows the same license terms.