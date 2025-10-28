/**
 * Utility to clear branding cache and force reload of new logos
 */

export function clearBrandingCache() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Clear the branding configuration cache
      localStorage.removeItem('branding-config')
      
      // Force a page reload to pick up new configuration
      window.location.reload()
    } catch (error) {
      console.warn('Failed to clear branding cache:', error)
    }
  }
}

// Auto-clear cache if ELEVARE.svg is detected as the new default
export function autoUpdateBrandingToElevare() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const currentConfig = localStorage.getItem('branding-config')
      if (currentConfig) {
        const config = JSON.parse(currentConfig)
        
        // Check if we're still using old logos
        const hasOldLogos = config.branding?.assets?.navbar?.includes('STUDY.svg') ||
                           config.branding?.assets?.navbar?.includes('logo.png') ||
                           config.branding?.assets?.favicon?.includes('favicon.ico')
        
        if (hasOldLogos) {
          // Update to ELEVARE.svg
          config.branding.assets = {
            navbar: '/ELEVARE.svg',
            favicon: '/ELEVARE.svg',
            hero: '/ELEVARE.svg',
            window: '/ELEVARE.svg',
            tray: '/ELEVARE.svg',
            splash: '/ELEVARE.svg'
          }
          
          // Update theme colors to match ELEVARE branding
          config.branding.theme = {
            primaryColor: '#667eea',
            accentColor: '#764ba2',
            backgroundColor: '#ffffff'
          }
          
          localStorage.setItem('branding-config', JSON.stringify(config))
          window.location.reload()
        }
      }
    } catch (error) {
      console.warn('Failed to auto-update branding:', error)
    }
  }
}