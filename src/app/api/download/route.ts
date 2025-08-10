import { detectPlatform } from '@/lib/downloads';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const platform = detectPlatform(userAgent);
  const owner = process.env.NEXT_PUBLIC_RELEASE_OWNER || 'studycollab';
  const repo = process.env.NEXT_PUBLIC_RELEASE_REPO || 'studycollab-desktop';

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers: { 'Accept': 'application/vnd.github+json' },
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error('Failed to fetch latest release');
    const data = await res.json() as { assets?: Array<{ name: string; browser_download_url: string }>; html_url?: string };
    const assets = data.assets || [];

    const pick = () => {
      if (platform === 'windows') {
        return assets.find(a => a.name.toLowerCase().endsWith('.exe') && a.name.toLowerCase().includes('setup'))
            || assets.find(a => a.name.toLowerCase().endsWith('.exe'));
      }
      if (platform === 'mac') {
        return assets.find(a => a.name.toLowerCase().endsWith('.dmg'))
            || assets.find(a => a.name.toLowerCase().endsWith('.zip'));
      }
      if (platform === 'linux') {
        return assets.find(a => a.name.toLowerCase().includes('appimage'))
            || assets.find(a => a.name.toLowerCase().endsWith('.deb'))
            || assets.find(a => a.name.toLowerCase().endsWith('.rpm'));
      }
      return undefined;
    };

    const asset = pick();
    const redirectUrl = asset?.browser_download_url || data.html_url || `https://github.com/${owner}/${repo}/releases/latest`;

    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl, 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response(null, {
      status: 302,
      headers: { Location: `https://github.com/${owner}/${repo}/releases/latest`, 'Cache-Control': 'no-store' },
    });
  }
}


