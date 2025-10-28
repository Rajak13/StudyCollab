'use client'

import { autoUpdateBrandingToElevare } from '@/lib/clear-branding-cache'
import { useEffect } from 'react'

export function BrandingUpdater() {
  useEffect(() => {
    // Auto-update branding to use ELEVARE.svg on first load
    autoUpdateBrandingToElevare()
  }, [])

  return null
}