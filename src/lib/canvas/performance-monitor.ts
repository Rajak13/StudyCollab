/**
 * Performance monitoring utilities for canvas operations
 * Helps identify performance bottlenecks and optimize rendering
 */
export class CanvasPerformanceMonitor {
  private static instance: CanvasPerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private isMonitoring = false
  private frameCount = 0
  private lastFrameTime = 0
  private fps = 0

  static getInstance(): CanvasPerformanceMonitor {
    if (!CanvasPerformanceMonitor.instance) {
      CanvasPerformanceMonitor.instance = new CanvasPerformanceMonitor()
    }
    return CanvasPerformanceMonitor.instance
  }

  /**
   * Start monitoring performance
   */
  startMonitoring(): void {
    this.isMonitoring = true
    this.frameCount = 0
    this.lastFrameTime = performance.now()
    this.requestAnimationFrame()
  }

  /**
   * Stop monitoring performance
   */
  stopMonitoring(): void {
    this.isMonitoring = false
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only the last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  /**
   * Measure execution time of a function
   */
  measureTime<T>(name: string, fn: () => T): T {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    
    this.recordMetric(name, endTime - startTime)
    return result
  }

  /**
   * Measure async execution time
   */
  async measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    
    this.recordMetric(name, endTime - startTime)
    return result
  }

  /**
   * Get performance statistics for a metric
   */
  getMetricStats(name: string): {
    count: number
    min: number
    max: number
    average: number
    median: number
    p95: number
  } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) {
      return null
    }

    const sorted = [...values].sort((a, b) => a - b)
    const count = sorted.length
    const min = sorted[0]
    const max = sorted[count - 1]
    const average = sorted.reduce((sum, val) => sum + val, 0) / count
    const median = sorted[Math.floor(count / 2)]
    const p95Index = Math.floor(count * 0.95)
    const p95 = sorted[p95Index]

    return { count, min, max, average, median, p95 }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, ReturnType<typeof this.getMetricStats>> {
    const result: Record<string, ReturnType<typeof this.getMetricStats>> = {}
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name)
    }
    
    return result
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear()
  }

  /**
   * Get memory usage if available
   */
  getMemoryUsage(): {
    used: number
    total: number
    limit: number
  } | null {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    return null
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getAllMetrics()
    const memory = this.getMemoryUsage()
    
    let report = '=== Canvas Performance Report ===\n\n'
    
    report += `FPS: ${this.fps.toFixed(1)}\n\n`
    
    if (memory) {
      const usedMB = (memory.used / 1024 / 1024).toFixed(2)
      const totalMB = (memory.total / 1024 / 1024).toFixed(2)
      const limitMB = (memory.limit / 1024 / 1024).toFixed(2)
      report += `Memory Usage: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)\n\n`
    }
    
    report += 'Performance Metrics:\n'
    
    for (const [name, stats] of Object.entries(metrics)) {
      if (stats) {
        report += `\n${name}:\n`
        report += `  Count: ${stats.count}\n`
        report += `  Average: ${stats.average.toFixed(2)}ms\n`
        report += `  Median: ${stats.median.toFixed(2)}ms\n`
        report += `  Min: ${stats.min.toFixed(2)}ms\n`
        report += `  Max: ${stats.max.toFixed(2)}ms\n`
        report += `  95th Percentile: ${stats.p95.toFixed(2)}ms\n`
      }
    }
    
    return report
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    console.log(this.generateReport())
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  checkPerformance(): {
    isGood: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check FPS
    if (this.fps < 30) {
      issues.push(`Low FPS: ${this.fps.toFixed(1)} (target: 30+)`)
      recommendations.push('Consider reducing canvas complexity or enabling performance optimizations')
    }
    
    // Check memory usage
    const memory = this.getMemoryUsage()
    if (memory) {
      const usagePercent = (memory.used / memory.limit) * 100
      if (usagePercent > 80) {
        issues.push(`High memory usage: ${usagePercent.toFixed(1)}%`)
        recommendations.push('Consider implementing memory cleanup or reducing canvas elements')
      }
    }
    
    // Check render times
    const renderStats = this.getMetricStats('render')
    if (renderStats && renderStats.average > 16.67) { // 60fps = 16.67ms per frame
      issues.push(`Slow rendering: ${renderStats.average.toFixed(2)}ms average (target: <16.67ms)`)
      recommendations.push('Optimize rendering pipeline or reduce visual complexity')
    }
    
    // Check resize times
    const resizeStats = this.getMetricStats('resize')
    if (resizeStats && resizeStats.average > 100) {
      issues.push(`Slow resize operations: ${resizeStats.average.toFixed(2)}ms average`)
      recommendations.push('Optimize resize handling or debounce resize events')
    }
    
    return {
      isGood: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * Animation frame loop for FPS calculation
   */
  private requestAnimationFrame(): void {
    if (!this.isMonitoring) return
    
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    
    this.frameCount++
    
    // Calculate FPS every second
    if (deltaTime >= 1000) {
      this.fps = (this.frameCount * 1000) / deltaTime
      this.frameCount = 0
      this.lastFrameTime = currentTime
    }
    
    requestAnimationFrame(() => this.requestAnimationFrame())
  }
}

/**
 * Hook for React components to use performance monitoring
 */
export function useCanvasPerformanceMonitor() {
  const monitor = CanvasPerformanceMonitor.getInstance()

  const startMonitoring = () => monitor.startMonitoring()
  const stopMonitoring = () => monitor.stopMonitoring()
  const recordMetric = (name: string, value: number) => monitor.recordMetric(name, value)
  const measureTime = <T>(name: string, fn: () => T) => monitor.measureTime(name, fn)
  const measureTimeAsync = <T>(name: string, fn: () => Promise<T>) => monitor.measureTimeAsync(name, fn)
  const getMetricStats = (name: string) => monitor.getMetricStats(name)
  const getAllMetrics = () => monitor.getAllMetrics()
  const getFPS = () => monitor.getFPS()
  const clearMetrics = () => monitor.clearMetrics()
  const generateReport = () => monitor.generateReport()
  const logReport = () => monitor.logReport()
  const checkPerformance = () => monitor.checkPerformance()

  return {
    startMonitoring,
    stopMonitoring,
    recordMetric,
    measureTime,
    measureTimeAsync,
    getMetricStats,
    getAllMetrics,
    getFPS,
    clearMetrics,
    generateReport,
    logReport,
    checkPerformance,
    monitor
  }
}