# StudyCollab Desktop Application

A native desktop application for StudyCollab with enhanced system integration features.

## 🚀 Quick Start

### Option 1: Use the Setup Script (Recommended)

**Windows:**
```bash
# Double-click or run in Command Prompt
scripts\run-desktop.bat
```

**macOS/Linux:**
```bash
# Make executable and run
chmod +x scripts/run-desktop.sh
./scripts/run-desktop.sh
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Build and Run**
   ```bash
   # Development mode (recommended for testing)
   npm run electron:dev
   
   # Or production mode
   npm run electron:build
   npm run electron
   ```

## 📱 Desktop Features

### 🔔 Native System Notifications
- Task deadline reminders with action buttons
- Study group activity notifications
- Customizable notification preferences

### ⌨️ Global Keyboard Shortcuts
- `Ctrl+Shift+S` - Toggle main window
- `Ctrl+Shift+N` - Create new note
- `Ctrl+Shift+C` - Quick capture
- `Ctrl+Shift+F` - Global search
- `Ctrl+Shift+T` - Show today's tasks
- Custom shortcuts configurable in settings

### 📁 File System Integration
- **File Associations**: `.scnote`, `.sctask`, `.scboard` files
- **Protocol Handler**: `studycollab://` URLs for deep linking
- **Drag & Drop**: Drop files from system explorer
- **System Menu**: Native menu bar integration

### 🎯 System Tray
- Background operation
- Quick access menu
- Notification badges
- Context menu actions

## 🛠️ Building Distributables

### Create Installers

**Windows Installer:**
```bash
npm run electron:dist:win
```
Creates: `release/StudyCollab Setup.exe`

**macOS Installer:**
```bash
npm run electron:dist:mac
```
Creates: `release/StudyCollab.dmg`

**Linux Packages:**
```bash
npm run electron:dist:linux
```
Creates: `release/StudyCollab.AppImage`, `.deb`, `.rpm`

**All Platforms:**
```bash
npm run electron:dist
```

## 📋 System Requirements

### Windows
- Windows 10 or later
- 64-bit or 32-bit architecture
- 4GB RAM minimum

### macOS
- macOS 10.14 (Mojave) or later
- Intel or Apple Silicon (M1/M2)
- 4GB RAM minimum

### Linux
- Ubuntu 18.04 or equivalent
- 64-bit architecture
- GTK 3.0 or later
- 4GB RAM minimum

## 🔧 Development

### Project Structure
```
studycollab-mvp/
├── electron/                 # Electron main process
│   ├── main.ts              # Application entry point
│   ├── managers/            # System integration managers
│   │   ├── system-integration-manager.ts
│   │   ├── window-manager.ts
│   │   ├── ipc-manager.ts
│   │   └── ...
│   └── preload/             # Preload scripts
├── src/                     # React application
│   ├── components/electron/ # Electron-specific components
│   └── hooks/               # Electron hooks
├── assets/                  # App icons and resources
└── scripts/                 # Setup scripts
```

### Available Scripts
- `npm run electron:dev` - Development with hot reload
- `npm run electron:compile` - Compile TypeScript only
- `npm run electron:build` - Build everything
- `npm run electron:pack` - Create unpacked app
- `npm run type-check` - Check TypeScript errors

### Debugging
- **Renderer Process**: Use Chrome DevTools (`Ctrl+Shift+I`)
- **Main Process**: Use VS Code debugger or console.log
- **IPC Communication**: Check console in both processes

## 🐛 Troubleshooting

### Common Issues

**"electron command not found"**
- Ensure `npm install` completed successfully
- Check that `node_modules/.bin` is accessible

**TypeScript compilation errors**
- Run `npm run type-check` to see all errors
- Fix TypeScript errors before building

**App won't start**
- Check that port 3000 is available
- Verify `.env.local` configuration
- Check console for error messages

**System integration not working**
- Features only work in built app, not development
- Try `npm run electron:build && npm run electron`
- Check system permissions for notifications

**File associations not working**
- Only work with installed/built versions
- May need to run installer as administrator
- Check default app settings in system preferences

### Getting Help

1. Check the [setup guide](docs/desktop-app-local-setup.md)
2. Review [system integration docs](docs/desktop-system-integration.md)
3. Check existing issues on GitHub
4. Create a new issue with:
   - Operating system and version
   - Node.js and npm versions
   - Complete error messages
   - Steps to reproduce

## 🎯 Testing System Integration

### Notifications
1. Go to Settings > Notifications
2. Click "Test Reminder" or "Test Group Activity"
3. Check system notification area

### Global Shortcuts
1. Go to Settings > Shortcuts
2. Register a custom shortcut
3. Test it works when app is not focused

### File Associations
1. Build the app: `npm run electron:build`
2. Create a test `.scnote` file
3. Double-click to open with StudyCollab

### Drag & Drop
1. Open StudyCollab desktop app
2. Drag a text file from file explorer
3. Drop it on the app window
4. Verify it imports correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on your platform
5. Submit a pull request

## 📞 Support

- 📧 Email: support@studycollab.app
- 💬 Discord: [StudyCollab Community](https://discord.gg/studycollab)
- 🐛 Issues: [GitHub Issues](https://github.com/studycollab/studycollab/issues)
- 📖 Docs: [Documentation](https://docs.studycollab.app)

---

Made with ❤️ by the StudyCollab team for students worldwide 🌍