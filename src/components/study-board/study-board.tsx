'use client'

import { Button } from '@/components/ui/button'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { DrawingTool, Point } from '@/types/study-board'
import { Users, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
// import { CanvasNavigation } from './canvas-navigation'
import { CollaborationStatus, PresenceList } from './presence-indicators'
import { SimpleCanvas } from './simple-canvas'
import { StudyBoardToolbar } from './study-board-toolbar'
// import { CollaborativeCanvas, UserCursor } from './collaborative-canvas'

export interface UserCursor {
  userId: string
  userName: string
  cursor: Point | null
  currentTool: string
  color: string
}

interface StudyBoardProps {
  groupId: string
  userId: string
  userName: string
  className?: string
  active?: boolean
}

export function StudyBoard({ groupId, userId, userName, className = '', active }: StudyBoardProps) {
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
        case 'e':
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedTool('eraser')
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
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 educational:bg-amber-50 nepali:bg-red-50 ${className}`}>
      {/* Header with toolbar and presence */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-2 lg:p-4 bg-white dark:bg-gray-800 educational:bg-green-50 nepali:bg-white border-b border-gray-200 dark:border-gray-700 educational:border-green-200 nepali:border-red-200 gap-2">
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
      <div className="flex-1 relative overflow-hidden min-h-[600px]">
        <div className="absolute inset-0 flex h-full">
          {/* Canvas */}
          <div className="flex-1 relative">
            <SimpleCanvas
              groupId={groupId}
              userId={userId}
              userName={userName}
              width={1200}
              height={800}
              className="w-full h-full"
              active={active}
              onConnectionChange={handleConnectionChange}
            />

            {/* Presence indicators overlay - Temporarily disabled */}
            {/* <PresenceIndicators cursors={cursors} /> */}
          </div>

          {/* Canvas Navigation Controls - Temporarily disabled */}
          {/* <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-10">
            <CanvasNavigation stage={stage} />
          </div> */}

          {/* Presence list sidebar */}
          {showPresenceList && (
            <div className="w-64 bg-white dark:bg-gray-800 educational:bg-green-50 nepali:bg-white border-l border-gray-200 dark:border-gray-700 educational:border-green-200 nepali:border-red-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 educational:text-green-800 nepali:text-red-800">
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
      <div className="p-2 bg-white dark:bg-gray-800 educational:bg-green-50 nepali:bg-white border-t border-gray-200 dark:border-gray-700 educational:border-green-200 nepali:border-red-200">
        <div className="text-xs text-gray-500 dark:text-gray-400 educational:text-green-600 nepali:text-red-600 text-center">
          Use keyboard shortcuts: V (select), P (pen), E (eraser), T (text), S (sticky note), R (rectangle), C (circle), L (line)
        </div>
      </div>
    </div>
  )
}