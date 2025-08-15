# StudyCollab Desktop Release Setup Guide

This guide will help you set up automated releases for the StudyCollab desktop app.

## Prerequisites

1. Your code is pushed to GitHub at `https://github.com/Rajak13/StudyCollab`
2. You have admin access to the repository
3. The environment variables are configured correctly

## Step 1: Enable GitHub Actions

1. Go to your GitHub repository: `https://github.com/Rajak13/StudyCollab`
2. Click on the **Actions** tab
3. If Actions are disabled, click **"I understand my workflows, go ahead and enable them"**

## Step 2: Set up Repository Secrets (Optional but Recommended)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets for better functionality:
   - `GITHUB_TOKEN` (usually auto-provided by GitHub)

## Step 3: Create Your First Release

### Option A: Manual Release (Recommended for first release)

1. **Build the desktop app locally first to test:**
   ```bash
   cd studycollab-mvp
   npm run build
   npm run electron:build
   npm run electron:dist
   ```

2. **Create a Git tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **The GitHub Action will automatically:**
   - Build the app for Windows, macOS, and Linux
   - Create installers (.exe, .dmg, .AppImage)
   - Create a GitHub release with all the files
   - Make them available for download

### Option B: Manual Workflow Trigger

1. Go to **Actions** tab in your GitHub repository
2. Click on **"Build and Release Desktop App"**
3. Click **"Run workflow"**
4. Enter version (e.g., `v1.0.0`)
5. Click **"Run workflow"**

## Step 4: Verify the Release

1. Go to **Releases** tab in your GitHub repository
2. You should see your new release with downloadable files:
   - `StudyCollab-Setup-Windows.exe` (Windows installer)
   - `StudyCollab-macOS.dmg` (macOS disk image)
   - `StudyCollab-Linux.AppImage` (Linux universal app)

## Step 5: Test the Download Button

1. Deploy your updated code to Vercel (with the new environment variables)
2. Visit your live site
3. Click the "Download Desktop App" button
4. It should now redirect to your GitHub releases and download the appropriate file

## Troubleshooting

### Build Fails
- Check the Actions logs for specific errors
- Ensure all dependencies are properly listed in package.json
- Make sure the build scripts work locally first

### No Files in Release
- Check if the build artifacts are being created in the `release/` directory
- Verify the GitHub Action has proper permissions

### Download Button Still Not Working
- Ensure environment variables are set in both local `.env.local` and Vercel
- Check that the repository name matches exactly: `Rajak13/StudyCollab`
- Verify the release exists and has assets

## Environment Variables Needed

### Local Development (.env.local)
```
NEXT_PUBLIC_RELEASE_OWNER=Rajak13
NEXT_PUBLIC_RELEASE_REPO=StudyCollab
```

### Vercel Deployment
Add the same environment variables in your Vercel project settings.

## Next Steps

1. Create your first release using the steps above
2. Update your Vercel deployment with the new environment variables
3. Test the download functionality
4. Set up automatic releases for future versions by creating tags

## Future Releases

For subsequent releases, simply create and push a new tag:
```bash
git tag v1.1.0
git push origin v1.1.0
```

The GitHub Action will automatically build and release the new version.