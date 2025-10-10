import { act, renderHook } from '@testing-library/react'
import { useDownloadAnalytics, useDownloadPageAnalytics } from '../use-download-analytics'

// Mock fetch
global.fetch = jest.fn()

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

describe('useDownloadAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        totalDownloads: 100,
        platformBreakdown: {
          windows: 60,
          mac: 30,
          linux: 10
        },
        recentDownloads: [],
        dailyStats: {
          today: 5,
          platforms: {
            windows: 3,
            mac: 2
          }
        }
      })
    })
  })

  it('fetches analytics data successfully', async () => {
    const { result } = renderHook(() => useDownloadAnalytics())
    
    await act(async () => {
      await result.current.fetchAnalytics()
    })
    
    expect(result.current.analytics).toEqual({
      totalDownloads: 100,
      platformBreakdown: {
        windows: 60,
        mac: 30,
        linux: 10
      },
      recentDownloads: [],
      dailyStats: {
        today: 5,
        platforms: {
          windows: 3,
          mac: 2
        }
      }
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('handles fetch error', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    const { result } = renderHook(() => useDownloadAnalytics())
    
    await act(async () => {
      await result.current.fetchAnalytics()
    })
    
    expect(result.current.error).toBe('Network error')
    expect(result.current.analytics).toBe(null)
  })

  it('tracks download events', async () => {
    const { result } = renderHook(() => useDownloadAnalytics())
    
    await act(async () => {
      await result.current.trackDownload('windows', true)
    })
    
    expect(fetch).toHaveBeenCalledWith('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('"platform":"windows"')
    })
  })

  it('gets platform stats correctly', () => {
    const { result } = renderHook(() => useDownloadAnalytics())
    
    // Set mock analytics data
    act(() => {
      result.current.analytics = {
        totalDownloads: 100,
        platformBreakdown: { windows: 60, mac: 30, linux: 10 },
        recentDownloads: [],
        dailyStats: { today: 5, platforms: {} }
      }
    })
    
    const windowsStats = result.current.getPlatformStats('windows')
    expect(windowsStats).toEqual({
      downloads: 60,
      percentage: 60
    })
  })

  it('gets conversion metrics correctly', () => {
    const { result } = renderHook(() => useDownloadAnalytics())
    
    // Set mock analytics data
    act(() => {
      result.current.analytics = {
        totalDownloads: 100,
        platformBreakdown: { windows: 60, mac: 30, linux: 10 },
        recentDownloads: [],
        dailyStats: { today: 5, platforms: {} }
      }
    })
    
    const metrics = result.current.getConversionMetrics()
    expect(metrics).toEqual({
      totalDownloads: 100,
      topPlatform: 'windows',
      platformDistribution: [
        { platform: 'windows', downloads: 60, percentage: 60 },
        { platform: 'mac', downloads: 30, percentage: 30 },
        { platform: 'linux', downloads: 10, percentage: 10 }
      ]
    })
  })
})

describe('useDownloadPageAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it('tracks page view on mount', () => {
    renderHook(() => useDownloadPageAnalytics())
    
    expect(fetch).toHaveBeenCalledWith('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('"event":"page_view"')
    })
  })

  it('tracks download intent', async () => {
    const { result } = renderHook(() => useDownloadPageAnalytics())
    
    await act(async () => {
      result.current.trackDownloadIntent()
    })
    
    expect(result.current.downloadIntent).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('"event":"download_intent"')
    })
  })
})