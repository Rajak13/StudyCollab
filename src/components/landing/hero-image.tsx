'use client'

import { LargeLogoDisplay } from '@/components/branding/large-logo-display'
import { useBranding } from '@/hooks/use-branding'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface HeroImageProps {
  width?: number
  height?: number
  className?: string
}

export function HeroImage({ width = 120, height = 120, className = '' }: HeroImageProps) {
  const { config } = useBranding()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing consistent content until mounted
  if (!mounted) {
    return (
      <div className={`animate-float ${className}`}>
        <LargeLogoDisplay type="hero" width={width} height={height} />
      </div>
    )
  }

  // Check if a custom hero image is configured
  const hasCustomHeroImage = config.assets.hero && config.assets.hero !== '/STUDY.svg'

  if (hasCustomHeroImage) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={config.assets.hero}
          alt="StudyCollab Hero"
          width={width}
          height={height}
          className="rounded-lg object-cover"
          priority
        />
      </div>
    )
  }

  // Fallback to the default logo display
  return (
    <div className={`animate-float ${className}`}>
      <LargeLogoDisplay type="hero" width={width} height={height} />
    </div>
  )
}