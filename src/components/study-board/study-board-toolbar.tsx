'use client'

import { Button } from '@/components/ui/button'
import { DrawingTool } from '@/types/study-board'
import Konva from 'konva'
import {
  Circle,
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
import { ExportDialog } from './export-dialog'
import { LayerManager } from './layer-manager'
import { TemplateSelector } from './template-selector'

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
      <div className="flex items-center flex-wrap gap-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
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
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            >
              <Icon className="w-3 h-3 lg:w-4 lg:h-4" />
            </Button>
          )
        })}
      </div>

      {/* Templates and Layer Management - Mobile: Stack vertically, Desktop: Horizontal */}
      <div className="flex flex-col sm:flex-row gap-2">
        <TemplateSelector />
        <LayerManager />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
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

        {/* Enhanced Export */}
        <ExportDialog stage={stage || null} />

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