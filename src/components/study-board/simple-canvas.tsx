'use client'

import { useTheme } from '@/components/theme-provider'
import { useCanvasCollaboration } from '@/hooks/use-canvas-collaboration'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { CanvasElement, Point } from '@/types/study-board'
import Konva from 'konva'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, Layer, Line, Rect, RegularPolygon, Stage, Text, Transformer } from 'react-konva'

interface SimpleCanvasProps {
  groupId: string
  userId: string
  userName: string
  width?: number
  height?: number
  className?: string
  active?: boolean
  onConnectionChange?: (connected: boolean) => void
}

export function SimpleCanvas({
  groupId: _groupId,
  userId,
  userName: _userName,
  width: defaultWidth = 1200,
  height: defaultHeight = 800,
  className = '',
  active = true,
  onConnectionChange
}: SimpleCanvasProps) {
  // Get current theme for adaptive styling
  const { theme } = useTheme()

  // Refs
  const stageRef = useRef<Konva.Stage | null>(null)
  const layerRef = useRef<Konva.Layer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // State
  const [canvasSize, setCanvasSize] = useState({ width: defaultWidth, height: defaultHeight })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<number[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isEditingText, setIsEditingText] = useState<string | null>(null)
  const [tempTextValue, setTempTextValue] = useState('')
  const [lineStartPos, setLineStartPos] = useState<Point | null>(null)
  const [currentLineEnd, setCurrentLineEnd] = useState<Point | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)

  // Refs for editing
  const textInputRef = useRef<HTMLInputElement>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // Store
  const {
    elements,
    selectedTool,
    setStage,
    setLayer,
    addElement,
    updateElement,
    updateElementPosition,
    removeElement,
  } = useStudyBoardStore()

  // Collaboration
  const { broadcastChange, isConnected } = useCanvasCollaboration(_groupId, userId)

  // Collaborative wrapper functions
  const addElementWithBroadcast = useCallback((element: CanvasElement) => {
    addElement(element)
    broadcastChange('add', element)
  }, [addElement, broadcastChange])

  const updateElementWithBroadcast = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const updatedElement = { ...element, ...updates }
      updateElement(id, updates)
      broadcastChange('update', updatedElement)
    }
  }, [elements, updateElement, broadcastChange])

  const updateElementPositionWithBroadcast = useCallback((id: string, position: Point) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const updatedElement = { ...element, x: position.x, y: position.y }
      updateElementPosition(id, position)
      broadcastChange('update', updatedElement)
    }
  }, [elements, updateElementPosition, broadcastChange])

  // Get theme-aware colors
  const getThemeColors = useCallback(() => {
    const isDark = theme === 'dark'
    const isEducational = theme === 'educational'
    const isNepali = theme === 'nepali'

    return {
      canvasBackground: isDark ? '#1f2937' : isEducational ? '#fefcf3' : isNepali ? '#fefefe' : '#ffffff',
      strokeColor: isDark ? '#e5e7eb' : isEducational ? '#16a34a' : isNepali ? '#dc2626' : '#1f2937',
      textColor: isDark ? '#f9fafb' : isEducational ? '#14532d' : isNepali ? '#7f1d1d' : '#111827',
      stickyColor: isDark ? '#f59e0b' : isEducational ? '#fde047' : isNepali ? '#fbbf24' : '#ffeb3b',
      gridColor: isDark ? '#374151' : isEducational ? '#d9f99d' : isNepali ? '#fecaca' : '#e5e7eb',
      selectionColor: isDark ? '#3b82f6' : isEducational ? '#16a34a' : isNepali ? '#dc2626' : '#2563eb',
      backgroundColor: isDark ? '#111827' : isEducational ? '#f0fdf4' : isNepali ? '#fef2f2' : '#f9fafb'
    }
  }, [theme])

  // Setup stage and layer refs
  useEffect(() => {
    const stage = stageRef.current
    const layer = layerRef.current

    if (stage && layer && active) {
      console.log('Setting up stage and layer')
      setStage(stage)
      setLayer(layer)

      // Configure stage for interaction
      stage.listening(true)
      layer.listening(true)

      const container = stage.container()
      if (container) {
        // Set cursor based on selected tool
        let cursor = 'crosshair'
        if (selectedTool === 'select') cursor = 'default'
        else if (selectedTool === 'eraser') cursor = 'grab'
        else if (selectedTool === 'text') cursor = 'text'

        container.style.cursor = cursor
        container.style.outline = 'none'
        container.style.userSelect = 'none'
      }

      layer.draw()
    }
  }, [active, setStage, setLayer])

  // Handle mouse down
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active) return

    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    console.log('Mouse down:', { tool: selectedTool, pos })

    // Handle selection tool
    if (selectedTool === 'select') {
      const clickedOnEmpty = e.target === stage
      if (clickedOnEmpty) {
        setSelectedElementId(null)
      }
      return
    }

    // Clear any existing selection when drawing
    setSelectedElementId(null)
    e.evt.preventDefault()
    setIsDrawing(true)

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setCurrentPath([pos.x, pos.y])
    } else if (selectedTool === 'line') {
      setLineStartPos(pos)
      setCurrentLineEnd(pos)
    } else {
      // Create shape immediately
      const colors = getThemeColors()
      const newElement: CanvasElement = {
        id: `${selectedTool}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: selectedTool,
        x: pos.x,
        y: pos.y,
        width: selectedTool === 'text' ? 200 : selectedTool === 'sticky' ? 150 : 100,
        height: selectedTool === 'text' ? 30 : selectedTool === 'sticky' ? 150 : 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        fill: selectedTool === 'sticky' ? colors.stickyColor : 'transparent',
        stroke: colors.strokeColor,
        strokeWidth: 2,
        text: selectedTool === 'text' ? 'Double-click to edit' : selectedTool === 'sticky' ? 'Double-click to edit' : undefined,
        fontSize: selectedTool === 'text' ? 16 : selectedTool === 'sticky' ? 14 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId
      }

      console.log('Adding element:', newElement)
      addElementWithBroadcast(newElement)
    }
  }, [active, selectedTool, addElement, userId, getThemeColors])

  // Handle mouse move
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active || !isDrawing) return

    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setCurrentPath(prev => [...prev, pos.x, pos.y])
    } else if (selectedTool === 'line' && lineStartPos) {
      setCurrentLineEnd(pos)
    }
  }, [active, isDrawing, selectedTool])

  // Handle mouse up
  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active || !isDrawing) return

    console.log('Mouse up')
    setIsDrawing(false)

    if ((selectedTool === 'pen' || selectedTool === 'eraser') && currentPath.length > 0) {
      const colors = getThemeColors()
      const newElement: CanvasElement = {
        id: `${selectedTool}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: selectedTool,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        fill: 'transparent',
        stroke: selectedTool === 'eraser' ? colors.canvasBackground : colors.strokeColor,
        strokeWidth: selectedTool === 'eraser' ? 10 : 2,
        points: [...currentPath],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId
      }

      console.log('Adding stroke:', newElement)
      addElementWithBroadcast(newElement)
      setCurrentPath([])
    } else if (selectedTool === 'line' && lineStartPos) {
      const stage = e.target.getStage()
      if (stage) {
        const pos = stage.getPointerPosition()
        if (pos) {
          const colors = getThemeColors()
          const newElement: CanvasElement = {
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'line',
            x: lineStartPos.x,
            y: lineStartPos.y,
            width: pos.x - lineStartPos.x,
            height: pos.y - lineStartPos.y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            fill: 'transparent',
            stroke: colors.strokeColor,
            strokeWidth: 2,
            points: [lineStartPos.x, lineStartPos.y, pos.x, pos.y],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId
          }

          console.log('Adding line:', newElement)
          addElementWithBroadcast(newElement)
        }
      }
      setLineStartPos(null)
      setCurrentLineEnd(null)
    }
  }, [active, isDrawing, selectedTool, currentPath, lineStartPos, addElement, userId, getThemeColors])

  // Handle element drag
  const handleElementDragEnd = useCallback((elementId: string, newPos: Point) => {
    console.log('Element dragged:', elementId, newPos)
    updateElementPositionWithBroadcast(elementId, newPos)
  }, [updateElementPositionWithBroadcast])

  // Handle element selection
  const handleElementClick = useCallback((elementId: string) => {
    if (selectedTool === 'select') {
      setSelectedElementId(elementId)
      console.log('Selected element:', elementId)
    }
  }, [selectedTool])

  // Handle double click for text editing
  const handleElementDoubleClick = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (element && (element.type === 'text' || element.type === 'sticky')) {
      setIsEditingText(elementId)
      setTempTextValue(element.text || '')
      console.log('Editing text for element:', elementId)
    }
  }, [elements])

  // Handle text editing
  const handleTextEdit = useCallback((elementId: string, newText: string) => {
    updateElementWithBroadcast(elementId, { text: newText })
    setIsEditingText(null)
    setTempTextValue('')
    console.log('Updated text for element:', elementId, newText)
  }, [updateElementWithBroadcast])

  // Handle text input key press
  const handleTextInputKeyPress = useCallback((e: React.KeyboardEvent, elementId: string) => {
    if (e.key === 'Enter') {
      handleTextEdit(elementId, tempTextValue)
    } else if (e.key === 'Escape') {
      setIsEditingText(null)
      setTempTextValue('')
    }
  }, [tempTextValue, handleTextEdit])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedElementId) {
      const stage = stageRef.current
      if (stage) {
        const selectedNode = stage.findOne(`#${selectedElementId}`)
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode])
          transformerRef.current.getLayer()?.batchDraw()
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedElementId])

  // Focus text input when editing starts
  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus()
      textInputRef.current.select()
    }
  }, [isEditingText])

  // Notify parent of connection status changes
  useEffect(() => {
    onConnectionChange?.(isConnected)
  }, [isConnected, onConnectionChange])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && selectedTool === 'select') {
          const element = elements.find(el => el.id === selectedElementId)
          if (element) {
            removeElement(selectedElementId)
            broadcastChange('delete', element)
            setSelectedElementId(null)
          }
        }
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedElementId(null)
        setIsEditingText(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, selectedTool, elements, broadcastChange])

  // Render elements
  const renderElement = useCallback((element: CanvasElement) => {
    const colors = getThemeColors()
    const isSelected = selectedElementId === element.id
    const commonProps = {
      key: element.id,
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: selectedTool === 'select',
      onClick: () => handleElementClick(element.id),
      onDblClick: () => handleElementDoubleClick(element.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        const pos = e.target.position()
        handleElementDragEnd(element.id, pos)
      },
      // Add visual feedback for selection
      shadowColor: isSelected ? colors.selectionColor : undefined,
      shadowBlur: isSelected ? 8 : 0,
      shadowOpacity: isSelected ? 0.4 : 0,
    }

    switch (element.type) {
      case 'pen':
      case 'eraser':
        if (!element.points || element.points.length < 4) return null
        return (
          <Line
            {...commonProps}
            points={element.points}
            stroke={element.stroke || colors.strokeColor}
            strokeWidth={element.strokeWidth || (element.type === 'eraser' ? 10 : 2)}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={element.type === 'eraser' ? 'destination-out' : 'source-over'}
          />
        )

      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={element.width || 100}
            height={element.height || 100}
            fill={element.fill || 'transparent'}
            stroke={element.stroke || colors.strokeColor}
            strokeWidth={element.strokeWidth || 2}
          />
        )

      case 'circle':
        const radius = Math.max(element.width || 50, element.height || 50) / 2
        return (
          <Circle
            {...commonProps}
            // Position circle at its center, not offset
            x={element.x}
            y={element.y}
            radius={radius}
            fill={element.fill || 'transparent'}
            stroke={element.stroke || colors.strokeColor}
            strokeWidth={element.strokeWidth || 2}
          />
        )

      case 'triangle':
        const triRadius = Math.max(element.width || 50, element.height || 50) / 2
        return (
          <RegularPolygon
            {...commonProps}
            // Position triangle at its center, not offset
            x={element.x}
            y={element.y}
            sides={3}
            radius={triRadius}
            fill={element.fill || 'transparent'}
            stroke={element.stroke || colors.strokeColor}
            strokeWidth={element.strokeWidth || 2}
          />
        )

      case 'line':
        const points = element.points || [0, 0, element.width || 100, 0]
        return (
          <Line
            {...commonProps}
            points={points}
            stroke={element.stroke || colors.strokeColor}
            strokeWidth={element.strokeWidth || 2}
            lineCap="round"
            rotation={element.rotation || 0}
          />
        )

      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text || 'Text'}
            fontSize={element.fontSize || 16}
            fontFamily="Arial"
            fill={colors.textColor}
            width={element.width || 200}
          />
        )

      case 'sticky':
        return (
          <React.Fragment key={element.id}>
            <Rect
              {...commonProps}
              width={element.width || 150}
              height={element.height || 150}
              fill={element.fill || colors.stickyColor}
              stroke={element.stroke || colors.strokeColor}
              strokeWidth={1}
              cornerRadius={4}
            />
            <Text
              {...commonProps}
              text={element.text || 'Note'}
              fontSize={element.fontSize || 14}
              fontFamily="Arial"
              fill={colors.textColor}
              width={(element.width || 150) - 16}
              x={element.x + 8}
              y={element.y + 8}
              wrap="word"
            />
          </React.Fragment>
        )

      default:
        return null
    }
  }, [selectedTool, selectedElementId, handleElementDragEnd, handleElementClick, handleElementDoubleClick, getThemeColors])

  const colors = getThemeColors()

  if (!active) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">Canvas inactive</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-lg border-2 ${className}`}
      style={{
        backgroundColor: colors.backgroundColor,
        borderColor: colors.selectionColor
      }}
    >
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill={colors.canvasBackground}
          />

          {/* Render all elements */}
          {elements.map(renderElement)}

          {/* Current drawing path */}
          {isDrawing && currentPath.length > 0 && (selectedTool === 'pen' || selectedTool === 'eraser') && (
            <Line
              points={currentPath}
              stroke={selectedTool === 'eraser' ? colors.canvasBackground : colors.strokeColor}
              strokeWidth={selectedTool === 'eraser' ? 10 : 2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={selectedTool === 'eraser' ? 'destination-out' : 'source-over'}
              opacity={0.8}
            />
          )}

          {/* Current line preview */}
          {isDrawing && lineStartPos && currentLineEnd && selectedTool === 'line' && (
            <Line
              points={[lineStartPos.x, lineStartPos.y, currentLineEnd.x, currentLineEnd.y]}
              stroke={colors.strokeColor}
              strokeWidth={2}
              lineCap="round"
              opacity={0.5}
              dash={[5, 5]}
            />
          )}

          {/* Transformer for selected elements */}
          <Transformer
            ref={transformerRef}
            enabledAnchors={selectedElementId && elements.find(el => el.id === selectedElementId)?.type === 'line'
              ? ['middle-left', 'middle-right'] // Only show rotation handles for lines
              : ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']
            }
            rotateEnabled={true}
            borderStroke={colors.selectionColor}
            borderStrokeWidth={1}
            anchorStroke={colors.selectionColor}
            anchorFill={colors.backgroundColor}
            anchorSize={8}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox
              }
              return newBox
            }}
            onTransformEnd={(e) => {
              const node = e.target
              const elementId = node.id()
              if (elementId && selectedElementId === elementId) {
                const scaleX = node.scaleX()
                const scaleY = node.scaleY()
                const rotation = node.rotation()

                // Update element with new transform
                updateElementWithBroadcast(elementId, {
                  x: node.x(),
                  y: node.y(),
                  rotation: rotation,
                  scaleX: scaleX,
                  scaleY: scaleY,
                  width: (node.width() || 100) * scaleX,
                  height: (node.height() || 100) * scaleY
                })

                // Reset scale to 1 after applying to dimensions
                node.scaleX(1)
                node.scaleY(1)
              }
            }}
          />
        </Layer>
      </Stage>

      {/* Text editing overlay */}
      {isEditingText && (() => {
        const element = elements.find(el => el.id === isEditingText)
        if (!element) return null

        return (
          <div
            className="absolute border rounded px-2 py-1 shadow-lg z-50"
            style={{
              left: element.x,
              top: element.y,
              minWidth: element.width || 200,
              backgroundColor: colors.backgroundColor,
              borderColor: colors.selectionColor,
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={tempTextValue}
              onChange={(e) => setTempTextValue(e.target.value)}
              onKeyDown={(e) => handleTextInputKeyPress(e, isEditingText)}
              onBlur={() => handleTextEdit(isEditingText, tempTextValue)}
              className="w-full bg-transparent border-none outline-none text-sm"
              style={{
                fontSize: element.fontSize || 16,
                color: colors.textColor,
              }}
              placeholder="Enter text..."
            />
          </div>
        )
      })()}

      {/* Instructions */}
      {showInstructions && (
        <div
          className="absolute top-2 left-2 border rounded-lg p-3 text-xs max-w-xs shadow-lg"
          style={{
            backgroundColor: colors.backgroundColor,
            borderColor: colors.gridColor,
            color: colors.textColor
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">How to use:</div>
            <button
              onClick={() => setShowInstructions(false)}
              className="ml-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: colors.textColor }}
              title="Close instructions"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1" style={{ color: colors.textColor, opacity: 0.8 }}>
            <div>• Select (V) to move elements</div>
            <div>• Pen (P) to draw, Eraser (E) to erase</div>
            <div>• Line (L) - click and drag</div>
            <div>• Double-click text/notes to edit</div>
            <div>• Delete key to remove selected</div>
            <div>• Export button saves as PNG</div>
            <div className="pt-1 border-t" style={{ borderColor: colors.gridColor }}>
              <div>Status: {isConnected ? '🟢 Connected' : '🔴 Offline'}</div>
              <div>Elements: {elements.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Show instructions button when hidden */}
      {!showInstructions && (
        <button
          onClick={() => setShowInstructions(true)}
          className="absolute top-2 left-2 text-xs px-2 py-1 rounded border opacity-60 hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: colors.backgroundColor,
            borderColor: colors.gridColor,
            color: colors.textColor
          }}
          title="Show instructions"
        >
          ?
        </button>
      )}

      {/* Debug info */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
        <div>Tool: {selectedTool}</div>
        <div>Selected: {selectedElementId || 'None'}</div>
        <div>Editing: {isEditingText ? 'Yes' : 'No'}</div>
      </div>
    </div>
  )
}