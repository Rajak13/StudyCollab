import { act, renderHook } from '@testing-library/react'
import { useLandingNavigationStore } from '../landing-navigation-store'

describe('useLandingNavigationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useLandingNavigationStore())
    act(() => {
      result.current.reset()
    })
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    
    expect(result.current.currentSection).toBe(0)
    expect(result.current.totalSections).toBe(0)
    expect(result.current.isAutoPlaying).toBe(true)
    expect(result.current.progress).toBe(0)
    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.hasSkippedTour).toBe(false)
    expect(result.current.hasCompletedTour).toBe(false)
  })

  it('initializes sections correctly', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null },
      { id: 'benefits', title: 'Benefits', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    expect(result.current.totalSections).toBe(3)
    expect(result.current.currentSection).toBe(0)
    expect(result.current.progress).toBe(0)
    expect(result.current.isAutoPlaying).toBe(true)
  })

  it('navigates to next section', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    act(() => {
      result.current.nextSection()
    })

    // Should set transitioning state first
    expect(result.current.isTransitioning).toBe(true)
    expect(result.current.transitionDirection).toBe('forward')
  })

  it('navigates to previous section', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    // Go to second section first
    act(() => {
      result.current.goToSection(1)
    })

    // Wait for transition to complete
    setTimeout(() => {
      act(() => {
        result.current.previousSection()
      })

      expect(result.current.isTransitioning).toBe(true)
      expect(result.current.transitionDirection).toBe('backward')
    }, 350)
  })

  it('goes to specific section', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null },
      { id: 'benefits', title: 'Benefits', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    act(() => {
      result.current.goToSection(2)
    })

    expect(result.current.isTransitioning).toBe(true)
    expect(result.current.transitionDirection).toBe('forward')
    expect(result.current.isAutoPlaying).toBe(false) // Should stop auto-play
  })

  it('skips tour correctly', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null },
      { id: 'benefits', title: 'Benefits', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    act(() => {
      result.current.skipTour()
    })

    expect(result.current.hasSkippedTour).toBe(true)
    expect(result.current.isAutoPlaying).toBe(false)
    expect(result.current.currentSection).toBe(2) // Should go to last section
  })

  it('completes tour correctly', () => {
    const { result } = renderHook(() => useLandingNavigationStore())

    act(() => {
      result.current.completeTour()
    })

    expect(result.current.hasCompletedTour).toBe(true)
    expect(result.current.isAutoPlaying).toBe(false)
    expect(result.current.progress).toBe(100)
  })

  it('updates progress correctly', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    act(() => {
      result.current.updateProgress(50)
    })

    expect(result.current.progress).toBe(50)
  })

  it('auto-advances when progress reaches 100%', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    act(() => {
      result.current.updateProgress(100)
    })

    // Should trigger nextSection which sets transitioning state
    expect(result.current.isTransitioning).toBe(true)
  })

  it('completes tour when reaching last section with 100% progress', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null }
    ]

    act(() => {
      result.current.initializeSections(mockSections)
    })

    // Go to last section
    act(() => {
      result.current.goToSection(1)
    })

    // Wait for transition to complete
    setTimeout(() => {
      act(() => {
        result.current.updateProgress(100)
      })

      expect(result.current.hasCompletedTour).toBe(true)
    }, 350)
  })

  it('controls auto-play correctly', () => {
    const { result } = renderHook(() => useLandingNavigationStore())

    act(() => {
      result.current.pauseAutoPlay()
    })

    expect(result.current.isAutoPlaying).toBe(false)

    act(() => {
      result.current.startAutoPlay()
    })

    expect(result.current.isAutoPlaying).toBe(true)
  })

  it('resets progress correctly', () => {
    const { result } = renderHook(() => useLandingNavigationStore())

    act(() => {
      result.current.updateProgress(75)
    })

    expect(result.current.progress).toBe(75)

    act(() => {
      result.current.resetProgress()
    })

    expect(result.current.progress).toBe(0)
  })

  it('resets store to initial state', () => {
    const { result } = renderHook(() => useLandingNavigationStore())
    const mockSections = [
      { id: 'hero', title: 'Welcome', component: () => null },
      { id: 'features', title: 'Features', component: () => null }
    ]

    // Make some changes
    act(() => {
      result.current.initializeSections(mockSections)
      result.current.goToSection(1)
      result.current.skipTour()
    })

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.currentSection).toBe(0)
    expect(result.current.totalSections).toBe(0)
    expect(result.current.isAutoPlaying).toBe(true)
    expect(result.current.progress).toBe(0)
    expect(result.current.hasSkippedTour).toBe(false)
    expect(result.current.hasCompletedTour).toBe(false)
  })
})