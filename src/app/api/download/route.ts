import { detectPlatform } from '@/lib/downloads';
import { NextRequest } from 'next/server';

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
  created_at: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: GitHubAsset[];
  html_url: string;
  published_at: string;
}

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const platform = detectPlatform(userAgent);
  const owner = process.env.NEXT_PUBLIC_RELEASE_OWNER || 'studycollab';
  const repo = process.env.NEXT_PUBLIC_RELEASE_REPO || 'studycollab-desktop';
  
  // Get specific platform from query params if provided
  const { searchParams } = new URL(request.url);
  const requestedPlatform = searchParams.get('platform') as 'windows' | 'mac' | 'linux' | null;
  const finalPlatform = requestedPlatform || platform;

  try {
    // Add GitHub token if available for higher rate limits
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'StudyCollab-Desktop-Downloader'
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json() as GitHubRelease;
    const assets = data.assets || [];

    const selectAsset = (platform: string): GitHubAsset | undefined => {
      switch (platform) {
        case 'windows':
          // Prefer NSIS installer over portable
          return assets.find(a => 
            a.name.toLowerCase().includes('setup') && a.name.toLowerCase().endsWith('.exe')
          ) || assets.find(a => a.name.toLowerCase().endsWith('.exe'));
          
        case 'mac':
          // Prefer DMG over ZIP
          return assets.find(a => a.name.toLowerCase().endsWith('.dmg'))
            || assets.find(a => a.name.toLowerCase().endsWith('.zip') && a.name.toLowerCase().includes('mac'));
            
        case 'linux':
          // Prefer AppImage for universal compatibility
          return assets.find(a => a.name.toLowerCase().includes('appimage'))
            || assets.find(a => a.name.toLowerCase().endsWith('.deb'))
            || assets.find(a => a.name.toLowerCase().endsWith('.rpm'));
            
        default:
          return undefined;
      }
    };

    const asset = selectAsset(finalPlatform);
    
    if (!asset) {
      // If no specific asset found, redirect to releases page
      return new Response(null, {
        status: 302,
        headers: { 
          Location: data.html_url || `https://github.com/${owner}/${repo}/releases/latest`,
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
      });
    }

    // Log download attempt for analytics
    console.log(`Download requested: ${asset.name} for ${finalPlatform} platform`);

    // Redirect to the asset download URL
    return new Response(null, {
      status: 302,
      headers: { 
        Location: asset.browser_download_url,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Download-Platform': finalPlatform,
        'X-Download-Asset': asset.name,
        'X-Download-Size': asset.size.toString()
      },
    });
    
  } catch (error) {
    console.error('Download API error:', error);
    
    // Fallback to GitHub releases page
    const fallbackUrl = `https://github.com/${owner}/${repo}/releases/latest`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        Location: fallbackUrl,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
    });
  }
}

// Handle POST requests for download analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, version, userAgent } = body;
    
    // Log download completion for analytics
    console.log('Download completed:', {
      platform,
      version,
      userAgent,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Download analytics error:', error);
    return new Response(JSON.stringify({ error: 'Failed to log download' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


