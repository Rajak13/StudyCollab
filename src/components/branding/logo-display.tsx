/**
 * Logo Display Component
 * Shows the appropriate logo based on branding configuration
 */

'use client'

import { useBranding } from '@/hooks/use-branding'
import { BrandingConfig } from '@/lib/branding'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface LogoDisplayProps {
  type: keyof BrandingConfig['assets']
  className?: string
  width?: number
  height?: number
  alt?: string
  fallback?: React.ReactNode
}

export function LogoDisplay({ 
  type, 
  className = '', 
  width = 32, 
  height = 32, 
  alt,
  fallback
}: LogoDisplayProps) {
  const { config, loading, isClient } = useBranding()
  const [imageError, setImageError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImageError = () => {
    setImageError(true)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !isClient) {
    return (
      <div 
        className={cn("animate-pulse bg-muted rounded", className)}
        style={{ width, height }}
      />
    )
  }

  if (loading) {
    return (
      <div 
        className={cn("animate-pulse bg-muted rounded", className)}
        style={{ width, height }}
      />
    )
  }

  const logoPath = config.assets[type]

  if (!logoPath || imageError) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div 
        className={cn("bg-primary text-primary-foreground rounded flex items-center justify-center font-bold", className)}
        style={{ width, height }}
      >
        <span className="text-xs">
          {config.appName?.charAt(0) || 'S'}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={logoPath}
      alt={alt || `${config.appName || 'StudyCollab'} ${type} logo`}
      width={width}
      height={height}
      className={cn("object-contain", className)}
      onError={handleImageError}
    />
  )
}