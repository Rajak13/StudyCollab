'use client'

import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { CanvasElement, DrawingTool, Point } from '@/types/study-board'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, Layer, Line, Rect, Stage, Text } from 'react-konva'

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
}

export function CollaborativeCanvas({
  groupId,
  userId,
  userName,
  width = 1200,
  height = 800,
  className = '',
  onCursorUpdate,
  onConnectionChange,
}: CollaborativeCanvasProps) {
  const stageRef = useRef<any>(null)
  const layerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<number[]>([])
  const [isConnected, setIsConnected] = useState(true) // Simulate connection for now
  const [cursors] = useState<Map<string, UserCursor>>(new Map())
  
  const {
    elements,
    selectedTool,
    setStage,
    setLayer,
    addElement,
  } = useStudyBoardStore()

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newWidth = Math.max(rect.width - 20, 800)
        const newHeight = Math.max(rect.height - 20, 600)
        
        setCanvasSize({ width: newWidth, height: newHeight })
      }
    }

    handleResize()
    const resizeObserver = new ResizeObserver(handleResize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Set stage and layer references
  useEffect(() => {
    if (stageRef.current && layerRef.current) {
      setStage(stageRef.current)
      setLayer(layerRef.current)
    }
  }, [setStage, setLayer])

  // Notify parent components about connection status
  useEffect(() => {
    onConnectionChange?.(isConnected)
    onCursorUpdate?.(cursors)
  }, [isConnected, cursors, onConnectionChange, onCursorUpdate])

  // Handle mouse events
  const handleMouseDown = useCallback((e: any) => {
    if (selectedTool === 'select') return

    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return

    setIsDrawing(true)

    if (selectedTool === 'pen') {
      setCurrentPath([pos.x, pos.y])
    } else {
      handleToolAction(selectedTool, pos)
    }
  }, [selectedTool])

  const handleMouseMove = useCallback((e: any) => {
    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return

    if (isDrawing && selectedTool === 'pen') {
      setCurrentPath(prev => [...prev, pos.x, pos.y])
    }
  }, [isDrawing, selectedTool])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)

    if (selectedTool === 'pen' && currentPath.length > 0) {
      const drawingElement: CanvasElement = {
        id: `drawing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'drawing',
        position: { x: currentPath[0], y: currentPath[1] },
        layer: 0,
        properties: {
          path: currentPath.join(','),
          strokeWidth: 2,
          strokeColor: '#000000',
        },
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addElement(drawingElement)
      setCurrentPath([])
    }
  }, [isDrawing, selectedTool, currentPath, userId, addElement])

  const handleToolAction = useCallback((tool: DrawingTool, position: Point) => {
    let element: CanvasElement

    switch (tool) {
      case 'text':
        element = {
          id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'text',
          position,
          layer: 0,
          properties: {
            text: 'Double click to edit',
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000',
          },
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        break

      case 'sticky':
        element = {
          id: `sticky_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'sticky',
          position,
          layer: 0,
          properties: {
            text: 'New note',
            color: '#ffeb3b',
            width: 150,
            height: 150,
            fontSize: 14,
          },
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        break

      case 'rectangle':
        element = {
          id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'shape',
          position,
          layer: 0,
          properties: {
            shapeType: 'rectangle',
            width: 100,
            height: 100,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
          },
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        break

      case 'circle':
        element = {
          id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'shape',
          position,
          layer: 0,
          properties: {
            shapeType: 'circle',
            width: 100,
            height: 100,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
          },
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        break

      default:
        return
    }

    addElement(element)
  }, [userId, addElement])

  // Render canvas elements
  const renderElement = useCallback((element: CanvasElement) => {
    const key = element.id

    switch (element.type) {
      case 'drawing':
        const pathPoints = element.properties.path.split(',').map(Number)
        return (
          <Line
            key={key}
            points={pathPoints}
            stroke={element.properties.strokeColor}
            strokeWidth={element.properties.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            draggable={selectedTool === 'select'}
          />
        )

      case 'text':
        return (
          <Text
            key={key}
            x={element.position.x}
            y={element.position.y}
            text={element.properties.text}
            fontSize={element.properties.fontSize}
            fontFamily={element.properties.fontFamily}
            fill={element.properties.color}
            draggable={selectedTool === 'select'}
          />
        )

      case 'sticky':
        return (
          <React.Fragment key={key}>
            <Rect
              x={element.position.x}
              y={element.position.y}
              width={element.properties.width}
              height={element.properties.height}
              fill={element.properties.color}
              stroke="#fbc02d"
              strokeWidth={1}
              draggable={selectedTool === 'select'}
            />
            <Text
              x={element.position.x + 10}
              y={element.position.y + 10}
              text={element.properties.text}
              fontSize={element.properties.fontSize}
              fill="#000000"
              width={element.properties.width - 20}
              height={element.properties.height - 20}
              align="left"
              verticalAlign="top"
              draggable={false}
            />
          </React.Fragment>
        )

      case 'shape':
        if (element.properties.shapeType === 'rectangle') {
          return (
            <Rect
              key={key}
              x={element.position.x}
              y={element.position.y}
              width={element.properties.width}
              height={element.properties.height}
              fill={element.properties.fill}
              stroke={element.properties.stroke}
              strokeWidth={element.properties.strokeWidth}
              draggable={selectedTool === 'select'}
            />
          )
        } else if (element.properties.shapeType === 'circle') {
          return (
            <Circle
              key={key}
              x={element.position.x + element.properties.width / 2}
              y={element.position.y + element.properties.height / 2}
              radius={element.properties.width / 2}
              fill={element.properties.fill}
              stroke={element.properties.stroke}
              strokeWidth={element.properties.strokeWidth}
              draggable={selectedTool === 'select'}
            />
          )
        } else if (element.properties.shapeType === 'line') {
          return (
            <Line
              key={key}
              points={[
                element.position.x,
                element.position.y,
                element.position.x + element.properties.width,
                element.position.y + element.properties.height
              ]}
              stroke={element.properties.stroke}
              strokeWidth={element.properties.strokeWidth}
              draggable={selectedTool === 'select'}
            />
          )
        }
        break

      default:
        return null
    }
  }, [selectedTool])

  return (
    <div 
      ref={containerRef}
      className={`canvas-container relative ${className}`} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '600px',
        backgroundColor: '#f8f9fa',
        overflow: 'auto'
      }}
    >
      <div style={{
        width: canvasSize.width,
        height: canvasSize.height,
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        borderRadius: '4px',
        position: 'relative'
      }}>
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
        >
          <Layer ref={layerRef}>
            {/* Render existing elements */}
            {elements.map(renderElement)}
            
            {/* Render current drawing path */}
            {isDrawing && selectedTool === 'pen' && currentPath.length > 0 && (
              <Line
                points={currentPath}
                stroke="#000000"
                strokeWidth={2}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </Layer>
        </Stage>

        {/* Connection status */}
        <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 border border-gray-200">
          <span className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'} ({cursors.size + 1} users)
          </span>
        </div>
      </div>
    </div>
  )
}