// Helper to detect platform from user-agent
export function detectPlatform(userAgent: string): 'windows' | 'mac' | 'linux' | 'unknown' {
  const ua = userAgent || '';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  if (/Linux/i.test(ua)) return 'linux';
  return 'unknown';
}

// Build a GitHub latest release URL that filters by asset name containing a keyword
export function getLatestReleaseRedirectUrl(platform: 'windows' | 'mac' | 'linux'): string {
  // Customize owner/repo if different
  const owner = process.env.NEXT_PUBLIC_RELEASE_OWNER || 'studycollab';
  const repo = process.env.NEXT_PUBLIC_RELEASE_REPO || 'studycollab-desktop';

  // electron-builder default names; adjust if your CI renames these
  const assetKeyword = platform === 'windows' ? 'Setup' : platform === 'mac' ? '.dmg' : 'AppImage';
  // Use GitHub releases latest redirect; user will land on the page, or if we have asset name we can use downloads/latest
  // We cannot guarantee an exact file name here; so we redirect to the latest page.
  return `https://github.com/${owner}/${repo}/releases/latest`;
}


