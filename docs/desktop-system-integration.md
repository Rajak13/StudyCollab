# Desktop App System Integration

This document describes the system integration features implemented for the StudyCollab desktop application.

## Features Implemented

### 1. Native System Notifications

The desktop app now supports native system notifications for:

- **Task Reminders**: Notifications for upcoming task deadlines with action buttons (Snooze, Mark Complete)
- **Group Activities**: Notifications when study group members perform actions (share files, join calls, etc.)
- **General Notifications**: Custom notifications with configurable urgency levels

#### Usage:
```typescript
// Show a reminder notification
window.electronAPI?.showReminderNotification(
  'Task Due Soon',
  'Your assignment is due in 30 minutes!',
  { taskId: '123' }
);

// Show group activity notification
window.electronAPI?.showGroupActivityNotification(
  'Study Group Alpha',
  'shared a new document',
  'John Doe'
);
```

### 2. Global Keyboard Shortcuts

The app registers system-wide keyboard shortcuts that work even when StudyCollab is not focused:

#### Default Shortcuts:
- `Ctrl+Shift+S` (Cmd+Shift+S on Mac): Toggle main window visibility
- `Ctrl+Shift+N` (Cmd+Shift+N on Mac): Create new note
- `Ctrl+Shift+C` (Cmd+Shift+C on Mac): Quick capture
- `Ctrl+Shift+F` (Cmd+Shift+F on Mac): Global search
- `Ctrl+Shift+T` (Cmd+Shift+T on Mac): Show today's tasks

#### Custom Shortcuts:
Users can register custom shortcuts through the settings page:

```typescript
// Register a custom shortcut
const success = await window.electronAPI?.registerGlobalShortcut(
  'Ctrl+Alt+N',
  'new-task',
  'Create new task'
);
```

### 3. System Menu Integration

The app provides native system menus with:

#### macOS Menu:
- Full macOS-style menu bar with StudyCollab, File, Edit, View, Window, and Help menus
- Standard macOS shortcuts and behaviors
- Services integration

#### Windows/Linux Menu:
- Traditional File, Edit, View, Help menu structure
- Platform-appropriate shortcuts (Ctrl vs Cmd)

#### Menu Features:
- Quick navigation to different app sections
- File import functionality
- Keyboard shortcut help
- About and support links

### 4. File Association Handling

The app can be set as the default handler for StudyCollab file types:

#### Supported File Types:
- `.scnote` - StudyCollab Note files
- `.sctask` - StudyCollab Task files  
- `.scboard` - StudyCollab Study Board files

#### Protocol Handler:
- `studycollab://` protocol for deep linking
- Examples:
  - `studycollab://note/123` - Open specific note
  - `studycollab://group/456` - Open study group
  - `studycollab://dashboard` - Open dashboard

#### Implementation:
```typescript
// Handle file opening
window.electronAPI?.on('open-file', (event, data) => {
  switch (data.type) {
    case 'note':
      // Open note file
      break;
    case 'task':
      // Open task file
      break;
  }
});
```

### 5. Drag and Drop File Handling

The app supports drag and drop from the system file explorer:

#### Supported File Types:
- StudyCollab files (`.scnote`, `.sctask`, `.scboard`)
- Text files (`.txt`, `.md`) - imported as notes
- Documents (`.pdf`, `.doc`, `.docx`) - added to file manager
- Images (`.jpg`, `.png`, `.gif`) - added to file manager

#### Features:
- Visual feedback during drag operations
- Automatic file type detection
- Batch file processing
- Error handling for unsupported files

#### Implementation:
```typescript
// The drag and drop is handled automatically by the ElectronIntegration component
// Files are processed based on their extensions and imported appropriately
```

## Components

### SystemIntegrationManager
Main class that handles all system integration features:
- Notification management
- Global shortcut registration
- File association handling
- System menu setup

### ElectronIntegration (React Component)
React component that:
- Sets up drag and drop event listeners
- Handles Electron IPC events
- Provides notification functions to other components
- Manages file import workflows

### GlobalShortcutsManager (React Component)
Settings UI component for:
- Viewing registered shortcuts
- Adding custom shortcuts
- Removing shortcuts
- Shortcut format help

## Settings Integration

All system integration features can be configured through the Settings page:

### Desktop App Tab:
- Auto-start with system
- Minimize/close to system tray
- Automatic updates
- File associations
- Drag & drop preferences

### Shortcuts Tab:
- View all registered shortcuts
- Add custom shortcuts
- Remove shortcuts
- Shortcut format reference

### Notifications Tab:
- Enable/disable notification types
- Test notifications
- System notification preferences

## Platform Support

### Windows:
- Native notifications with action buttons
- System tray integration
- File associations via registry
- Global shortcuts

### macOS:
- Native notifications with actions
- Menu bar integration
- File associations via Info.plist
- Global shortcuts with Cmd key

### Linux:
- Desktop notifications
- System tray (where supported)
- File associations via .desktop files
- Global shortcuts

## Security Considerations

- All file operations are validated and sandboxed
- Protocol handlers are restricted to known patterns
- Global shortcuts are limited to prevent conflicts
- File drag and drop is filtered by extension whitelist

## Testing

To test the system integration features:

1. **Notifications**: Use the test buttons in Settings > Notifications
2. **Shortcuts**: Register a custom shortcut and test it works globally
3. **File Associations**: Create a `.scnote` file and double-click it
4. **Drag & Drop**: Drag a text file into the app window
5. **Menu Integration**: Use the system menu to navigate the app

## Troubleshooting

### Shortcuts Not Working:
- Check if another app is using the same shortcut
- Verify the shortcut format is correct
- Restart the app to re-register shortcuts

### File Associations Not Working:
- Check if another app is set as default for the file type
- Re-run the installer to register file associations
- Manually set StudyCollab as default in system settings

### Notifications Not Showing:
- Check system notification permissions
- Verify notifications are enabled in app settings
- Test with the notification test buttons

### Drag & Drop Not Working:
- Ensure the file type is supported
- Check if drag & drop is enabled in settings
- Try dropping files directly on the app window