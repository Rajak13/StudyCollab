# StudyCollab Build and Deploy Guide

## Current Status ✅

Your build is now working! The issues have been resolved:

- ✅ Node.js version compatibility (you have v20.15.0)
- ✅ Missing API routes created
- ✅ Supabase configuration handles missing env vars gracefully
- ✅ Build process works with fallback values

## Next Steps

### 1. Deploy to Vercel

1. **Push your changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix build issues and add release functionality"
   git push origin main
   ```

2. **Set up environment variables in Vercel:**
   - Go to your Vercel project settings
   - Add these environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://rvosteyajdubiwvvhitu.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b3N0ZXlhamR1Yml3dnZoaXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzYzNzQsImV4cCI6MjA2ODUxMjM3NH0.Pyby3MPmFWHNJ3ijLhZGwTD8DhCa1Ibd9L5iUMcrljI
     NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b3N0ZXlhamR1Yml3dnZoaXR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzNjM3NCwiZXhwIjoyMDY4NTEyMzc0fQ.mEORDzI8AiNXAUZicrfvzUBHI9-0ETDBJ9pJatGhRIk
     NEXT_PUBLIC_RELEASE_OWNER=Rajak13
     NEXT_PUBLIC_RELEASE_REPO=StudyCollab
     ```

3. **Deploy will happen automatically** when you push to GitHub

### 2. Create Your First Desktop App Release

1. **Run the release creation script:**
   ```bash
   npm run create-release
   ```

2. **Or manually create a release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Monitor the build:**
   - Go to https://github.com/Rajak13/StudyCollab/actions
   - Watch the "Build and Release Desktop App" workflow
   - It will take 10-15 minutes to complete

4. **Check the release:**
   - Go to https://github.com/Rajak13/StudyCollab/releases
   - You should see your new release with downloadable files

### 3. Test the Download Button

Once you have:
- ✅ Deployed to Vercel with environment variables
- ✅ Created a GitHub release with desktop app files

The download button will:
- Detect the user's operating system
- Download the appropriate installer (.exe for Windows, .dmg for macOS, .AppImage for Linux)

## Current Download Button Behavior

Right now, the download button redirects to your GitHub releases page. Once you create your first release, it will automatically download the correct file.

## Troubleshooting

### Build Issues
- ✅ **Fixed**: Node.js version compatibility
- ✅ **Fixed**: Missing environment variables
- ✅ **Fixed**: Supabase configuration errors

### If GitHub Actions Fail
1. Check the Actions tab for error logs
2. Ensure you have the workflow file in `.github/workflows/build-and-release.yml`
3. Make sure the repository has Actions enabled

### If Download Button Doesn't Work
1. Verify you have created at least one release
2. Check that the release has asset files (.exe, .dmg, .AppImage)
3. Ensure environment variables are set in Vercel

## Commands Reference

```bash
# Check Node.js version
npm run check-node

# Build the project
npm run build

# Create a release
npm run create-release

# Build desktop app locally (for testing)
npm run electron:build
npm run electron:dist

# Run development server
npm run dev

# Run Electron in development
npm run electron:dev
```

## What's Working Now

- ✅ Web application builds successfully
- ✅ Environment variables handled gracefully
- ✅ Download functionality implemented
- ✅ GitHub Actions workflow configured
- ✅ Release creation scripts ready

## What You Need to Do

1. **Deploy to Vercel** with proper environment variables
2. **Create your first release** using `npm run create-release`
3. **Test the download button** once the release is created

The hard work is done - now it's just a matter of deploying and creating your first release!