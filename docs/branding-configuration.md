# Branding Configuration Guide

This guide explains how to customize the logos and branding elements in your StudyCollab instance.

## Overview

StudyCollab supports comprehensive branding customization for both web and desktop platforms. You can customize:

- Application name and window title
- Logos for different contexts (navbar, window, system tray, etc.)
- Theme colors
- Hero images and other visual elements

## Configuration Methods

### 1. Configuration File

Create a `branding-config.json` file in your project root:

```json
{
  "version": "1.0.0",
  "branding": {
    "appName": "Your App Name",
    "windowTitle": "Your App - Collaborative Study Platform",
    "description": "Your custom description",
    "assets": {
      "navbar": "/path/to/navbar-logo.png",
      "window": "/path/to/window-icon.png",
      "tray": "/path/to/tray-icon.png",
      "splash": "/path/to/splash-logo.png",
      "favicon": "/path/to/favicon.ico",
      "hero": "/path/to/hero-image.jpg"
    },
    "theme": {
      "primaryColor": "#your-primary-color",
      "accentColor": "#your-accent-color",
      "backgroundColor": "#your-background-color"
    }
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### 2. Environment Variables

You can also configure branding through environment variables:

```env
NEXT_PUBLIC_APP_NAME="Your App Name"
NEXT_PUBLIC_LOGO_URL="/path/to/logo.png"
NEXT_PUBLIC_FAVICON_URL="/path/to/favicon.ico"
NEXT_PUBLIC_THEME_COLOR="#your-primary-color"
NEXT_PUBLIC_BG_COLOR="#your-background-color"
```

### 3. Admin Interface (Coming Soon)

A web-based configuration interface will be available for easy branding management.

## Logo Requirements

### Navbar Logo
- **Size**: 32x32px (recommended)
- **Format**: PNG, SVG, or JPG
- **Usage**: Displayed in the navigation bar and sidebar
- **Background**: Should work on both light and dark themes

### Window Icon
- **Size**: 256x256px (recommended)
- **Format**: PNG or ICO
- **Usage**: Desktop application window icon
- **Background**: Transparent recommended

### System Tray Icon
- **Size**: 16x16px, 32x32px (multi-size ICO recommended)
- **Format**: ICO or PNG
- **Usage**: System tray/notification area
- **Background**: Transparent, should work on various system themes

### Splash Screen Logo
- **Size**: 512x512px (recommended)
- **Format**: PNG or SVG
- **Usage**: Desktop application startup screen
- **Background**: Transparent or matching your brand colors

### Favicon
- **Size**: 16x16px, 32x32px, 48x48px (multi-size ICO recommended)
- **Format**: ICO
- **Usage**: Browser tab icon
- **Background**: Transparent or solid

### Hero Image
- **Size**: 1920x1080px (recommended)
- **Format**: JPG or PNG
- **Usage**: Landing page hero section background
- **Aspect Ratio**: 16:9 recommended

## Platform-Specific Considerations

### Web Platform
- Logos are displayed in the navigation bar
- Favicon appears in browser tabs
- Hero images are used on the landing page
- Theme colors affect the overall appearance

### Desktop Platform
- Window icons appear in the taskbar and window title bar
- System tray icons appear in the notification area
- Splash screen logos are shown during application startup
- Custom window titles are displayed in the title bar

## Implementation Examples

### Basic Logo Replacement

1. Place your logo files in the `public` directory
2. Update the configuration file or environment variables
3. Restart the application

### Custom Theme Colors

```json
{
  "theme": {
    "primaryColor": "#1e40af",
    "accentColor": "#3b82f6",
    "backgroundColor": "#f8fafc"
  }
}
```

### Complete Branding Package

```json
{
  "branding": {
    "appName": "EduCollab Pro",
    "windowTitle": "EduCollab Pro - Advanced Study Platform",
    "description": "Professional collaborative study platform for educational institutions",
    "assets": {
      "navbar": "/branding/educollab-navbar.svg",
      "window": "/branding/educollab-icon.ico",
      "tray": "/branding/educollab-tray.ico",
      "splash": "/branding/educollab-splash.png",
      "favicon": "/branding/educollab-favicon.ico",
      "hero": "/branding/educollab-hero.jpg"
    },
    "theme": {
      "primaryColor": "#059669",
      "accentColor": "#10b981",
      "backgroundColor": "#f0fdf4"
    }
  }
}
```

## Testing Your Configuration

1. **Web Testing**: Open your application in a browser and verify:
   - Logo appears in the navigation bar
   - Favicon shows in the browser tab
   - App name is displayed correctly
   - Theme colors are applied

2. **Desktop Testing**: Launch the desktop application and verify:
   - Window icon appears in the taskbar
   - System tray icon is visible
   - Splash screen shows your logo
   - Window title displays your custom title

## Troubleshooting

### Logo Not Displaying
- Check file paths are correct and accessible
- Ensure image files are in the correct format
- Verify file permissions allow reading
- Check browser console for loading errors

### Theme Colors Not Applied
- Ensure color values are valid hex codes
- Clear browser cache and restart application
- Check for CSS conflicts or overrides

### Desktop Icons Not Updating
- Restart the desktop application
- Clear Electron cache if necessary
- Ensure icon files are in the correct format for your OS

## Best Practices

1. **Consistency**: Use consistent branding across all logo types
2. **Scalability**: Provide high-resolution logos that scale well
3. **Accessibility**: Ensure logos work on both light and dark themes
4. **Performance**: Optimize image file sizes for faster loading
5. **Backup**: Keep backup copies of your original branding assets

## Support

For additional help with branding configuration, please refer to the main documentation or contact support.