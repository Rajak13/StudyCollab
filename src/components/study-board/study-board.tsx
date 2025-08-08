'use client'

import { Button } from '@/components/ui/button'
import { UserCursor } from '@/lib/collaboration/yjs-canvas-provider'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { DrawingTool } from '@/types/study-board'
import { Users, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CanvasNavigation } from './canvas-navigation'
import { CollaborativeCanvas } from './collaborative-canvas'
import { CollaborationStatus, PresenceIndicators, PresenceList } from './presence-indicators'
import { StudyBoardToolbar } from './study-board-toolbar'

interface StudyBoardProps {
  groupId: string
  userId: string
  userName: string
  className?: string
}

export function StudyBoard({ groupId, userId, userName, className = '' }: StudyBoardProps) {
  const [cursors, setCursors] = useState<Map<string, UserCursor>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [showPresenceList, setShowPresenceList] = useState(false)

  // Callback to receive cursor updates from the canvas
  const handleCursorUpdate = useCallback((newCursors: Map<string, UserCursor>) => {
    setCursors(newCursors)
  }, [])

  // Callback to receive connection status updates
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected)
  }, [])

  const {
    selectedTool,
    setSelectedTool,
    clearCanvas,
    stage,
  } = useStudyBoardStore()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('select')
            e.preventDefault()
          }
          break
        case 'p':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('pen')
            e.preventDefault()
          }
          break
        case 't':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('text')
            e.preventDefault()
          }
          break
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('sticky')
            e.preventDefault()
          }
          break
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('rectangle')
            e.preventDefault()
          }
          break
        case 'c':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('circle')
            e.preventDefault()
          }
          break
        case 'l':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('line')
            e.preventDefault()
          }
          break
        case 'escape':
          setSelectedTool('select')
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedTool])

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setSelectedTool(tool)
  }, [setSelectedTool])

  const handleClearCanvas = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This action cannot be undone.')) {
      clearCanvas()
    }
  }, [clearCanvas])

  const handleExportPDF = useCallback(async () => {
    try {
      // This would integrate with the existing canvas export functionality
      console.log('Exporting canvas as PDF...')
      // TODO: Implement PDF export
    } catch (error) {
      console.error('Failed to export PDF:', error)
    }
  }, [])

  const userCount = cursors.size + 1 // +1 for current user

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header with toolbar and presence */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-2 lg:p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-2">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
          <StudyBoardToolbar
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
            onClearCanvas={handleClearCanvas}
            onExportPDF={handleExportPDF}
            stage={stage}
          />

          <div className="flex items-center justify-between lg:justify-start">
            <CollaborationStatus
              isConnected={isConnected}
              userCount={userCount}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresenceList(!showPresenceList)}
              className="flex items-center space-x-2 lg:hidden"
            >
              <Users className="w-4 h-4" />
              <span>{userCount}</span>
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresenceList(!showPresenceList)}
            className="flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>{userCount}</span>
          </Button>
        </div>
      </div>

      {/* Main canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Canvas */}
          <div className="flex-1 relative">
            <CollaborativeCanvas
              groupId={groupId}
              userId={userId}
              userName={userName}
              width={1200}
              height={800}
              className="w-full h-full"
              onCursorUpdate={handleCursorUpdate}
              onConnectionChange={handleConnectionChange}
            />

            {/* Presence indicators overlay */}
            <PresenceIndicators cursors={cursors} />
          </div>

          {/* Canvas Navigation Controls */}
          <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-10">
            <CanvasNavigation stage={stage} />
          </div>

          {/* Presence list sidebar */}
          {showPresenceList && (
            <div className="w-64 bg-white border-l border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Participants
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPresenceList(false)}
                  className="w-6 h-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <PresenceList
                cursors={cursors}
                currentUserId={userId}
                currentUserName={userName}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer with tips */}
      <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Use keyboard shortcuts: V (select), P (pen), T (text), S (sticky note), R (rectangle), C (circle), L (line)
        </div>
      </div>
    </div>
  )
}