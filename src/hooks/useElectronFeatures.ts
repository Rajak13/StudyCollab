'use client'

import { useElectron } from '@/components/electron/ElectronProvider'
import { useCallback } from 'react'

export const useElectronFeatures = () => {
  const { isElectron, electronAPI } = useElectron()

  const showNotification = useCallback((title: string, body: string) => {
    if (isElectron && electronAPI?.showNotification) {
      electronAPI.showNotification(title, body)
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }, [isElectron, electronAPI])

  const minimizeToTray = useCallback(() => {
    if (isElectron && electronAPI?.minimizeToTray) {
      electronAPI.minimizeToTray()
    }
  }, [isElectron, electronAPI])

  const setTrayBadge = useCallback((count: number) => {
    if (isElectron && electronAPI?.setTrayBadge) {
      electronAPI.setTrayBadge(count)
    }
  }, [isElectron, electronAPI])

  const openFile = useCallback(async (): Promise<string | null> => {
    if (isElectron && electronAPI?.openFile) {
      try {
        return await electronAPI.openFile()
      } catch (error) {
        console.error('Failed to open file:', error)
        return null
      }
    }
    return null
  }, [isElectron, electronAPI])

  const saveFile = useCallback(async (content: string, filename: string): Promise<boolean> => {
    if (isElectron && electronAPI?.saveFile) {
      try {
        await electronAPI.saveFile(content, filename)
        return true
      } catch (error) {
        console.error('Failed to save file:', error)
        return false
      }
    }
    return false
  }, [isElectron, electronAPI])

  const setWindowTitle = useCallback((title: string) => {
    if (isElectron && electronAPI?.setWindowTitle) {
      electronAPI.setWindowTitle(title)
    } else if (typeof document !== 'undefined') {
      document.title = title
    }
  }, [isElectron, electronAPI])

  const toggleFullscreen = useCallback(() => {
    if (isElectron && electronAPI?.toggleFullscreen) {
      electronAPI.toggleFullscreen()
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }, [isElectron, electronAPI])

  const getAppVersion = useCallback((): string => {
    if (isElectron && electronAPI?.getAppVersion) {
      return electronAPI.getAppVersion()
    }
    return process.env.npm_package_version || '0.1.0'
  }, [isElectron, electronAPI])

  const checkForUpdates = useCallback(async () => {
    if (isElectron && electronAPI?.checkForUpdates) {
      try {
        return await electronAPI.checkForUpdates()
      } catch (error) {
        console.error('Failed to check for updates:', error)
        return { version: '0.1.0', available: false }
      }
    }
    return { version: '0.1.0', available: false }
  }, [isElectron, electronAPI])

  return {
    isElectron,
    showNotification,
    minimizeToTray,
    setTrayBadge,
    openFile,
    saveFile,
    setWindowTitle,
    toggleFullscreen,
    getAppVersion,
    checkForUpdates,
  }
}