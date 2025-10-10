// Download utilities for GitHub releases

// GitHub release configuration
const GITHUB_OWNER = process.env.NEXT_PUBLIC_RELEASE_OWNER || 'studycollab'
const GITHUB_REPO = process.env.NEXT_PUBLIC_RELEASE_REPO || 'studycollab-desktop'

// Supported platforms
export type Platform = 'windows' | 'mac' | 'linux'

const SUPPORTED_PLATFORMS: Platform[] = ['windows', 'mac', 'linux']

// Platform detection based on user agent
export function detectPlatform(userAgent: string): Platform {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('win')) {
    return 'windows'
  } else if (ua.includes('mac')) {
    return 'mac'
  } else if (ua.includes('linux')) {
    return 'linux'
  }
  
  // Default to windows if unable to detect
  return 'windows'
}

// Check if platform is supported
export function isPlatformSupported(platform: string): platform is Platform {
  return SUPPORTED_PLATFORMS.includes(platform as Platform)
}

// Get the latest release URL for a specific platform
export function getLatestReleaseRedirectUrl(platform: Platform): string {
  // For now, redirect to the general releases page
  // In a real implementation, you might want to fetch the latest release
  // and get the specific asset URL for the platform
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
}

// Get platform-specific file extensions
export function getPlatformFileExtension(platform: Platform): string {
  switch (platform) {
    case 'windows':
      return '.exe'
    case 'mac':
      return '.dmg'
    case 'linux':
      return '.AppImage'
    default:
      return ''
  }
}

// Get platform display name
export function getPlatformDisplayName(platform: Platform): string {
  switch (platform) {
    case 'windows':
      return 'Windows'
    case 'mac':
      return 'macOS'
    case 'linux':
      return 'Linux'
    default:
      return 'Unknown'
  }
}

// Get platform-specific download instructions
export function getDownloadInstructions(platform: Platform): string {
  switch (platform) {
    case 'windows':
      return 'Download and run the installer. Windows may show a security warning - click "More info" and "Run anyway".'
    case 'mac':
      return 'Download and open the DMG file, then drag StudyCollab to your Applications folder.'
    case 'linux':
      return 'Download the AppImage file, make it executable (chmod +x), and run it.'
    default:
      return 'Download and follow the installation instructions for your platform.'
  }
}

// Fetch latest release information from GitHub API
export async function fetchLatestRelease() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'StudyCollab-Web'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch latest release:', error)
    return null
  }
}

// Get direct download URL for a specific platform from release assets
export async function getDirectDownloadUrl(platform: Platform): Promise<string | null> {
  try {
    const release = await fetchLatestRelease()
    if (!release || !release.assets) {
      return null
    }
    
    const extension = getPlatformFileExtension(platform)
    const asset = release.assets.find((asset: any) => 
      asset.name.toLowerCase().includes(platform) || 
      asset.name.endsWith(extension)
    )
    
    return asset ? asset.browser_download_url : null
  } catch (error) {
    console.error('Failed to get direct download URL:', error)
    return null
  }
}