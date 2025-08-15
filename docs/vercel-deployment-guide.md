# Vercel Deployment Guide for StudyCollab

## Setting Up Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your StudyCollab project
3. Click on the project name
4. Go to **Settings** → **Environment Variables**
5. Add these variables:

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://rvosteyajdubiwvvhitu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b3N0ZXlhamR1Yml3dnZoaXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzYzNzQsImV4cCI6MjA2ODUxMjM3NH0.Pyby3MPmFWHNJ3ijLhZGwTD8DhCa1Ibd9L5iUMcrljI
NEXT_PUBLIC_SITE_URL=https://your-vercel-app-url.vercel.app
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b3N0ZXlhamR1Yml3dnZoaXR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzNjM3NCwiZXhwIjoyMDY4NTEyMzc0fQ.mEORDzI8AiNXAUZicrfvzUBHI9-0ETDBJ9pJatGhRIk

# For Desktop App Downloads
NEXT_PUBLIC_RELEASE_OWNER=Rajak13
NEXT_PUBLIC_RELEASE_REPO=StudyCollab
```

### Optional (for better GitHub API rate limits)
```
GITHUB_TOKEN=your_github_personal_access_token
```

## Steps to Deploy

1. **Push your code to GitHub** (if not already done)
2. **Connect Vercel to your GitHub repository**
3. **Add environment variables** (as shown above)
4. **Deploy**

## After Deployment

1. Update `NEXT_PUBLIC_SITE_URL` with your actual Vercel URL
2. Test the application
3. Create your first desktop app release using the guide in `release-setup-guide.md`

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Make sure there are no TypeScript errors

### Download Button Not Working
- Ensure you have created at least one release in GitHub
- Check that environment variables `NEXT_PUBLIC_RELEASE_OWNER` and `NEXT_PUBLIC_RELEASE_REPO` are correct
- Verify the release has downloadable assets (.exe, .dmg, .AppImage files)