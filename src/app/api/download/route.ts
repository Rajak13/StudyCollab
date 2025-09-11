import { detectPlatform, getLatestReleaseRedirectUrl, isPlatformSupported } from '@/lib/downloads'
import { NextRequest, NextResponse } from 'next/server'

// GitHub release configuration
const GITHUB_OWNER = process.env.NEXT_PUBLIC_RELEASE_OWNER || 'studycollab'
const GITHUB_REPO = process.env.NEXT_PUBLIC_RELEASE_REPO || 'studycollab-desktop'

// Download analytics storage (in production, use a proper database)
const downloadAnalytics: Array<{
  timestamp: string
  platform: string
  userAgent: string
  ip?: string
  country?: string
}> = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedPlatform = searchParams.get('platform')
    const userAgent = request.headers.get('user-agent') || ''
    
    // Detect platform if not specified
    const detectedPlatform = detectPlatform(userAgent)
    const targetPlatform = requestedPlatform || detectedPlatform
    
    // Validate platform
    if (!isPlatformSupported(targetPlatform)) {
      return NextResponse.json(
        { error: 'Unsupported platform', platform: targetPlatform },
        { status: 400 }
      )
    }

    // Log download attempt for analytics
    const analyticsEntry = {
      timestamp: new Date().toISOString(),
      platform: targetPlatform,
      userAgent,
      ip: request.ip || 'unknown',
      country: request.geo?.country || 'unknown'
    }
    downloadAnalytics.push(analyticsEntry)

    // Get the latest release URL from GitHub
    const releaseUrl = getLatestReleaseRedirectUrl(targetPlatform as 'windows' | 'mac' | 'linux')
    
    // Redirect to GitHub releases page
    return NextResponse.redirect(releaseUrl, 302)
    
  } catch (error) {
    console.error('Download API error:', error)
    
    // Fallback to GitHub releases page
    const fallbackUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    return NextResponse.redirect(fallbackUrl, 302)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, userAgent, platformInfo, timestamp } = body
    
    // Store analytics data
    const analyticsEntry = {
      timestamp: timestamp || new Date().toISOString(),
      platform,
      userAgent,
      platformInfo,
      ip: request.ip || 'unknown',
      country: request.geo?.country || 'unknown'
    }
    
    downloadAnalytics.push(analyticsEntry)
    
    // In production, you would store this in a database
    console.log('Download analytics:', analyticsEntry)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Analytics logging error:', error)
    return NextResponse.json(
      { error: 'Failed to log analytics' },
      { status: 500 }
    )
  }
}

// Analytics endpoint for admin dashboard
export async function OPTIONS(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'analytics') {
    // Return download analytics (in production, implement proper authentication)
    const stats = {
      totalDownloads: downloadAnalytics.length,
      platformBreakdown: downloadAnalytics.reduce((acc, entry) => {
        acc[entry.platform] = (acc[entry.platform] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentDownloads: downloadAnalytics.slice(-10),
      dailyStats: getDailyStats()
    }
    
    return NextResponse.json(stats)
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

function getDailyStats() {
  const today = new Date().toISOString().split('T')[0]
  const todayDownloads = downloadAnalytics.filter(entry => 
    entry.timestamp.startsWith(today)
  )
  
  return {
    today: todayDownloads.length,
    platforms: todayDownloads.reduce((acc, entry) => {
      acc[entry.platform] = (acc[entry.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}