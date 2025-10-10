'use client'

import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring'
import { createLowMemoryQueryClient } from '@/lib/query-client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect, useMemo, useState } from 'react'

interface PerformanceOptimizedLayoutProps {
  children: ReactNode
  fallback?: ReactNode
}

export function PerformanceOptimizedLayout({ 
  children, 
  fallback 
}: PerformanceOptimizedLayoutProps) {
  const {
    memoryPressure,
    batteryMode,
    startMonitoring,
    markPerformance,
    measurePerformance,
  } = usePerformanceMonitoring()

  const [isOptimized, setIsOptimized] = useState(false)
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null)

  // Create optimized query client based on performance conditions
  const optimizedQueryClient = useMemo(() => {
    if (memoryPressure || batteryMode) {
      return createLowMemoryQueryClient()
    }
    return null
  }, [memoryPressure, batteryMode])

  // Initialize performance monitoring
  useEffect(() => {
    markPerformance('layout-mount')
    startMonitoring()
    
    return () => {
      markPerformance('layout-unmount')
      measurePerformance('layout-lifecycle', 'layout-mount', 'layout-unmount')
    }
  }, [startMonitoring, markPerformance, measurePerformance])

  // Handle performance optimization
  useEffect(() => {
    if (memoryPressure || batteryMode) {
      if (!isOptimized) {
        markPerformance('optimization-start')
        setIsOptimized(true)
        
        // Switch to optimized query client
        if (optimizedQueryClient) {
          setQueryClient(optimizedQueryClient)
        }
        
        // Reduce animation and transitions
        document.documentElement.style.setProperty('--animation-duration', '0.1s')
        document.documentElement.style.setProperty('--transition-duration', '0.1s')
        
        // Add performance optimization class
        document.body.classList.add('performance-optimized')
        
        markPerformance('optimization-end')
        measurePerformance('optimization', 'optimization-start', 'optimization-end')
        
        console.log('Performance optimization enabled')
      }
    } else {
      if (isOptimized) {
        setIsOptimized(false)
        setQueryClient(null)
        
        // Restore normal animation and transitions
        document.documentElement.style.removeProperty('--animation-duration')
        document.documentElement.style.removeProperty('--transition-duration')
        
        // Remove performance optimization class
        document.body.classList.remove('performance-optimized')
        
        console.log('Performance optimization disabled')
      }
    }
  }, [memoryPressure, batteryMode, isOptimized, optimizedQueryClient, markPerformance, measurePerformance])

  // Add performance optimization styles
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'performance-optimization-styles'
    style.textContent = `
      .performance-optimized * {
        animation-duration: var(--animation-duration, 0.1s) !important;
        transition-duration: var(--transition-duration, 0.1s) !important;
      }
      
      .performance-optimized .animate-spin {
        animation-duration: 0.5s !important;
      }
      
      .performance-optimized .animate-pulse {
        animation-duration: 1s !important;
      }
      
      .performance-optimized .animate-bounce {
        animation: none !important;
      }
      
      .performance-optimized img {
        image-rendering: optimizeSpeed;
      }
      
      .performance-optimized video {
        will-change: auto;
      }
      
      .performance-optimized .blur {
        filter: none !important;
      }
      
      .performance-optimized .backdrop-blur {
        backdrop-filter: none !important;
      }
      
      .performance-optimized .shadow-lg,
      .performance-optimized .shadow-xl,
      .performance-optimized .shadow-2xl {
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
      }
    `
    
    document.head.appendChild(style)
    
    return () => {
      const existingStyle = document.getElementById('performance-optimization-styles')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  // Show fallback during optimization
  if (isOptimized && fallback) {
    return <>{fallback}</>
  }

  // Wrap with optimized query client if available
  if (queryClient) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="performance-optimized-container">
          {children}
        </div>
      </QueryClientProvider>
    )
  }

  return (
    <div className="performance-container">
      {children}
    </div>
  )
}

// Performance-aware component wrapper
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    priority?: 'low' | 'normal' | 'high'
    lazy?: boolean
    fallback?: ReactNode
  } = {}
) {
  const { priority = 'normal', lazy = false, fallback } = options

  return function PerformanceOptimizedComponent(props: P) {
    const { batteryMode, memoryPressure } = usePerformanceMonitoring()
    const [shouldRender, setShouldRender] = useState(!lazy || priority === 'high')

    useEffect(() => {
      if (lazy && !shouldRender) {
        // Delay rendering for low priority components in performance mode
        const delay = (batteryMode || memoryPressure) ? 
          (priority === 'low' ? 2000 : 1000) : 
          (priority === 'low' ? 500 : 100)

        const timer = setTimeout(() => {
          setShouldRender(true)
        }, delay)

        return () => clearTimeout(timer)
      }
    }, [lazy, shouldRender, batteryMode, memoryPressure, priority])

    if (!shouldRender) {
      return <>{fallback || <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />}</>
    }

    return <Component {...props} />
  }
}

// Performance monitoring wrapper for critical components
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function MonitoredComponent(props: P) {
    const { markPerformance, measurePerformance } = usePerformanceMonitoring()

    useEffect(() => {
      markPerformance(`${componentName}-mount`)
      
      return () => {
        markPerformance(`${componentName}-unmount`)
        measurePerformance(`${componentName}-lifecycle`, `${componentName}-mount`, `${componentName}-unmount`)
      }
    }, [markPerformance, measurePerformance])

    return <Component {...props} />
  }
}