# Electron Integration Configuration

This document explains how Next.js has been configured for Electron integration in the StudyCollab desktop application.

## Configuration Overview

The Next.js configuration has been modified to support both web and Electron environments through environment variable detection.

### Key Configuration Changes

#### 1. Asset Prefix Configuration
```typescript
assetPrefix: isElectronBuild ? './' : (process.env.NODE_ENV === 'production' ? '' : ''),
```
- Uses relative paths (`./`) for Electron builds
- Uses default paths for web builds

#### 2. Webpack Optimizations
- **Public Path**: Configured for Electron renderer process
- **Module Resolution**: Excludes Node.js modules from client bundle
- **Externals**: Excludes Electron from client bundle when building for Electron
- **Fallbacks**: Provides fallbacks for Node.js modules in browser environment

#### 3. Image Optimization
```typescript
images: {
  unoptimized: true, // Required for Electron integration
}
```
- Disabled image optimization for Electron compatibility

#### 4. Security Headers
- Content Security Policy configured for Electron environment
- Only applied when building for Electron

## Build Scripts

### Electron-Specific Build
```bash
npm run build:electron
```
- Sets `NEXT_PUBLIC_ELECTRON=true` environment variable
- Configures Next.js for Electron compatibility

### Development
```bash
npm run electron:dev
```
- Runs Next.js dev server and Electron concurrently

### Distribution
```bash
npm run dist        # All platforms
npm run dist:win    # Windows only
npm run dist:mac    # macOS only
npm run dist:linux  # Linux only
```

## Environment Detection

### Client-Side Detection
```typescript
import { isElectron } from '@/lib/electron'

if (isElectron()) {
  // Electron-specific code
}
```

### Build-Time Detection
```typescript
const isElectronBuild = process.env.NEXT_PUBLIC_ELECTRON === 'true'
```

## Electron API Integration

### Provider Setup
```tsx
import { ElectronProvider } from '@/components/electron/ElectronProvider'

function App() {
  return (
    <ElectronProvider>
      {/* Your app components */}
    </ElectronProvider>
  )
}
```

### Using Electron Features
```tsx
import { useElectronFeatures } from '@/hooks/useElectronFeatures'

function MyComponent() {
  const { isElectron, showNotification, openFile } = useElectronFeatures()
  
  const handleNotification = () => {
    showNotification('Title', 'Message')
  }
  
  return (
    <div>
      {isElectron && (
        <button onClick={handleNotification}>
          Show Desktop Notification
        </button>
      )}
    </div>
  )
}
```

## File Structure

```
studycollab-mvp/
├── src/
│   ├── lib/
│   │   └── electron.ts              # Electron detection utilities
│   ├── components/
│   │   └── electron/
│   │       ├── ElectronProvider.tsx # Electron context provider
│   │       └── ElectronTest.tsx     # Test component
│   └── hooks/
│       └── useElectronFeatures.ts   # Electron features hook
├── electron/                        # Electron main process files
├── next.config.ts                   # Next.js configuration
└── package.json                     # Build scripts and dependencies
```

## Testing the Configuration

Use the `ElectronTest` component to verify the integration:

```tsx
import { ElectronTest } from '@/components/electron/ElectronTest'

function TestPage() {
  return <ElectronTest />
}
```

This component will show:
- Current environment (Electron vs Web)
- App version
- Build configuration
- Test notification button (Electron only)

## Troubleshooting

### Build Issues
- Ensure `cross-env` is installed: `npm install cross-env`
- Check that environment variables are set correctly
- Verify webpack configuration doesn't conflict with other plugins

### Runtime Issues
- Check browser console for module resolution errors
- Verify Electron APIs are properly exposed through preload scripts
- Ensure Content Security Policy allows necessary resources

### Asset Loading Issues
- Verify `assetPrefix` is set correctly for your environment
- Check that relative paths work in Electron renderer process
- Ensure public assets are included in Electron build