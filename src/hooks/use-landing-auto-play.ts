'use client'

import { useLandingNavigationStore } from '@/stores/landing-navigation-store'
import { useEffect, useRef } from 'react'

export function useLandingAutoPlay() {
  const store = useLandingNavigationStore()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSectionRef = useRef(store.currentSection)

  useEffect(() => {
    // Reset progress when section changes
    if (lastSectionRef.current !== store.currentSection) {
      store.resetProgress()
      lastSectionRef.current = store.currentSection
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Start auto-play if conditions are met
    if (store.isAutoPlaying && store.currentSection < store.totalSections - 1) {
      const progressIncrement = (store.autoPlaySpeed / store.sectionDuration) * 100
      
      timerRef.current = setInterval(() => {
        store.updateProgress(progressIncrement)
      }, store.autoPlaySpeed)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    store.isAutoPlaying, 
    store.currentSection, 
    store.totalSections, 
    store.autoPlaySpeed,
    store.sectionDuration
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return {
    isAutoPlaying: store.isAutoPlaying,
    progress: store.progress,
    currentSection: store.currentSection,
    totalSections: store.totalSections
  }
}