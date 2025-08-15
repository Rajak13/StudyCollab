# Custom Branding Setup

## Quick Setup

1. **Add your images to the `public` folder:**
   ```
   public/
   ├── my-logo.png          # Your navbar logo (120x40px recommended)
   ├── my-icon.png          # Your window/favicon (32x32px)
   ├── my-hero-bg.jpg       # Hero background (1200x600px)
   ├── my-tray-icon.png     # System tray icon (16x16px)
   └── my-splash-logo.png   # Splash screen logo (200x200px)
   ```

2. **Configure your branding:**
   - Go to `/admin/branding` in your app
   - Update the image paths to point to your files
   - Customize app name and colors
   - Click "Save Changes"

3. **Your branding is now active!**

## Example Configuration

In the branding panel, set these paths:
- Navbar Logo: `/my-logo.png`
- Window Icon: `/my-icon.png`
- Hero Image: `/my-hero-bg.jpg`
- Tray Icon: `/my-tray-icon.png`
- Splash Logo: `/my-splash-logo.png`

## Tips

- Use PNG with transparent backgrounds for logos
- Optimize images for web (compress them)
- Test your branding on different screen sizes
- Keep consistent colors across all assets

For detailed instructions, see `docs/developer-branding-guide.md`