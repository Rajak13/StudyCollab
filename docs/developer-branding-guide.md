# Developer Branding Guide

This guide explains how to customize the branding of your StudyCollab instance as a developer.

## Quick Start

1. **Access the Branding Configuration**
   - Navigate to `/admin/branding` in your application
   - This page allows you to customize logos, app name, and colors

2. **Add Your Custom Images**
   - Place your image files in the `studycollab-mvp/public` folder
   - Supported formats: PNG, JPG, SVG
   - Recommended sizes:
     - Navbar logo: 120x40px
     - Window icon: 32x32px or 64x64px
     - Hero image: 1200x600px

3. **Update Image Paths**
   - In the branding configuration, update the paths to point to your images
   - Example: `/my-logo.png` for a file at `public/my-logo.png`

4. **Save Changes**
   - Click "Save Changes" to apply your branding
   - Changes are saved to localStorage and will persist

## Image Types

### Navbar Logo
- **Purpose**: Displayed in the navigation bar
- **Recommended size**: 120x40px
- **Format**: PNG with transparent background preferred

### Window Icon
- **Purpose**: Used for browser tab favicon and desktop app icon
- **Recommended size**: 32x32px, 64x64px, or 128x128px
- **Format**: ICO or PNG

### Hero Image
- **Purpose**: Background image for landing page hero section
- **Recommended size**: 1200x600px or larger
- **Format**: JPG or PNG

### System Tray Icon
- **Purpose**: Icon shown in system tray (desktop app)
- **Recommended size**: 16x16px or 32x32px
- **Format**: PNG with transparent background

### Splash Screen Logo
- **Purpose**: Shown during app loading
- **Recommended size**: 200x200px
- **Format**: PNG with transparent background

## Customization Options

### App Name
- Changes the application name throughout the interface
- Also updates the window title

### Theme Colors
- **Primary Color**: Main brand color used for buttons and highlights
- **Accent Color**: Secondary color for accents and hover states
- **Background Color**: Default background color

## File Structure

```
studycollab-mvp/
├── public/
│   ├── your-logo.png          # Your navbar logo
│   ├── your-icon.png          # Your window icon
│   ├── your-hero-image.jpg    # Your hero background
│   └── ...
├── src/
│   ├── components/branding/
│   │   ├── logo-display.tsx   # Component for displaying logos
│   │   └── branding-config-panel.tsx
│   ├── lib/
│   │   └── branding.ts        # Branding configuration system
│   └── hooks/
│       └── use-branding.ts    # React hook for branding
└── docs/
    └── developer-branding-guide.md
```

## Using Logos in Components

To display your custom logos in components, use the `LogoDisplay` component:

```tsx
import { LogoDisplay } from '@/components/branding/logo-display'

// Display navbar logo
<LogoDisplay type="navbar" width={120} height={40} />

// Display with fallback
<LogoDisplay 
  type="navbar" 
  width={120} 
  height={40}
  fallback={<div>My App</div>}
/>
```

## Programmatic Access

You can also access branding configuration programmatically:

```tsx
import { useBranding } from '@/hooks/use-branding'

function MyComponent() {
  const { config } = useBranding()
  
  return (
    <div>
      <h1>{config.appName}</h1>
      <img src={config.assets.navbar} alt="Logo" />
    </div>
  )
}
```

## Reset to Defaults

If you want to reset all branding to defaults:
1. Go to `/admin/branding`
2. Click "Reset to Defaults"
3. All customizations will be removed

## Tips

1. **Image Optimization**: Optimize your images for web to improve loading times
2. **Consistent Branding**: Use consistent colors and styling across all assets
3. **Test Different Sizes**: Test your logos at different screen sizes
4. **Backup Configuration**: The branding configuration is saved to localStorage, consider backing it up

## Troubleshooting

### Images Not Showing
- Check that the image file exists in the `public` folder
- Verify the path starts with `/` (e.g., `/my-logo.png`)
- Check browser console for 404 errors

### Changes Not Saving
- Check browser console for JavaScript errors
- Ensure localStorage is enabled in your browser
- Try refreshing the page and making changes again

### Logo Too Large/Small
- Adjust the width and height in the branding configuration
- Consider creating multiple sizes of your logo for different use cases