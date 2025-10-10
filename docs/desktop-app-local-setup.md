# StudyCollab Desktop App - Local Setup Guide

This guide will help you set up and run the StudyCollab desktop application locally on your machine.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Navigate to your project directory
cd studycollab-mvp

# Install all dependencies (including Electron)
npm install
```

### 2. Environment Setup

Make sure your `.env.local` file is properly configured with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Build the Application

```bash
# Build the Next.js application
npm run build

# Compile the Electron TypeScript files
npm run electron:compile
```

### 4. Run the Desktop App

You have several options to run the desktop application:

#### Option A: Development Mode (Recommended for testing)
```bash
# This will start both the Next.js dev server and Electron
npm run electron:dev
```

This command will:
- Start the Next.js development server on http://localhost:3000
- Wait for the server to be ready
- Compile the Electron TypeScript files
- Launch the Electron desktop application

#### Option B: Production Mode
```bash
# Build everything first
npm run electron:build

# Then run the built application
npm run electron
```

### 5. Building Distributable Packages

To create installable packages for distribution:

#### For Windows:
```bash
npm run electron:dist:win
```
This creates:
- `.exe` installer (NSIS)
- Portable `.exe` file

#### For macOS:
```bash
npm run electron:dist:mac
```
This creates:
- `.dmg` installer
- `.zip` archive

#### For Linux:
```bash
npm run electron:dist:linux
```
This creates:
- `.AppImage` file
- `.deb` package
- `.rpm` package

#### For All Platforms:
```bash
npm run electron:dist
```

### 6. Package Contents

The built packages will be located in the `release/` directory and include:
- The complete StudyCollab application
- All system integration features (notifications, shortcuts, file associations)
- Auto-updater functionality
- Platform-specific installers

## Troubleshooting

### Common Issues:

1. **"electron command not found"**
   - Run `npm install` to ensure Electron is installed
   - Check that `node_modules/.bin` is in your PATH

2. **Build fails with TypeScript errors**
   - Run `npm run type-check` to see all errors
   - Fix TypeScript errors before building

3. **App doesn't start**
   - Check that port 3000 is available
   - Ensure your `.env.local` file is properly configured
   - Check the console for error messages

4. **System integration features not working**
   - These features only work in the built Electron app, not in development mode
   - Try building and running the production version

### Development Tips:

1. **Hot Reload**: In development mode, changes to React components will hot-reload, but Electron main process changes require a restart.

2. **Debugging**: 
   - Use Chrome DevTools for renderer process debugging (Ctrl+Shift+I)
   - Use VS Code or console.log for main process debugging

3. **Testing System Integration**:
   - File associations only work with built/installed versions
   - Global shortcuts work in development mode
   - System notifications work in development mode

## File Structure

```
studycollab-mvp/
├── electron/                 # Electron main process code
│   ├── main.ts              # Main entry point
│   ├── managers/            # System integration managers
│   └── preload/             # Preload scripts
├── src/                     # Next.js React application
├── assets/                  # App icons and resources
├── dist/                    # Compiled Electron code
├── release/                 # Built packages
└── package.json            # Dependencies and scripts
```

## Available Scripts

- `npm run electron:dev` - Development mode with hot reload
- `npm run electron:compile` - Compile TypeScript only
- `npm run electron:build` - Build everything
- `npm run electron:pack` - Create unpacked app
- `npm run electron:dist` - Create distributable packages
- `npm run electron:dist:win` - Windows packages only
- `npm run electron:dist:mac` - macOS packages only
- `npm run electron:dist:linux` - Linux packages only

## System Requirements

### Windows:
- Windows 10 or later
- 64-bit or 32-bit architecture

### macOS:
- macOS 10.14 (Mojave) or later
- Intel or Apple Silicon (M1/M2) processors

### Linux:
- Ubuntu 18.04 or equivalent
- 64-bit architecture
- GTK 3.0 or later

## Features Available in Desktop App

- ✅ Native system notifications
- ✅ Global keyboard shortcuts
- ✅ System tray integration
- ✅ File associations (.scnote, .sctask, .scboard)
- ✅ Drag and drop from file explorer
- ✅ Offline data synchronization
- ✅ Auto-updater
- ✅ Platform-specific menus
- ✅ Window state persistence

## Next Steps

After successfully running the desktop app locally:

1. Test all system integration features
2. Customize global shortcuts in Settings
3. Try drag-and-drop functionality
4. Test file associations (requires built version)
5. Configure notification preferences

For any issues or questions, refer to the main documentation or create an issue in the repository.