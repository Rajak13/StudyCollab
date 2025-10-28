'use client'

import { Button } from '@/components/ui/button'
import { clearBrandingCache } from '@/lib/clear-branding-cache'

export function ForceLogoUpdate() {
  const handleUpdateLogos = () => {
    if (confirm('This will update all logos to ELEVARE.svg and refresh the page. Continue?')) {
      clearBrandingCache()
    }
  }

  return (
    <Button 
      onClick={handleUpdateLogos}
      variant="outline"
      size="sm"
    >
      Update to ELEVARE Logos
    </Button>
  )
}