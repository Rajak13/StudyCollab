'use client'

import { useTheme } from '@/components/theme-provider'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { CanvasElement, Point } from '@/types/study-board'
import Konva from 'konva'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, Layer, Line, Rect, RegularPolygon, Stage, Text } from 'react-konva'

interface Size {
  width: number
  height: number
}

export interface UserCursor {
  userId: string
  userName: string
  cursor: Point | null
  currentTool: string
  color: string
}

interface CollaborativeCanvasProps {
  groupId: string
  userId: string
  userName: string
  width?: number
  height?: number
  className?: string
  onCursorUpdate?: (cursors: Map<string, UserCursor>) => void
  onConnectionChange?: (connected: boolean) => void
  active?: boolean
  maintainAspectRatio?: boolean
  aspectRatio?: number
}

export function CollaborativeCanvas({
  groupId: _groupId,
  userId,
  userName: _userName,
  width: defaultWidth = 1200,
  height: defaultHeight = 800,
  className = '',
  onCursorUpdate,
  onConnectionChange,
  active = true,
  maintainAspectRatio = true,
  aspectRatio = 3/2
}: CollaborativeCanvasProps) {
  // Get current theme for adaptive styling
  const { theme } = useTheme()
  
  // Silence unused-prop warnings for debug-only props in this implementation
  void _groupId
  void _userName
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null)
  const layerRef = useRef<Konva.Layer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  
  // State
  const [canvasSize, setCanvasSize] = useState<Size>({ width: defaultWidth, height: defaultHeight })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<number[]>([])
  const [isConnected] = useState(true) // Simulate connection for now
  const [cursors] = useState<Map<string, UserCursor>>(new Map())
  
  // Store
  const {
    elements,
    selectedTool,
    setStage,
    setLayer,
    addElement,
    updateElementPosition,
  } = useStudyBoardStore()

  // Get theme-aware colors
  const getThemeColors = useCallback(() => {
    const isDark = theme === 'dark'
    const isEducational = theme === 'educational'
    const isNepali = theme === 'nepali'
    
    return {
      canvasBackground: isDark ? '#0f0f0f' : isEducational ? '#fefcf3' : isNepali ? '#fefefe' : '#ffffff',
      canvasBorder: isDark ? '#dc2626' : isEducational ? '#16a34a' : isNepali ? '#dc2626' : '#3b82f6',
      containerBackground: isDark ? '#1c1c1c' : isEducational ? '#f9f7ed' : isNepali ? '#f8f9fa' : '#f8f9fa',
      textColor: isDark ? '#ffffff' : '#000000',
      strokeColor: isDark ? '#ffffff' : '#000000',
      stickyColor: isDark ? '#fbbf24' : isEducational ? '#fde047' : isNepali ? '#fbbf24' : '#ffeb3b',
      gridColor: isDark ? '#374151' : '#e5e7eb'
    }
  }, [theme])

  // Calculate canvas dimensions based on container size
  const calculateCanvasSize = useCallback((containerSize: Size) => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { width: defaultWidth, height: defaultHeight }
    }

    const containerWidth = Math.max(containerSize.width - 40, 400) // 20px padding on each side
    const containerHeight = Math.max(containerSize.height - 40, 300)

    let width = containerWidth
    let height = containerHeight

    // Apply aspect ratio if needed
    if (maintainAspectRatio && aspectRatio) {
      const containerAspectRatio = containerWidth / containerHeight
      
      if (containerAspectRatio > aspectRatio) {
        // Container is wider than desired aspect ratio
        width = containerHeight * aspectRatio
      } else {
        // Container is taller than desired aspect ratio
        height = containerWidth / aspectRatio
      }
    }

    return {
      width: Math.round(Math.max(width, 400)),
      height: Math.round(Math.max(height, 300))
    }
  }, [maintainAspectRatio, aspectRatio, defaultWidth, defaultHeight])

  // Initialize canvas and setup resize observer
  useEffect(() => {
    if (!containerRef.current || !active) return

    const container = containerRef.current

    // Create resize handler that doesn't depend on state
    const resizeHandler = (entries: ResizeObserverEntry[]) => {
      if (!entries[0] || !active) return
      
      const { width, height } = entries[0].contentRect
      const newSize = calculateCanvasSize({ width, height })
      
      setCanvasSize(prevSize => {
        if (newSize.width !== prevSize.width || newSize.height !== prevSize.height) {
          return newSize
        }
        return prevSize
      })
    }

    // Setup resize observer
    resizeObserverRef.current = new ResizeObserver(resizeHandler)
    resizeObserverRef.current.observe(container)

    // Initial size calculation
    const rect = container.getBoundingClientRect()
    const initialSize = calculateCanvasSize({ width: rect.width, height: rect.height })
    setCanvasSize(initialSize)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [active, calculateCanvasSize])

  // Setup stage and layer refs
  useEffect(() => {
    const stage = stageRef.current
    const layer = layerRef.current
    
    if (stage && layer) {
      console.log('Setting up stage and layer')
      setStage(stage)
      setLayer(layer)
      
      // Ensure the stage is properly configured for interaction
      stage.listening(true)
      layer.listening(true)
      
      // Configure the container
      const container = stage.container()
      if (container) {
        container.style.cursor = selectedTool === 'select' ? 'default' : 'crosshair'
        container.tabIndex = 1 // Make it focusable
        container.style.outline = 'none' // Remove focus outline
        
        // Ensure the container can receive events
        container.style.pointerEvents = 'auto'
        container.style.userSelect = 'none'
      }
      
      // Force a redraw
      layer.draw()
    }
  }, [canvasSize.width, canvasSize.height]) // Don't include selectedTool to avoid recreating stage
  
  // Update cursor when tool changes
  useEffect(() => {
    const stage = stageRef.current
    if (stage) {
      const container = stage.container()
      if (container) {
        container.style.cursor = selectedTool === 'select' ? 'default' : 'crosshair'
      }
    }
  }, [selectedTool])

  // Handle drawing events
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('Mouse down event:', { active, selectedTool, target: e.target })
    
    if (!active) {
      console.log('Canvas not active')
      return
    }

    const stage = e.target.getStage()
    if (!stage) {
      console.log('No stage found')
      return
    }

    const pos = stage.getPointerPosition()
    if (!pos) {
      console.log('No pointer position')
      return
    }

    console.log('Mouse position:', pos)

    // Handle selection tool
    if (selectedTool === 'select') {
      console.log('Select tool - allowing default behavior')
      return
    }

    // Prevent event bubbling for drawing tools
    e.evt.preventDefault()
    e.evt.stopPropagation()

    setIsDrawing(true)

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      console.log('Starting drawing with tool:', selectedTool)
      setCurrentPath([pos.x, pos.y])
    } else {
      // Handle other tools (shapes, text, etc.)
      console.log('Creating element with tool:', selectedTool)
      const currentColors = getThemeColors()
      
      // Set proper dimensions for different tools
      let width = 100
      let height = 100
      
      if (selectedTool === 'text') {
        width = 200
        height = 30
      } else if (selectedTool === 'sticky') {
        width = 150
        height = 150
      } else if (selectedTool === 'line') {
        width = 100
        height = 0
      }
      
      const newElement: CanvasElement = {
        id: `element_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: selectedTool as any,
        x: pos.x,
        y: pos.y,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        fill: selectedTool === 'sticky' ? currentColors.stickyColor : 'transparent',
        stroke: currentColors.strokeColor,
        strokeWidth: 2,
        text: selectedTool === 'text' ? 'Double click to edit' : selectedTool === 'sticky' ? 'Sticky note' : undefined,
        fontSize: selectedTool === 'text' ? 16 : selectedTool === 'sticky' ? 14 : undefined,
        points: selectedTool === 'line' ? [pos.x, pos.y, pos.x + 100, pos.y] : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId
      }
      
      console.log('Adding element:', newElement)
      addElement(newElement)
    }
  }, [active, selectedTool, addElement, userId, getThemeColors])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active || !isDrawing) return

    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setCurrentPath(prev => {
        const newPath = [...prev, pos.x, pos.y]
        console.log('Drawing path updated, length:', newPath.length / 2)
        return newPath
      })
    }
  }, [active, isDrawing, selectedTool])

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up event:', { active, isDrawing, selectedTool, pathLength: currentPath.length })
    
    if (!active || !isDrawing) return

    setIsDrawing(false)

    if ((selectedTool === 'pen' || selectedTool === 'eraser') && currentPath.length > 0) {
      console.log('Finalizing drawing path with', currentPath.length / 2, 'points')
      const currentColors = getThemeColors()
      const newElement: CanvasElement = {
        id: `element_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: selectedTool,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        fill: 'transparent',
        stroke: selectedTool === 'eraser' ? currentColors.canvasBackground : currentColors.strokeColor,
        strokeWidth: selectedTool === 'eraser' ? 10 : 2,
        points: [...currentPath], // Create a copy
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId
      }
      console.log('Adding drawing element:', newElement)
      addElement(newElement)
      setCurrentPath([])
    }
  }, [active, isDrawing, selectedTool, currentPath, addElement, userId, getThemeColors])

  // Handle element drag
  const handleElementDragEnd = useCallback((elementId: string, newPos: Point) => {
    updateElementPosition(elementId, newPos)
  }, [updateElementPosition])

  // Render canvas elements
  const renderElement = useCallback((element: CanvasElement) => {
    const currentColors = getThemeColors()
    const commonProps = {
      key: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      draggable: selectedTool === 'select',
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        const pos = e.target.position()
        handleElementDragEnd(element.id, pos)
      }
    }

    // Use theme-aware colors for stroke and fill
    const themeStroke = element.stroke === '#000000' ? currentColors.strokeColor : element.stroke
    const themeFill = element.fill === '#ffeb3b' ? currentColors.stickyColor : element.fill

    switch (element.type) {
      case 'pen':
      case 'eraser':
        if (!element.points || element.points.length < 4) return null
        return (
          <Line
            {...commonProps}
            points={element.points}
            stroke={themeStroke}
            strokeWidth={element.strokeWidth || 2}
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
            fill={themeFill}
            stroke={themeStroke}
            strokeWidth={element.strokeWidth || 2}
          />
        )
      
      case 'circle':
        const radius = Math.max(element.width || 50, element.height || 50) / 2
        return (
          <Circle
            {...commonProps}
            x={element.x + radius}
            y={element.y + radius}
            radius={radius}
            fill={themeFill}
            stroke={themeStroke}
            strokeWidth={element.strokeWidth || 2}
          />
        )
      
      case 'triangle':
        const triRadius = Math.max(element.width || 50, element.height || 50) / 2
        return (
          <RegularPolygon
            {...commonProps}
            x={element.x + triRadius}
            y={element.y + triRadius}
            sides={3}
            radius={triRadius}
            fill={themeFill}
            stroke={themeStroke}
            strokeWidth={element.strokeWidth || 2}
          />
        )
      
      case 'line':
        const points = element.points || [element.x, element.y, element.x + (element.width || 100), element.y]
        return (
          <Line
            {...commonProps}
            points={points}
            stroke={themeStroke}
            strokeWidth={element.strokeWidth || 2}
            lineCap="round"
          />
        )
      
      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text || 'Text'}
            fontSize={element.fontSize || 16}
            fontFamily="Arial"
            fill={currentColors.textColor}
            width={element.width || 200}
            height={element.height || 30}
            align="left"
            verticalAlign="top"
          />
        )
      
      case 'sticky':
        return (
          <React.Fragment key={element.id}>
            <Rect
              {...commonProps}
              width={element.width || 150}
              height={element.height || 150}
              fill={themeFill}
              stroke={themeStroke}
              strokeWidth={1}
              cornerRadius={4}
            />
            <Text
              {...commonProps}
              text={element.text || 'Sticky note'}
              fontSize={element.fontSize || 14}
              fontFamily="Arial"
              fill={currentColors.textColor}
              width={(element.width || 150) - 16}
              height={(element.height || 150) - 16}
              x={element.x + 8}
              y={element.y + 8}
              align="left"
              verticalAlign="top"
              wrap="word"
            />
          </React.Fragment>
        )
      
      default:
        console.warn('Unknown element type:', element.type)
        return null
    }
  }, [selectedTool, handleElementDragEnd, getThemeColors])

  // Update connection status
  useEffect(() => {
    onConnectionChange?.(isConnected)
  }, [isConnected, onConnectionChange])

  // Update cursor information
  useEffect(() => {
    onCursorUpdate?.(cursors)
  }, [cursors, onCursorUpdate])

  // Force redraw when elements change
  useEffect(() => {
    const layer = layerRef.current
    if (layer && elements.length > 0) {
      console.log('Elements changed, forcing redraw. Element count:', elements.length)
      layer.batchDraw()
    }
  }, [elements])

  // Memoize colors to prevent unnecessary recalculations
  const colors = React.useMemo(() => getThemeColors(), [getThemeColors])

  if (!active) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ width: defaultWidth, height: defaultHeight }}
      >
        <p className="text-gray-500 dark:text-gray-400">Canvas inactive</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-lg border-2 ${className}`}
      style={{ 
        backgroundColor: colors.containerBackground,
        borderColor: colors.canvasBorder,
        touchAction: 'none' // Prevent default touch behaviors
      }}
    >
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{
          cursor: selectedTool === 'select' ? 'default' : 'crosshair',
          display: 'block'
        }}
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
          
          {/* Grid pattern */}
          {Array.from({ length: Math.ceil(canvasSize.width / 20) }, (_, i) => (
            <Line
              key={`grid-v-${i}`}
              points={[i * 20, 0, i * 20, canvasSize.height]}
              stroke={colors.gridColor}
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))}
          {Array.from({ length: Math.ceil(canvasSize.height / 20) }, (_, i) => (
            <Line
              key={`grid-h-${i}`}
              points={[0, i * 20, canvasSize.width, i * 20]}
              stroke={colors.gridColor}
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))}
          
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
            />
          )}
        </Layer>
      </Stage>
      
      {/* Connection status indicator */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        {/* Debug info */}
        <div className="bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
          <div>Tool: {selectedTool}</div>
          <div>Elements: {elements.length}</div>
          <div>Drawing: {isDrawing ? 'Yes' : 'No'}</div>
          <div>Path: {currentPath.length / 2} points</div>
          <div>Size: {canvasSize.width}x{canvasSize.height}</div>
        </div>
      </div>
    </div>
  )
}