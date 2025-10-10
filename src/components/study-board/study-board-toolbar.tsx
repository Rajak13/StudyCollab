'use client'

import { Button } from '@/components/ui/button'
import { DrawingTool } from '@/types/study-board'
import Konva from 'konva'
import {
  Circle,
  Download,
  Eraser,
  Minus,
  MousePointer2,
  Pen,
  Redo,
  Square,
  StickyNote,
  Trash2,
  Triangle,
  Type,
  Undo
} from 'lucide-react'
import React from 'react'

interface StudyBoardToolbarProps {
  selectedTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onClearCanvas?: () => void
  onExportPDF?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  stage?: Konva.Stage | null
  className?: string
}

const tools: Array<{
  id: DrawingTool
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
}> = [
    { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { id: 'pen', icon: Pen, label: 'Pen', shortcut: 'P' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { id: 'sticky', icon: StickyNote, label: 'Sticky Note', shortcut: 'S' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  ]

export function StudyBoardToolbar({
  selectedTool,
  onToolChange,
  onClearCanvas,
  onExportPDF,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  stage,
  className = '',
}: StudyBoardToolbarProps) {
  return (
    <div className={`flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3 ${className}`}>
      {/* Drawing tools */}
      <div className="flex items-center flex-wrap gap-1 p-2 bg-white dark:bg-gray-800 educational:bg-green-50 nepali:bg-white border border-gray-200 dark:border-gray-700 educational:border-green-200 nepali:border-red-200 rounded-lg shadow-sm">
        {tools.map(tool => {
          const Icon = tool.icon
          const isSelected = selectedTool === tool.id

          return (
            <Button
              key={tool.id}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              className={`w-8 h-8 lg:w-9 lg:h-9 p-0 transition-colors ${
                isSelected 
                  ? 'bg-blue-100 dark:bg-blue-900 educational:bg-green-100 nepali:bg-red-100 text-blue-700 dark:text-blue-300 educational:text-green-700 nepali:text-red-700 border-blue-200 dark:border-blue-700 educational:border-green-200 nepali:border-red-200' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 educational:hover:bg-green-100 nepali:hover:bg-red-100 text-gray-700 dark:text-gray-300 educational:text-green-700 nepali:text-red-700'
              }`}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            >
              <Icon className="w-3 h-3 lg:w-4 lg:h-4" />
            </Button>
          )
        })}
      </div>



      {/* Action buttons */}
      <div className="flex items-center gap-1 p-2 bg-white dark:bg-gray-800 educational:bg-green-50 nepali:bg-white border border-gray-200 dark:border-gray-700 educational:border-green-200 nepali:border-red-200 rounded-lg shadow-sm">
        {onUndo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8 lg:w-9 lg:h-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3 h-3 lg:w-4 lg:h-4" />
          </Button>
        )}

        {onRedo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8 h-8 lg:w-9 lg:h-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3 h-3 lg:w-4 lg:h-4" />
          </Button>
        )}

        {/* Export Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (stage) {
              // Simple PNG export for now
              const dataURL = stage.toDataURL({ 
                mimeType: 'image/png',
                quality: 1,
                pixelRatio: 2
              })
              
              const link = document.createElement('a')
              link.download = `study-board-${new Date().toISOString().split('T')[0]}.png`
              link.href = dataURL
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          }}
          className="w-8 h-8 lg:w-9 lg:h-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Export as PNG"
        >
          <Download className="w-3 h-3 lg:w-4 lg:h-4" />
        </Button>

        {onClearCanvas && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCanvas}
            className="w-8 h-8 lg:w-9 lg:h-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Clear Canvas"
          >
            <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}