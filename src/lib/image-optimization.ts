import React from 'react'

/**
 * Image optimization utilities for better performance
 */

interface ImageOptimizationOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'webp' | 'jpeg' | 'png'
}

/**
 * Optimize image file before upload
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Failed to optimize image'))
          }
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate responsive image srcSet for different screen sizes
 */
export function generateSrcSet(baseUrl: string, sizes: number[] = [320, 640, 1024, 1920]): string {
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(', ')
}

/**
 * Lazy loading intersection observer for images
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null
  private images: Set<HTMLImageElement> = new Set()

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              this.loadImage(img)
            }
          })
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before image enters viewport
          threshold: 0.01,
        }
      )
    }
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.images.add(img)
      this.observer.observe(img)
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img)
    }
  }

  unobserve(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.unobserve(img)
      this.images.delete(img)
    }
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    if (src) {
      img.src = src
      img.removeAttribute('data-src')
      
      // Add fade-in effect
      img.style.opacity = '0'
      img.style.transition = 'opacity 0.3s ease-in-out'
      
      img.onload = () => {
        img.style.opacity = '1'
        if (this.observer) {
          this.observer.unobserve(img)
        }
        this.images.delete(img)
      }
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.images.clear()
  }
}

// Singleton instance
export const lazyImageLoader = new LazyImageLoader()

/**
 * React hook for lazy loading images
 */
export function useLazyImage(ref: React.RefObject<HTMLImageElement>) {
  React.useEffect(() => {
    const img = ref.current
    if (img) {
      lazyImageLoader.observe(img)
      
      return () => {
        lazyImageLoader.unobserve(img)
      }
    }
  }, [ref])
}