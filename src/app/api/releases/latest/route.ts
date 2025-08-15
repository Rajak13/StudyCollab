import { NextRequest } from 'next/server';

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: GitHubAsset[];
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
  files: Array<{
    url: string;
    sha512?: string;
    size: number;
  }>;
  path?: string;
  sha512?: string;
}

export async function GET(request: NextRequest) {
  const owner = process.env.NEXT_PUBLIC_RELEASE_OWNER || 'studycollab';
  const repo = process.env.NEXT_PUBLIC_RELEASE_REPO || 'studycollab-desktop';

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'StudyCollab-Auto-Updater'
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
    
    const release: GitHubRelease = await res.json();
    
    // Filter out draft and prerelease versions for stable updates
    if (release.draft || release.prerelease) {
      return new Response(JSON.stringify({ message: 'No stable release available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert GitHub release to electron-updater format
    const updateInfo: UpdateInfo = {
      version: release.tag_name.replace(/^v/, ''), // Remove 'v' prefix if present
      releaseDate: release.published_at,
      releaseName: release.name,
      releaseNotes: release.body,
      files: release.assets.map(asset => ({
        url: asset.browser_download_url,
        size: asset.size,
        // Note: GitHub doesn't provide SHA512, would need to be computed during build
      }))
    };

    // Find the main installer file for the path field (electron-updater expects this)
    const mainAsset = release.assets.find(asset => 
      asset.name.toLowerCase().includes('setup') && asset.name.toLowerCase().endsWith('.exe')
    ) || release.assets.find(asset => 
      asset.name.toLowerCase().endsWith('.exe')
    );

    if (mainAsset) {
      updateInfo.path = mainAsset.browser_download_url;
    }

    return new Response(JSON.stringify(updateInfo), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Releases API error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch release information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle version checking for specific versions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentVersion } = body;
    
    // Get latest release info
    const latestResponse = await GET(request);
    const latestData = await latestResponse.json();
    
    if (latestResponse.status !== 200) {
      return latestResponse;
    }
    
    // Compare versions (simple string comparison, could be enhanced with semver)
    const isUpdateAvailable = latestData.version !== currentVersion;
    
    return new Response(JSON.stringify({
      ...latestData,
      updateAvailable: isUpdateAvailable,
      currentVersion
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Version check error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to check version',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}