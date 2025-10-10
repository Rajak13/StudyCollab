# StudyCollab Desktop - Cross-Platform Build System

This document provides a comprehensive overview of the StudyCollab Desktop cross-platform build and packaging system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build for current platform
npm run dist

# Build for all platforms
npm run dist:all

# Verify builds
npm run verify:build
```

## 📋 Build System Overview

The StudyCollab Desktop build system is designed to create production-ready installers for Windows, macOS, and Linux platforms with proper code signing and security verification.

### Key Features

- ✅ **Cross-platform builds** - Windows, macOS, Linux
- ✅ **Code signing** - Platform-specific security verification
- ✅ **Multiple formats** - Installers, portable apps, packages
- ✅ **Automated CI/CD** - GitHub Actions integration
- ✅ **Build verification** - Integrity and quality checks
- ✅ **Auto-updates** - Built-in update mechanism

## 🛠️ Build Scripts

### Core Build Commands

| Command | Description |
|---------|-------------|
| `npm run dist` | Build for current platform |
| `npm run dist:all` | Build for all supported platforms |
| `npm run dist:all:clean` | Clean build for all platforms |
| `npm run dist:win` | Build Windows targets only |
| `npm run dist:mac` | Build macOS targets only |
| `npm run dist:linux` | Build Linux targets only |

### Configuration Commands

| Command | Description |
|---------|-------------|
| `npm run setup:signing` | Configure code signing |
| `npm run validate:signing` | Validate signing configuration |
| `npm run build:config` | Generate build configuration |
| `npm run verify:build` | Verify build artifacts |

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Start development server |
| `npm run electron:build` | Build Electron app |
| `npm run electron:compile` | Compile TypeScript |
| `npm run electron:test` | Run Electron tests |

## 📦 Build Outputs

### Windows
- `StudyCollab-Setup-{version}.exe` - NSIS installer with system integration
- `StudyCollab-Portable-{version}.exe` - Portable executable (no installation)

### macOS
- `StudyCollab-{version}.dmg` - Disk image installer
- `StudyCollab-{version}-mac.zip` - ZIP archive

### Linux
- `StudyCollab-{version}.AppImage` - Universal Linux executable
- `StudyCollab-{version}.deb` - Debian/Ubuntu package
- `StudyCollab-{version}.rpm` - Red Hat/Fedora package
- `StudyCollab-{version}.tar.gz` - Compressed archive

## 🔐 Code Signing Setup

### Windows Code Signing

1. **Obtain Certificate**
   ```bash
   # Purchase from trusted CA or create self-signed for testing
   ```

2. **Set Environment Variables**
   ```bash
   export WIN_CSC_LINK="/path/to/certificate.p12"
   export WIN_CSC_KEY_PASSWORD="certificate-password"
   export WIN_CSC_SUBJECT_NAME="Your Company Name"
   ```

3. **Verify Setup**
   ```bash
   npm run validate:signing
   ```

### macOS Code Signing

1. **Apple Developer Account**
   - Join Apple Developer Program ($99/year)
   - Create Developer ID Application certificate

2. **Set Environment Variables**
   ```bash
   export APPLE_ID="your-apple-id@example.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="YOUR_TEAM_ID"
   ```

3. **Install Certificate**
   ```bash
   # Download and install certificate in Keychain Access
   ```

### Linux Code Signing (Optional)

1. **Generate GPG Key**
   ```bash
   gpg --gen-key
   ```

2. **Set Environment Variables**
   ```bash
   export GPG_PRIVATE_KEY="base64-encoded-private-key"
   export GPG_PASSPHRASE="your-gpg-passphrase"
   ```

## 🏗️ Build Architecture

```
studycollab-mvp/
├── scripts/
│   ├── build-config.js           # Build configuration manager
│   ├── build-all-platforms.js    # Cross-platform build script
│   ├── setup-code-signing.js     # Code signing setup
│   ├── verify-build.js           # Build verification
│   └── notarize.js               # macOS notarization
├── build/
│   ├── installer.nsh             # Windows installer script
│   ├── entitlements.mac.plist    # macOS entitlements
│   └── signing-config.json       # Generated signing config
├── assets/
│   ├── icon.ico                  # Windows icon
│   ├── icon.icns                 # macOS icon
│   ├── icon.png                  # Linux icon
│   └── installer-*.bmp           # Installer graphics
└── release/                      # Build output directory
```

## 🔧 Configuration Files

### package.json - Build Configuration
```json
{
  "build": {
    "appId": "com.studycollab.desktop",
    "productName": "StudyCollab",
    "directories": {
      "output": "release"
    },
    "win": { /* Windows config */ },
    "mac": { /* macOS config */ },
    "linux": { /* Linux config */ }
  }
}
```

### Environment Variables
```bash
# Windows Code Signing
WIN_CSC_LINK=path/to/certificate.p12
WIN_CSC_KEY_PASSWORD=password

# macOS Code Signing
APPLE_ID=your-apple-id@example.com
APPLE_ID_PASSWORD=app-specific-password
APPLE_TEAM_ID=YOUR_TEAM_ID

# Linux Code Signing
GPG_PRIVATE_KEY=base64-encoded-key
GPG_PASSPHRASE=passphrase

# Build Options
NODE_ENV=production
CLEAN_BUILD=true
PUBLISH_BUILD=false
```

## 🤖 CI/CD Integration

### GitHub Actions Workflow

The build system includes a comprehensive GitHub Actions workflow:

```yaml
# .github/workflows/build-and-release.yml
name: Build and Release StudyCollab Desktop

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build-windows:    # Windows build job
  build-macos:      # macOS build job  
  build-linux:      # Linux build job
  create-release:   # Release creation
  verify-builds:    # Build verification
  security-scan:    # Security scanning
```

### Required Secrets

Set these secrets in your GitHub repository:

```bash
# Windows
WIN_CSC_LINK                 # Certificate file (base64)
WIN_CSC_KEY_PASSWORD         # Certificate password
WIN_CSC_SUBJECT_NAME         # Certificate subject

# macOS
APPLE_ID                     # Apple ID
APPLE_ID_PASSWORD            # App-specific password
APPLE_TEAM_ID                # Developer Team ID
APPLE_CERTIFICATE            # Certificate (base64)
APPLE_CERTIFICATE_PASSWORD   # Certificate password

# Linux
GPG_PRIVATE_KEY              # GPG private key (base64)
GPG_PASSPHRASE               # GPG passphrase

# GitHub
GITHUB_TOKEN                 # Automatically provided
```

## 🔍 Build Verification

The build system includes comprehensive verification:

```bash
# Run verification
npm run verify:build
```

### Verification Checks

- ✅ **File Existence** - All expected artifacts present
- ✅ **File Integrity** - Non-zero file sizes, format validation
- ✅ **Platform Compliance** - Platform-specific format checks
- ✅ **Size Validation** - Reasonable file sizes for executables
- ✅ **Permissions** - Executable permissions on Linux/macOS

### Verification Report

```json
{
  "timestamp": "2025-01-27T...",
  "platform": "win32",
  "files": 4,
  "totalSize": 157286400,
  "errors": [],
  "warnings": [],
  "artifacts": [...]
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Code Signing Failures
```bash
# Check signing configuration
npm run validate:signing

# Skip signing for testing
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist
```

#### 2. Build Failures
```bash
# Clean build
npm run dist:all:clean

# Check build logs
cat build/build-log.txt
```

#### 3. Platform-Specific Issues

**Windows:**
```bash
# Install build tools
npm install --global windows-build-tools
```

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

**Linux:**
```bash
# Install dependencies
sudo apt-get install libnss3-dev libatk-bridge2.0-dev
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=electron-builder npm run dist

# Skip notarization (macOS)
SKIP_NOTARIZATION=true npm run dist:mac

# Skip code signing
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist
```

## 📈 Performance Optimization

### Build Speed
- Use build caches in CI/CD
- Parallel builds for different platforms
- Incremental builds when possible

### Bundle Size
- Tree shaking for unused code
- Asset optimization
- Dependency analysis

### Startup Performance
- Code splitting
- Lazy loading
- Preload optimization

## 🔒 Security Considerations

### Code Signing
- Always sign production builds
- Use trusted certificates
- Verify signatures before distribution

### Update Security
- HTTPS for update servers
- Signature verification for updates
- Staged rollouts for safety

### Build Security
- Secure build environments
- Dependency scanning
- Regular security audits

## 📚 Additional Resources

- [Build Guide](./docs/BUILD_GUIDE.md) - Detailed build instructions
- [Electron Builder Docs](https://www.electron.build/) - Official documentation
- [Code Signing Guide](./docs/CODE_SIGNING.md) - Platform-specific signing
- [Deployment Guide](./docs/DEPLOYMENT.md) - Distribution strategies

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review build logs in `build/build-log.txt`
3. Verify prerequisites and environment variables
4. Try a clean build with `--clean` flag
5. Check GitHub Issues for known problems

---

**Happy Building! 🚀**