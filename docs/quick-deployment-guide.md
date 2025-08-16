# Quick Deployment Guide

## Current Status
- ✅ Web build is working locally
- ⚠️ Desktop release needs Node.js 20+ (currently using 18.20.8)
- ⚠️ GitHub Actions failing due to Node.js version

## Immediate Steps

### 1. Deploy Web App to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import from GitHub**: Select `Rajak13/StudyCollab`
4. **Configure Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rvosteyajdubiwvvhitu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b3N0ZXlhamR1Yml3dnZoaXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzYzNzQsImV4cCI6MjA2ODUxMjM3NH0.Pyby3MPmFWHNJ3ijLhZGwTD8DhCa1Ibd9L5iUMcrljI
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b3N0ZXlhamR1Yml3dnZoaXR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzNjM3NCwiZXhwIjoyMDY4NTEyMzc0fQ.mEORDzI8AiNXAUZicrfvzUBHI9-0ETDBJ9pJatGhRIk
   NEXT_PUBLIC_RELEASE_OWNER=Rajak13
   NEXT_PUBLIC_RELEASE_REPO=StudyCollab
   ```
5. **Deploy**

### 2. Fix Desktop Release Later

The desktop release is failing because:
- GitHub Actions runners use Node.js 18 by default
- Your packages require Node.js 20+

**Solution**: Update the GitHub Actions workflow to use Node.js 20.

## What Works Now

- ✅ Web application builds successfully
- ✅ Supabase integration working
- ✅ Download button configured (will redirect to GitHub releases)
- ✅ Environment variables properly set

## What Needs Fixing

- ⚠️ GitHub Actions workflow needs Node.js 20
- ⚠️ Desktop app build process needs optimization

## Next Steps

1. **Deploy web app to Vercel** (should work immediately)
2. **Test the web application**
3. **Fix GitHub Actions for desktop releases**
4. **Create first desktop release**

The web application is ready for production use right now!