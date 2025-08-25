'use client'

import { getElectronAPI, isElectron } from '@/lib/electron'
import { createContext, useContext, useEffect, useState } from 'react'

interface ElectronContextType {
  isElectron: boolean
  electronAPI: any
  isReady: boolean
}

const ElectronContext = createContext<ElectronContextType>({
  isElectron: false,
  electronAPI: null,
  isReady: false,
})

export const useElectron = () => {
  const context = useContext(ElectronContext)
  if (!context) {
    throw new Error('useElectron must be used within an ElectronProvider')
  }
  return context
}

interface ElectronProviderProps {
  children: React.ReactNode
}

export const ElectronProvider: React.FC<ElectronProviderProps> = ({ children }) => {
  const [electronState, setElectronState] = useState<ElectronContextType>({
    isElectron: false,
    electronAPI: null,
    isReady: false,
  })

  useEffect(() => {
    const checkElectron = () => {
      const electronDetected = isElectron()
      const api = getElectronAPI()
      
      setElectronState({
        isElectron: electronDetected,
        electronAPI: api,
        isReady: true,
      })
    }

    // Check immediately
    checkElectron()

    // Also check after a short delay to ensure Electron APIs are loaded
    const timer = setTimeout(checkElectron, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <ElectronContext.Provider value={electronState}>
      {children}
    </ElectronContext.Provider>
  )
}