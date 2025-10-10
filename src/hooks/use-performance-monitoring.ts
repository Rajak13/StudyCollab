'use client'

import { useDesktopAPI } from '@/hooks/useDesktopAPI'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface PerformanceMetrics {
  memory: {
    used: number
    total: number
    external: number
    heapUsed: number
    heapTotal: number
    rss: number
  }
  cpu: {
    usage: number
    loadAverage: number[]
  }
  system: {
    platform: string
    arch: string
    totalMemory: number
    freeMemory: number
    uptime: number
  }
  app: {
    version: string
    startupTime: number
    windowCount: number
    isPackaged: boolean
  }
  v8: {
    heapStatistics: any
    heapSpaceStatistics: any[]
  }
}

export interface WebPerformanceMetrics {
  navigation: PerformanceNavigationTiming | null
  memory: any
  resources: PerformanceResourceTiming[]
  marks: PerformanceMark[]
  measures: PerformanceMeasure[]
}

export interface PerformanceState {
  electronMetrics: PerformanceMetrics | null
  webMetrics: WebPerformanceMetrics | null
  isMonitoring: boolean
  batteryMode: boolean
  memoryPressure: boolean
  cpuPressure: boolean
}

export function usePerformanceMonitoring() {
  const desktopAPI = useDesktopAPI()
  const [state, setState] = useState<PerformanceState>({
    electronMetrics: null,
    webMetrics: null,
    isMonitoring: false,
    batteryMode: false,
    memoryPressure: false,
    cpuPressure: false,
  })

  const performanceObserverRef = useRef<PerformanceObserver | null>(null)
  const memoryMonitorRef = useRef<NodeJS.Timeout | null>(null)
  const resourceCleanupRef = useRef<NodeJS.Timeout | null>(null)

  // Collect web performance metrics
  const collectWebMetrics = useCallback((): WebPerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const marks = performance.getEntriesByType('mark') as PerformanceMark[]
    const measures = performance.getEntriesByType('measure') as PerformanceMeasure[]

    return {
      navigation,
      memory: (performance as any).memory || null,
      resources: resources.slice(-50), // Keep only last 50 resources
      marks: marks.slice(-20), // Keep only last 20 marks
      measures: measures.slice(-20), // Keep only last 20 measures
    }
  }, [])

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    if (state.isMonitoring) return

    setState(prev => ({ ...prev, isMonitoring: true }))

    // Setup Performance Observer for web metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        performanceObserverRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          
          // Process performance entries
          entries.forEach(entry => {
            if (entry.entryType === 'measure' && entry.name.startsWith('app-')) {
              console.log(`Performance measure: ${entry.name} - ${entry.duration}ms`)
            }
          })

          // Update web metrics
          setState(prev => ({
            ...prev,
            webMetrics: collectWebMetrics(),
          }))
        })

        performanceObserverRef.current.observe({
          entryTypes: ['navigation', 'resource', 'measure', 'mark']
        })
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }

    // Setup memory monitoring
    memoryMonitorRef.current = setInterval(() => {
      const webMetrics = collectWebMetrics()
      
      // Check for memory pressure
      if (webMetrics.memory) {
        const memoryUsage = webMetrics.memory.usedJSHeapSize / webMetrics.memory.totalJSHeapSize
        const memoryPressure = memoryUsage > 0.8 // 80% threshold
        
        setState(prev => ({
          ...prev,
          webMetrics,
          memoryPressure,
        }))

        if (memoryPressure && !state.memoryPressure) {
          console.warn('High memory usage detected in renderer process')
          handleMemoryPressure()
        }
      }
    }, 30000) // Check every 30 seconds

    // Setup resource cleanup
    resourceCleanupRef.current = setInterval(() => {
      performResourceCleanup()
    }, 5 * 60 * 1000) // Every 5 minutes

    console.log('Performance monitoring started')
  }, [state.isMonitoring, collectWebMetrics])

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }))

    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect()
      performanceObserverRef.current = null
    }

    if (memoryMonitorRef.current) {
      clearInterval(memoryMonitorRef.current)
      memoryMonitorRef.current = null
    }

    if (resourceCleanupRef.current) {
      clearInterval(resourceCleanupRef.current)
      resourceCleanupRef.current = null
    }

    console.log('Performance monitoring stopped')
  }, [])

  // Handle memory pressure
  const handleMemoryPressure = useCallback(() => {
    console.log('Handling memory pressure in renderer process...')

    // Clear performance entries
    if (typeof performance !== 'undefined') {
      performance.clearMarks()
      performance.clearMeasures()
      performance.clearResourceTimings()
    }

    // Clear caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('temp') || name.includes('cache')) {
            caches.delete(name)
          }
        })
      })
    }

    // Trigger garbage collection if available
    if ((window as any).gc) {
      (window as any).gc()
    }
  }, [])

  // Perform resource cleanup
  const performResourceCleanup = useCallback(() => {
    console.log('Performing renderer resource cleanup...')

    // Clear old performance entries
    if (typeof performance !== 'undefined') {
      const resources = performance.getEntriesByType('resource')
      if (resources.length > 100) {
        performance.clearResourceTimings()
      }

      const marks = performance.getEntriesByType('mark')
      if (marks.length > 50) {
        performance.clearMarks()
      }

      const measures = performance.getEntriesByType('measure')
      if (measures.length > 50) {
        performance.clearMeasures()
      }
    }

    // Clear unused images from memory
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        img.src = ''
      }
    })
  }, [])

  // Enable battery optimization mode
  const enableBatteryMode = useCallback(() => {
    setState(prev => ({ ...prev, batteryMode: true }))
    
    // Reduce monitoring frequency
    if (memoryMonitorRef.current) {
      clearInterval(memoryMonitorRef.current)
      memoryMonitorRef.current = setInterval(() => {
        setState(prev => ({ ...prev, webMetrics: collectWebMetrics() }))
      }, 120000) // Every 2 minutes
    }

    console.log('Battery optimization mode enabled')
  }, [collectWebMetrics])

  // Disable battery optimization mode
  const disableBatteryMode = useCallback(() => {
    setState(prev => ({ ...prev, batteryMode: false }))
    
    // Restore normal monitoring frequency
    if (memoryMonitorRef.current) {
      clearInterval(memoryMonitorRef.current)
      memoryMonitorRef.current = setInterval(() => {
        setState(prev => ({ ...prev, webMetrics: collectWebMetrics() }))
      }, 30000) // Every 30 seconds
    }

    console.log('Battery optimization mode disabled')
  }, [collectWebMetrics])

  // Mark performance events
  const markPerformance = useCallback((name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`app-${name}`)
    }
  }, [])

  // Measure performance between marks
  const measurePerformance = useCallback((name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(`app-${name}`, `app-${startMark}`, endMark ? `app-${endMark}` : undefined)
      } catch (error) {
        console.warn('Performance measure failed:', error)
      }
    }
  }, [])

  // Get performance insights
  const getPerformanceInsights = useCallback(() => {
    const insights = {
      recommendations: [] as string[],
      warnings: [] as string[],
      metrics: {
        loadTime: 0,
        memoryUsage: 0,
        resourceCount: 0,
      }
    }

    if (state.webMetrics?.navigation) {
      const nav = state.webMetrics.navigation
      insights.metrics.loadTime = nav.loadEventEnd - nav.navigationStart
      
      if (insights.metrics.loadTime > 3000) {
        insights.warnings.push('Slow page load time detected')
        insights.recommendations.push('Consider implementing code splitting and lazy loading')
      }
    }

    if (state.webMetrics?.memory) {
      const memory = state.webMetrics.memory
      insights.metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize
      
      if (insights.metrics.memoryUsage > 0.8) {
        insights.warnings.push('High memory usage detected')
        insights.recommendations.push('Clear unused caches and optimize component rendering')
      }
    }

    if (state.webMetrics?.resources) {
      insights.metrics.resourceCount = state.webMetrics.resources.length
      
      if (insights.metrics.resourceCount > 100) {
        insights.warnings.push('Large number of resources loaded')
        insights.recommendations.push('Implement resource bundling and compression')
      }
    }

    return insights
  }, [state.webMetrics])

  // Setup Electron IPC listeners
  useEffect(() => {
    if (!desktopAPI?.isElectron()) return

    const handleElectronMetrics = (metrics: PerformanceMetrics) => {
      setState(prev => ({ ...prev, electronMetrics: metrics }))
    }

    const handleClearCaches = () => {
      handleMemoryPressure()
    }

    const handleReduceActivity = () => {
      setState(prev => ({ ...prev, cpuPressure: true }))
    }

    const handleBatteryMode = (enabled: boolean) => {
      if (enabled) {
        enableBatteryMode()
      } else {
        disableBatteryMode()
      }
    }

    // Setup listeners
    desktopAPI.on('performance-metrics', handleElectronMetrics)
    desktopAPI.on('performance-clear-caches', handleClearCaches)
    desktopAPI.on('performance-reduce-activity', handleReduceActivity)
    desktopAPI.on('performance-battery-mode', handleBatteryMode)

    return () => {
      desktopAPI.removeAllListeners('performance-metrics')
      desktopAPI.removeAllListeners('performance-clear-caches')
      desktopAPI.removeAllListeners('performance-reduce-activity')
      desktopAPI.removeAllListeners('performance-battery-mode')
    }
  }, [desktopAPI, enableBatteryMode, disableBatteryMode, handleMemoryPressure])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    enableBatteryMode,
    disableBatteryMode,
    markPerformance,
    measurePerformance,
    getPerformanceInsights,
    handleMemoryPressure,
    performResourceCleanup,
  }
}