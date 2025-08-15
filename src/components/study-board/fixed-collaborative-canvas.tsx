'use client'

import { useTheme } from '@/components/theme-provider'
import { CoordinateSystem } from '@/lib/canvas/coordinate-system'
import { MemoryManager } from '@/lib/canvas/memory-manager'
import { CanvasDimensions, ResponsiveCanvasManager } from '@/lib/canvas/responsive-canvas'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { CanvasElement, Point } from '@/types/study-board'
import Konva from 'konva'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, Layer, Line, Rect, RegularPolygon, Stage, Text, Transformer } from 'react-konva'

export interface UserCursor {
  userId: string
  userName: string
  cursor: Point | null
  currentTool: string
  color: string
}

interface FixedCollaborativeCanvasProps {
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
  autoResize?: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export function FixedCollaborativeCanvas({
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
  aspectRatio = 3/2,
  autoResize = true,
  minWidth = 400,
  minHeight = 300,
  maxWidth,
  maxHeight
}: FixedCollaborativeCanvasProps) {
  // Get current theme for adaptive styling
  const { theme } = useTheme()
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null)
  const layerRef = useRef<Konva.Layer | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Managers
  const memoryManagerRef = useRef<MemoryManager>(new MemoryManager())
  const responsiveManagerRef = useRef<ResponsiveCanvasManager>(
    new ResponsiveCanvasManager({
      maintainAspectRatio,
      aspectRatio,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      padding: 20,
      autoResize
    })
  )
  const coordinateSystemRef = useRef<CoordinateSystem>(
    new CoordinateSystem(
      { width: defaultWidth, height: defaultHeight },
      { width: defaultWidth, height: defaultHeight }
    )
  )
  
  // State
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    container: { width: defaultWidth, height: defaultHeight },
    canvas: { width: defaultWidth, height: defaultHeight },
    scale: 1,
    offset: { x: 0, y: 0 }
  })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<number[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isConnected] = useState(true) // Simulate connection for now
  const [cursors] = useState<Map<string, UserCursor>>(new Map())
  
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

  // Get theme-aware colors
  const getThemeColors = useCallback(() => {
    const isDark = theme === 'dark'
    const isEducational = theme === 'educational'
    const isNepali = theme === 'nepali'
    
    return {
      canvasBackground: isDark ? '#1f2937' : isEducational ? '#fefcf3' : isNepali ? '#fefefe' : '#ffffff',
      canvasBorder: isDark ? '#374151' : isEducational ? '#16a34a' : isNepali ? '#dc2626' : '#3b82f6',
      containerBackground: isDark ? '#111827' : isEducational ? '#f0fdf4' : isNepali ? '#fef2f2' : '#f9fafb',
      textColor: isDark ? '#f9fafb' : isEducational ? '#14532d' : isNepali ? '#7f1d1d' : '#111827',
      strokeColor: isDark ? '#e5e7eb' : isEducational ? '#16a34a' : isNepali ? '#dc2626' : '#1f2937',
      stickyColor: isDark ? '#f59e0b' : isEducational ? '#fde047' : isNepali ? '#fbbf24' : '#ffeb3b',
      gridColor: isDark ? '#374151' : isEducational ? '#d9f99d' : isNepali ? '#fecaca' : '#e5e7eb',
      selectionColor: isDark ? '#3b82f6' : isEducational ? '#16a34a' : isNepali ? '#dc2626' : '#2563eb'
    }
  }, [theme])

  // Initialize responsive canvas
  useEffect(() => {
    if (!containerRef.current || !active) return

    const container = containerRef.current
    const responsiveManager = responsiveManagerRef.current

    // Setup resize handling
    const unsubscribe = responsiveManager.onResize((dimensions) => {
      console.log('Canvas dimensions updated:', dimensions)
      setCanvasDimensions(dimensions)
      
      // Update coordinate system
      coordinateSystemRef.current.updateSizes(dimensions.container, dimensions.canvas)
    })

    // Initialize responsive behavior
    responsiveManager.initialize(container)

    return () => {
      unsubscribe()
      responsiveManager.cleanup()
    }
  }, [active])

  // Setup stage and layer with proper cleanup
  useEffect(() => {
    const stage = stageRef.current
    const layer = layerRef.current
    const memoryManager = memoryManagerRef.current
    
    if (stage && layer && active) {
      console.log('Setting up stage and layer with dimensions:', canvasDimensions.canvas)
      
      // Register resources for cleanup
      memoryManager.registerStage(stage)
      memoryManager.registerLayer(layer)
      
      // Configure stage
      stage.width(canvasDimensions.canvas.width)
      stage.height(canvasDimensions.canvas.height)
      stage.listening(true)
      
      // Configure layer
      layer.listening(true)
      
      // Set refs in store
      setStage(stage)
      setLayer(layer)
      
      // Configure container
      const container = stage.container()
      if (container) {
        container.style.cursor = selectedTool === 'select' ? 'default' : 'crosshair'
        container.tabIndex = 1
        container.style.outline = 'none'
        container.style.pointerEvents = 'auto'
        container.style.userSelect = 'none'
      }
      
      // Force redraw
      layer.batchDraw()
    }

    return () => {
      // Cleanup will be handled by component unmount
    }
  }, [canvasDimensions.canvas.width, canvasDimensions.canvas.height, active, setStage, setLayer])

  // Update cursor when tool changes
  useEffect(() => {
    const stage = stageRef.current
    if (stage) {
      const container = stage.container()
      if (container) {
        let cursor = 'crosshair'
        if (selectedTool === 'select') cursor = 'default'
        else if (selectedTool === 'eraser') cursor = 'grab'
        else if (selectedTool === 'text') cursor = 'text'
        
        container.style.cursor = cursor
      }
    }
  }, [selectedTool])

  // Handle drawing events with proper coordinate transformation
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active) return

    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    // Transform coordinates
    const coordinateSystem = coordinateSystemRef.current
    const worldPos = coordinateSystem.canvasToWorld(pos)

    console.log('Mouse down:', { tool: selectedTool, canvas: pos, world: worldPos })

    // Handle selection tool
    if (selectedTool === 'select') {
      const clickedOnEmpty = e.target === stage
      if (clickedOnEmpty) {
        setSelectedElementId(null)
      }
      return
    }

    // Clear selection when drawing
    setSelectedElementId(null)
    e.evt.preventDefault()
    setIsDrawing(true)

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setCurrentPath([worldPos.x, worldPos.y])
    } else {
      // Create shape immediately
      const colors = getThemeColors()
      const newElement: CanvasElement = {
        id: `${selectedTool}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: selectedTool,
        x: worldPos.x,
        y: worldPos.y,
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
      addElement(newElement)
    }
  }, [active, selectedTool, addElement, userId, getThemeColors])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active || !isDrawing) return

    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    // Transform coordinates
    const coordinateSystem = coordinateSystemRef.current
    const worldPos = coordinateSystem.canvasToWorld(pos)

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setCurrentPath(prev => [...prev, worldPos.x, worldPos.y])
    }
  }, [active, isDrawing, selectedTool])

  const handleMouseUp = useCallback(() => {
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
      addElement(newElement)
      setCurrentPath([])
    }
  }, [active, isDrawing, selectedTool, currentPath, addElement, userId, getThemeColors])

  // Handle element interactions
  const handleElementClick = useCallback((elementId: string) => {
    if (selectedTool === 'select') {
      setSelectedElementId(elementId)
      console.log('Selected element:', elementId)
    }
  }, [selectedTool])

  const handleElementDragEnd = useCallback((elementId: string, newPos: Point) => {
    console.log('Element dragged:', elementId, newPos)
    updateElementPosition(elementId, newPos)
  }, [updateElementPosition])

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current
    const stage = stageRef.current
    
    if (transformer && stage && selectedElementId) {
      const selectedNode = stage.findOne(`#${selectedElementId}`)
      if (selectedNode) {
        transformer.nodes([selectedNode])
        transformer.getLayer()?.batchDraw()
      }
    } else if (transformer) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
    }
  }, [selectedElementId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && selectedTool === 'select') {
          removeElement(selectedElementId)
          setSelectedElementId(null)
        }
      }
      if (e.key === 'Escape') {
        setSelectedElementId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, selectedTool, removeElement])

  // Render canvas elements
  const renderElement = useCallback((element: CanvasElement) => {
    const colors = getThemeColors()
    const isSelected = selectedElementId === element.id
    const memoryManager = memoryManagerRef.current
    
    const commonProps = {
      key: element.id,
      id: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      draggable: selectedTool === 'select',
      onClick: () => handleElementClick(element.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        const pos = e.target.position()
        handleElementDragEnd(element.id, pos)
      },
      shadowColor: isSelected ? colors.selectionColor : undefined,
      shadowBlur: isSelected ? 8 : 0,
      shadowOpacity: isSelected ? 0.4 : 0,
      ref: (node: Konva.Shape | null) => {
        if (node) {
          memoryManager.registerShape(node)
        }
      }
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
  }, [selectedTool, selectedElementId, handleElementClick, handleElementDragEnd, getThemeColors])

  // Update connection status
  useEffect(() => {
    onConnectionChange?.(isConnected)
  }, [isConnected, onConnectionChange])

  // Update cursor information
  useEffect(() => {
    onCursorUpdate?.(cursors)
  }, [cursors, onCursorUpdate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up canvas resources...')
      memoryManagerRef.current.cleanup()
      responsiveManagerRef.current.cleanup()
    }
  }, [])

  const colors = getThemeColors()

  if (!active) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ width: canvasDimensions.canvas.width, height: canvasDimensions.canvas.height }}
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
        touchAction: 'none'
      }}
    >
      <div
        style={{
          width: canvasDimensions.canvas.width,
          height: canvasDimensions.canvas.height,
          margin: '0 auto',
          position: 'relative'
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasDimensions.canvas.width}
          height={canvasDimensions.canvas.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown as any}
          onTouchMove={handleMouseMove as any}
          onTouchEnd={handleMouseUp as any}
        >
          <Layer ref={layerRef}>
            {/* Canvas background */}
            <Rect
              x={0}
              y={0}
              width={canvasDimensions.canvas.width}
              height={canvasDimensions.canvas.height}
              fill={colors.canvasBackground}
            />
            
            {/* Grid pattern */}
            {Array.from({ length: Math.ceil(canvasDimensions.canvas.width / 20) }, (_, i) => (
              <Line
                key={`grid-v-${i}`}
                points={[i * 20, 0, i * 20, canvasDimensions.canvas.height]}
                stroke={colors.gridColor}
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
            {Array.from({ length: Math.ceil(canvasDimensions.canvas.height / 20) }, (_, i) => (
              <Line
                key={`grid-h-${i}`}
                points={[0, i * 20, canvasDimensions.canvas.width, i * 20]}
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
                opacity={0.8}
              />
            )}

            {/* Transformer for selected elements */}
            <Transformer
              ref={transformerRef}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
              rotateEnabled={true}
              borderStroke={colors.selectionColor}
              borderStrokeWidth={1}
              anchorStroke={colors.selectionColor}
              anchorFill={colors.containerBackground}
              anchorSize={8}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox
                }
                return newBox
              }}
              onTransformEnd={(e) => {
                const node = e.target
                const elementId = node.id()
                if (elementId && selectedElementId === elementId) {
                  updateElement(elementId, {
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                    scaleX: node.scaleX(),
                    scaleY: node.scaleY(),
                    width: (node.width() || 100) * node.scaleX(),
                    height: (node.height() || 100) * node.scaleY()
                  })
                  
                  // Reset scale after applying to dimensions
                  node.scaleX(1)
                  node.scaleY(1)
                }
              }}
            />
          </Layer>
        </Stage>
      </div>
      
      {/* Status indicators */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        
        {/* Debug info */}
        <div className="bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
          <div>Tool: {selectedTool}</div>
          <div>Elements: {elements.length}</div>
          <div>Selected: {selectedElementId || 'None'}</div>
          <div>Canvas: {canvasDimensions.canvas.width}×{canvasDimensions.canvas.height}</div>
          <div>Container: {canvasDimensions.container.width}×{canvasDimensions.container.height}</div>
          <div>Scale: {canvasDimensions.scale.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}