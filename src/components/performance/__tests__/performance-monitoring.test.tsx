import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring'
import { act, renderHook } from '@testing-library/react'

// Mock the desktop API
const mockDesktopAPI = {
  isElectron: () => true,
  on: jest.fn(),
  removeAllListeners: jest.fn(),
}

// Mock window.desktopAPI
Object.defineProperty(window, 'desktopAPI', {
  value: mockDesktopAPI,
  writable: true,
})

// Mock Performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  clearResourceTimings: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
}

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
})

// Mock PerformanceObserver
class MockPerformanceObserver {
  callback: PerformanceObserverCallback
  
  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback
  }
  
  observe() {}
  disconnect() {}
}

Object.defineProperty(window, 'PerformanceObserver', {
  value: MockPerformanceObserver,
  writable: true,
})

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    expect(result.current.electronMetrics).toBeNull()
    expect(result.current.webMetrics).toBeNull()
    expect(result.current.isMonitoring).toBe(false)
    expect(result.current.batteryMode).toBe(false)
    expect(result.current.memoryPressure).toBe(false)
    expect(result.current.cpuPressure).toBe(false)
  })

  it('should start and stop monitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    act(() => {
      result.current.startMonitoring()
    })

    expect(result.current.isMonitoring).toBe(true)

    act(() => {
      result.current.stopMonitoring()
    })

    expect(result.current.isMonitoring).toBe(false)
  })

  it('should enable and disable battery mode', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    act(() => {
      result.current.enableBatteryMode()
    })

    expect(result.current.batteryMode).toBe(true)

    act(() => {
      result.current.disableBatteryMode()
    })

    expect(result.current.batteryMode).toBe(false)
  })

  it('should mark performance events', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    act(() => {
      result.current.markPerformance('test-event')
    })

    expect(mockPerformance.mark).toHaveBeenCalledWith('app-test-event')
  })

  it('should measure performance between marks', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    act(() => {
      result.current.measurePerformance('test-measure', 'start-mark', 'end-mark')
    })

    expect(mockPerformance.measure).toHaveBeenCalledWith(
      'app-test-measure',
      'app-start-mark',
      'app-end-mark'
    )
  })

  it('should handle memory pressure', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    act(() => {
      result.current.handleMemoryPressure()
    })

    expect(mockPerformance.clearMarks).toHaveBeenCalled()
    expect(mockPerformance.clearMeasures).toHaveBeenCalled()
    expect(mockPerformance.clearResourceTimings).toHaveBeenCalled()
  })

  it('should perform resource cleanup', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    // Mock performance entries
    mockPerformance.getEntriesByType.mockImplementation((type) => {
      if (type === 'resource') return new Array(150) // More than 100
      if (type === 'mark') return new Array(60) // More than 50
      if (type === 'measure') return new Array(60) // More than 50
      return []
    })

    act(() => {
      result.current.performResourceCleanup()
    })

    expect(mockPerformance.clearResourceTimings).toHaveBeenCalled()
    expect(mockPerformance.clearMarks).toHaveBeenCalled()
    expect(mockPerformance.clearMeasures).toHaveBeenCalled()
  })

  it('should generate performance insights', () => {
    const { result } = renderHook(() => usePerformanceMonitoring())

    // Set up mock web metrics with high memory usage
    act(() => {
      result.current.startMonitoring()
    })

    const insights = result.current.getPerformanceInsights()

    expect(insights).toHaveProperty('recommendations')
    expect(insights).toHaveProperty('warnings')
    expect(insights).toHaveProperty('metrics')
    expect(Array.isArray(insights.recommendations)).toBe(true)
    expect(Array.isArray(insights.warnings)).toBe(true)
  })

  it('should setup electron IPC listeners', () => {
    renderHook(() => usePerformanceMonitoring())

    expect(mockDesktopAPI.on).toHaveBeenCalledWith('performance-metrics', expect.any(Function))
    expect(mockDesktopAPI.on).toHaveBeenCalledWith('performance-clear-caches', expect.any(Function))
    expect(mockDesktopAPI.on).toHaveBeenCalledWith('performance-reduce-activity', expect.any(Function))
    expect(mockDesktopAPI.on).toHaveBeenCalledWith('performance-battery-mode', expect.any(Function))
  })

  it('should cleanup listeners on unmount', () => {
    const { unmount } = renderHook(() => usePerformanceMonitoring())

    unmount()

    expect(mockDesktopAPI.removeAllListeners).toHaveBeenCalledWith('performance-metrics')
    expect(mockDesktopAPI.removeAllListeners).toHaveBeenCalledWith('performance-clear-caches')
    expect(mockDesktopAPI.removeAllListeners).toHaveBeenCalledWith('performance-reduce-activity')
    expect(mockDesktopAPI.removeAllListeners).toHaveBeenCalledWith('performance-battery-mode')
  })
})