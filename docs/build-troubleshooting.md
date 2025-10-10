# Build Troubleshooting Guide

## Common Issues and Solutions

### 1. NSIS Duplicate Definition Error

**Error**: `!define: "MUI_WELCOMEFINISHPAGE_BITMAP" already defined!`

**Cause**: electron-builder automatically defines certain NSIS variables, but custom installer scripts try to redefine them.

**Solution**: 
- Remove duplicate `!define` statements from `build/installer.nsh`
- Let electron-builder handle the default UI definitions
- Only define custom variables that aren't automatically set

**Fixed in**: The installer.nsh file has been updated to avoid conflicts.

### 2. Cross-Platform Build Issues

**Windows**:
- Requires Windows SDK for code signing (optional)
- NSIS installer requires proper bitmap files
- Both x64 and ia32 architectures supported

**macOS**:
- Requires Xcode command line tools
- Code signing requires Apple Developer account (optional for development)
- Supports both Intel (x64) and Apple Silicon (arm64)

**Linux**:
- Supports AppImage, deb, rpm, and snap formats
- AppImage is most universal
- Requires proper desktop file configuration

### 3. Build Scripts

Use these npm scripts for building:

```bash
# Validate configuration
npm run validate:build

# Build for current platform
npm run electron:dist

# Build for specific platforms
npm run electron:dist:win
npm run electron:dist:mac  
npm run electron:dist:linux

# Build for all platforms
npm run build:all-platforms
```

### 4. Asset Requirements

Ensure these files exist:
- `assets/icon.ico` (Windows)
- `assets/icon.icns` (macOS)
- `assets/icon.png` (Linux)
- `assets/entitlements.mac.plist` (macOS)
- `build/installer.nsh` (Windows NSIS)

### 5. Debugging Build Issues

1. Run validation script: `npm run validate:build`
2. Check electron-builder logs in console
3. Verify all required assets exist
4. Test with minimal configuration first
5. Check platform-specific requirements

### 6. Performance Tips

- Use `--skip-native` flag to skip native module rebuilding during development
- Build incrementally (one platform at a time) for faster iteration
- Use `--dir` flag for unpacked builds during testing

### 7. Distribution

After successful build:
- Windows: `.exe` installer in `release/` folder
- macOS: `.dmg` and `.zip` files in `release/` folder  
- Linux: `.AppImage`, `.deb`, `.rpm` files in `release/` folder

### 8. Code Signing (Optional)

For production releases:
- Windows: Use signtool.exe with certificate
- macOS: Use Apple Developer certificate and notarization
- Linux: GPG signing for package repositories