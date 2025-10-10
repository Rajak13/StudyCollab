'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface LandingSection {
  id: string
  title: string
  component: React.ComponentType<any>
}

export interface NavigationState {
  // Current section state
  currentSection: number
  totalSections: number
  
  // Auto-play state
  isAutoPlaying: boolean
  progress: number
  autoPlaySpeed: number // milliseconds between progress increments
  sectionDuration: number // milliseconds per section
  
  // Animation state
  isTransitioning: boolean
  transitionDirection: 'forward' | 'backward' | 'none'
  
  // User preferences
  hasSkippedTour: boolean
  hasCompletedTour: boolean
  
  // Navigation actions
  goToSection: (index: number) => void
  nextSection: () => void
  previousSection: () => void
  skipTour: () => void
  completeTour: () => void
  
  // Auto-play controls
  startAutoPlay: () => void
  pauseAutoPlay: () => void
  resetProgress: () => void
  updateProgress: (increment: number) => void
  
  // Animation controls
  setTransitioning: (isTransitioning: boolean, direction?: 'forward' | 'backward' | 'none') => void
  
  // Initialization
  initializeSections: (sections: LandingSection[]) => void
  reset: () => void
}

const INITIAL_STATE = {
  currentSection: 0,
  totalSections: 0,
  isAutoPlaying: true,
  progress: 0,
  autoPlaySpeed: 100, // 100ms increments
  sectionDuration: 5000, // 5 seconds per section
  isTransitioning: false,
  transitionDirection: 'none' as const,
  hasSkippedTour: false,
  hasCompletedTour: false,
}

export const useLandingNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      ...INITIAL_STATE,
      
      // Navigation actions
      goToSection: (index: number) => {
        const state = get()
        if (index >= 0 && index < state.totalSections && index !== state.currentSection) {
          const direction = index > state.currentSection ? 'forward' : 'backward'
          
          set({ 
            isTransitioning: true, 
            transitionDirection: direction,
            isAutoPlaying: false, // Stop auto-play when user manually navigates
            currentSection: index,
            progress: 0
          })
          
          // Clear transition state after delay
          setTimeout(() => {
            set({ 
              isTransitioning: false,
              transitionDirection: 'none'
            })
          }, 300) // 300ms transition
        }
      },
      
      nextSection: () => {
        const state = get()
        if (state.currentSection < state.totalSections - 1) {
          set({
            currentSection: state.currentSection + 1,
            progress: 0,
            isTransitioning: true,
            transitionDirection: 'forward'
          })
          
          setTimeout(() => {
            set({ 
              isTransitioning: false,
              transitionDirection: 'none'
            })
          }, 300)
        } else {
          // Reached the end, complete the tour
          set({ 
            hasCompletedTour: true,
            isAutoPlaying: false,
            progress: 100
          })
        }
      },
      
      previousSection: () => {
        const state = get()
        if (state.currentSection > 0) {
          set({
            currentSection: state.currentSection - 1,
            progress: 0,
            isTransitioning: true,
            transitionDirection: 'backward'
          })
          
          setTimeout(() => {
            set({ 
              isTransitioning: false,
              transitionDirection: 'none'
            })
          }, 300)
        }
      },
      
      skipTour: () => {
        const state = get()
        set({ 
          hasSkippedTour: true,
          isAutoPlaying: false,
          currentSection: state.totalSections - 1 // Go to last section
        })
      },
      
      completeTour: () => {
        set({ 
          hasCompletedTour: true,
          isAutoPlaying: false,
          progress: 100
        })
      },
      
      // Auto-play controls
      startAutoPlay: () => {
        set({ isAutoPlaying: true })
      },
      
      pauseAutoPlay: () => {
        set({ isAutoPlaying: false })
      },
      
      resetProgress: () => {
        set({ progress: 0 })
      },
      
      updateProgress: (increment: number) => {
        const state = get()
        const maxProgress = 100
        const newProgress = Math.min(state.progress + increment, maxProgress)
        
        set({ progress: newProgress })
      },
      
      // Animation controls
      setTransitioning: (isTransitioning: boolean, direction = 'none' as const) => {
        set({ isTransitioning, transitionDirection: direction })
      },
      
      // Initialization
      initializeSections: (sections: LandingSection[]) => {
        set({ 
          totalSections: sections.length,
          currentSection: 0,
          progress: 0,
          isAutoPlaying: false, // Start with auto-play disabled to avoid loops
          hasSkippedTour: false,
          hasCompletedTour: false
        })
      },
      
      reset: () => {
        set({...INITIAL_STATE, isAutoPlaying: false})
      }
    }),
    {
      name: 'landing-navigation-store',
    }
  )
)

// Simple selector hooks
export const useCurrentSection = () => useLandingNavigationStore(state => state.currentSection)
export const useIsAutoPlaying = () => useLandingNavigationStore(state => state.isAutoPlaying)
export const useProgress = () => useLandingNavigationStore(state => state.progress)
export const useIsTransitioning = () => useLandingNavigationStore(state => state.isTransitioning)
export const useTransitionDirection = () => useLandingNavigationStore(state => state.transitionDirection)
export const useHasCompletedTour = () => useLandingNavigationStore(state => state.hasCompletedTour)

// Stable navigation actions hook
export const useNavigationActions = () => {
  const store = useLandingNavigationStore()
  return {
    goToSection: store.goToSection,
    nextSection: store.nextSection,
    previousSection: store.previousSection,
    skipTour: store.skipTour,
    completeTour: store.completeTour,
    startAutoPlay: store.startAutoPlay,
    pauseAutoPlay: store.pauseAutoPlay,
    resetProgress: store.resetProgress,
    updateProgress: store.updateProgress,
    initializeSections: store.initializeSections,
    reset: store.reset
  }
}