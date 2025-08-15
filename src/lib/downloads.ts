// Helper to detect platform from user-agent
export function detectPlatform(userAgent: string): 'windows' | 'mac' | 'linux' | 'unknown' {
  const ua = userAgent || '';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  if (/Linux/i.test(ua)) return 'linux';
  return 'unknown';
}

// Get detailed platform information
export function getDetailedPlatformInfo(userAgent: string) {
  const platform = detectPlatform(userAgent);
  const ua = userAgent || '';
  
  let arch = 'unknown';
  let version = 'unknown';
  
  if (platform === 'windows') {
    // Detect Windows architecture
    if (/WOW64|Win64|x64/i.test(ua)) {
      arch = 'x64';
    } else if (/Win32/i.test(ua)) {
      arch = 'ia32';
    }
    
    // Detect Windows version
    const winVersionMatch = ua.match(/Windows NT (\d+\.\d+)/);
    if (winVersionMatch) {
      const ntVersion = parseFloat(winVersionMatch[1]);
      if (ntVersion >= 10.0) version = '10+';
      else if (ntVersion >= 6.3) version = '8.1';
      else if (ntVersion >= 6.2) version = '8';
      else if (ntVersion >= 6.1) version = '7';
    }
  } else if (platform === 'mac') {
    // Detect macOS version
    const macVersionMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    if (macVersionMatch) {
      version = macVersionMatch[1].replace(/_/g, '.');
    }
    
    // Detect Mac architecture (limited detection from user agent)
    if (/Intel/i.test(ua)) {
      arch = 'x64';
    } else if (/PPC/i.test(ua)) {
      arch = 'ppc';
    }
  } else if (platform === 'linux') {
    // Detect Linux architecture
    if (/x86_64|amd64/i.test(ua)) {
      arch = 'x64';
    } else if (/i[3-6]86/i.test(ua)) {
      arch = 'ia32';
    } else if (/arm/i.test(ua)) {
      arch = 'arm';
    }
  }
  
  return {
    platform,
    arch,
    version,
    userAgent: ua
  };
}

// Build a GitHub latest release URL that filters by asset name containing a keyword
export function getLatestReleaseRedirectUrl(platform: 'windows' | 'mac' | 'linux'): string {
  const owner = process.env.NEXT_PUBLIC_RELEASE_OWNER || 'studycollab';
  const repo = process.env.NEXT_PUBLIC_RELEASE_REPO || 'studycollab-desktop';
  return `https://github.com/${owner}/${repo}/releases/latest`;
}

// Get recommended installer type for platform
export function getRecommendedInstaller(platform: 'windows' | 'mac' | 'linux') {
  switch (platform) {
    case 'windows':
      return {
        type: 'nsis',
        extension: '.exe',
        description: 'Windows Installer (Recommended)',
        keywords: ['setup', 'installer']
      };
    case 'mac':
      return {
        type: 'dmg',
        extension: '.dmg',
        description: 'macOS Disk Image (Recommended)',
        keywords: ['dmg']
      };
    case 'linux':
      return {
        type: 'appimage',
        extension: '.AppImage',
        description: 'Universal Linux App (Recommended)',
        keywords: ['appimage']
      };
    default:
      return null;
  }
}

// Check if platform is supported
export function isPlatformSupported(platform: string): boolean {
  return ['windows', 'mac', 'linux'].includes(platform);
}

// Get download URL with platform parameter
export function getDownloadUrl(platform?: string): string {
  const baseUrl = '/api/download';
  return platform ? `${baseUrl}?platform=${platform}` : baseUrl;
}

// Client-side download trigger with analytics
export async function triggerDownload(customPlatform?: string) {
  try {
    const userAgent = navigator.userAgent;
    const platformInfo = getDetailedPlatformInfo(userAgent);
    const targetPlatform = customPlatform || platformInfo.platform;
    
    if (!isPlatformSupported(targetPlatform)) {
      throw new Error(`Platform ${targetPlatform} is not supported`);
    }
    
    // Trigger download
    const downloadUrl = getDownloadUrl(targetPlatform);
    window.location.href = downloadUrl;
    
    // Log analytics (fire and forget)
    fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: targetPlatform,
        userAgent,
        platformInfo,
        timestamp: new Date().toISOString()
      })
    }).catch(console.error);
    
    return true;
  } catch (error) {
    console.error('Download trigger error:', error);
    
    // Fallback to GitHub releases page
    window.open(getLatestReleaseRedirectUrl('windows'), '_blank');
    return false;
  }
}


