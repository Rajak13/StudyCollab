# 🚀 StudyCollab Desktop - Quick Start Guide

Get the StudyCollab desktop app running on your machine in just a few steps!

## 🎯 One-Command Setup

```bash
npm run setup-desktop
```

This single command will:
- ✅ Check your system requirements
- ✅ Install all dependencies
- ✅ Build the application
- ✅ Compile Electron files
- ✅ Create launcher scripts
- ✅ Set up desktop integration

## 🏃‍♂️ Running the App

After setup, you can run the desktop app using:

### Windows
```bash
# Option 1: Use the launcher script
scripts\launch-studycollab.bat

# Option 2: Use npm command
npm run electron:dev
```

### macOS/Linux
```bash
# Option 1: Use the launcher script
./scripts/launch-studycollab.sh

# Option 2: Use npm command
npm run electron:dev
```

## ⚙️ Configuration

1. **Edit `.env.local`** with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Start the app** using one of the methods above

## 🎨 Desktop Features

Once running, you'll have access to:

- 🔔 **Native Notifications** - System notifications for reminders and group activities
- ⌨️ **Global Shortcuts** - Quick access from anywhere (Ctrl+Shift+S to toggle window)
- 📁 **File Integration** - Drag & drop files, open .scnote files automatically
- 🎯 **System Tray** - Background operation with quick access menu
- 📱 **Offline Support** - Work without internet, sync when connected

## 🛠️ Building Installers

Create distributable packages:

```bash
# Windows installer (.exe)
npm run electron:dist:win

# macOS installer (.dmg)
npm run electron:dist:mac

# Linux packages (.AppImage, .deb, .rpm)
npm run electron:dist:linux

# All platforms
npm run electron:dist
```

## 🆘 Troubleshooting

### Common Issues:

**"Node.js not found"**
- Install Node.js 18+ from https://nodejs.org/

**"Build failed"**
- Run `npm run type-check` to see TypeScript errors
- Fix errors and try again

**"App won't start"**
- Check that port 3000 is available
- Verify your `.env.local` configuration

**"System features not working"**
- Some features only work in built app, not development mode
- Try: `npm run electron:build && npm run electron`

### Get Help:
- 📖 [Detailed Setup Guide](docs/desktop-app-local-setup.md)
- 📋 [Desktop Features Guide](docs/desktop-system-integration.md)
- 🐛 [GitHub Issues](https://github.com/studycollab/studycollab/issues)

## 🎉 You're Ready!

Your StudyCollab desktop app is now set up and ready to use. Enjoy the enhanced productivity features and seamless system integration!

---

**Made with ❤️ for students worldwide** 🌍