'use client'

import { Button } from '@/components/ui/button'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import Konva from 'konva'
import {
    Map,
    Maximize,
    Move,
    RotateCcw,
    ZoomIn,
    ZoomOut
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface CanvasNavigationProps {
  stage: Konva.Stage | null
  className?: string
}

interface ViewportState {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

export function CanvasNavigation({ stage, className = '' }: CanvasNavigationProps) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isPanning, setIsPanning] = useState(false)
  const [showMinimap, setShowMinimap] = useState(false)
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
  const minimapRef = useRef<HTMLCanvasElement>(null)
  const { elements } = useStudyBoardStore()

  // Update viewport state when stage changes
  useEffect(() => {
    if (!stage) return

    const updateViewport = () => {
      setViewport({
        x: stage.x(),
        y: stage.y(),
        scaleX: stage.scaleX(),
        scaleY: stage.scaleY(),
      })
      setZoomLevel(Math.round(stage.scaleX() * 100))
    }

    updateViewport()
    
    // Listen for stage transformations
    stage.on('dragend', updateViewport)
    stage.on('scalechange', updateViewport)

    return () => {
      stage.off('dragend', updateViewport)
      stage.off('scalechange', updateViewport)
    }
  }, [stage])

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (!stage) return
    
    const oldScale = stage.scaleX()
    const newScale = Math.min(oldScale * 1.2, 5) // Max zoom 500%
    
    const pointer = stage.getPointerPosition() || { x: stage.width() / 2, y: stage.height() / 2 }
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    stage.scale({ x: newScale, y: newScale })
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    
    stage.position(newPos)
    stage.batchDraw()
  }, [stage])

  const zoomOut = useCallback(() => {
    if (!stage) return
    
    const oldScale = stage.scaleX()
    const newScale = Math.max(oldScale / 1.2, 0.1) // Min zoom 10%
    
    const pointer = stage.getPointerPosition() || { x: stage.width() / 2, y: stage.height() / 2 }
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    stage.scale({ x: newScale, y: newScale })
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    
    stage.position(newPos)
    stage.batchDraw()
  }, [stage])

  const resetZoom = useCallback(() => {
    if (!stage) return
    
    stage.scale({ x: 1, y: 1 })
    stage.position({ x: 0, y: 0 })
    stage.batchDraw()
  }, [stage])

  const fitToScreen = useCallback(() => {
    if (!stage || elements.length === 0) return

    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    elements.forEach(element => {
      const x = element.position.x
      const y = element.position.y
      let width = 0, height = 0

      if (element.type === 'shape') {
        width = element.properties.width || 0
        height = element.properties.height || 0
      } else if (element.type === 'sticky') {
        width = element.properties.width || 0
        height = element.properties.height || 0
      } else if (element.type === 'text') {
        width = element.properties.width || 100
        height = element.properties.height || 20
      }

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
    })

    if (minX === Infinity) return

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const padding = 50

    const scaleX = (stage.width() - padding * 2) / contentWidth
    const scaleY = (stage.height() - padding * 2) / contentHeight
    const scale = Math.min(scaleX, scaleY, 1) // Don't zoom in beyond 100%

    stage.scale({ x: scale, y: scale })
    stage.position({
      x: (stage.width() - contentWidth * scale) / 2 - minX * scale,
      y: (stage.height() - contentHeight * scale) / 2 - minY * scale,
    })
    stage.batchDraw()
  }, [stage, elements])

  const togglePanning = useCallback(() => {
    if (!stage) return
    
    setIsPanning(!isPanning)
    stage.draggable(!isPanning)
  }, [stage, isPanning])

  // Minimap functionality
  const updateMinimap = useCallback(() => {
    if (!minimapRef.current || !stage) return

    const minimap = minimapRef.current
    const ctx = minimap.getContext('2d')
    if (!ctx) return

    const minimapWidth = 200
    const minimapHeight = 150
    const stageWidth = stage.width()
    const stageHeight = stage.height()

    // Clear minimap
    ctx.clearRect(0, 0, minimapWidth, minimapHeight)

    // Draw background
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, minimapWidth, minimapHeight)

    // Calculate scale for minimap
    const scaleX = minimapWidth / stageWidth
    const scaleY = minimapHeight / stageHeight
    const scale = Math.min(scaleX, scaleY)

    // Draw elements as simplified shapes
    elements.forEach(element => {
      const x = element.position.x * scale
      const y = element.position.y * scale

      ctx.fillStyle = element.type === 'sticky' ? element.properties.color || '#ffeb3b' : '#e0e0e0'
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1

      if (element.type === 'shape') {
        const width = (element.properties.width || 0) * scale
        const height = (element.properties.height || 0) * scale
        
        if (element.properties.shapeType === 'circle') {
          ctx.beginPath()
          ctx.arc(x + width / 2, y + height / 2, width / 2, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
        } else {
          ctx.fillRect(x, y, width, height)
          ctx.strokeRect(x, y, width, height)
        }
      } else {
        const width = (element.properties.width || 50) * scale
        const height = (element.properties.height || 20) * scale
        ctx.fillRect(x, y, width, height)
        ctx.strokeRect(x, y, width, height)
      }
    })

    // Draw viewport indicator
    const viewportX = (-viewport.x / viewport.scaleX) * scale
    const viewportY = (-viewport.y / viewport.scaleY) * scale
    const viewportWidth = (stageWidth / viewport.scaleX) * scale
    const viewportHeight = (stageHeight / viewport.scaleY) * scale

    ctx.strokeStyle = '#2196f3'
    ctx.lineWidth = 2
    ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight)
  }, [elements, viewport])

  useEffect(() => {
    if (showMinimap) {
      updateMinimap()
    }
  }, [showMinimap, updateMinimap])

  // Handle minimap click
  const handleMinimapClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!stage || !minimapRef.current) return

    const rect = minimapRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const minimapWidth = 200
    const minimapHeight = 150
    const stageWidth = stage.width()
    const stageHeight = stage.height()

    const scaleX = minimapWidth / stageWidth
    const scaleY = minimapHeight / stageHeight
    const scale = Math.min(scaleX, scaleY)

    const targetX = -(x / scale - stageWidth / 2)
    const targetY = -(y / scale - stageHeight / 2)

    stage.position({ x: targetX, y: targetY })
    stage.batchDraw()
  }, [stage])

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Zoom Controls */}
      <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg p-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={zoomOut}
          className="w-6 h-6 lg:w-8 lg:h-8 p-0"
          title="Zoom Out"
        >
          <ZoomOut className="w-3 h-3 lg:w-4 lg:h-4" />
        </Button>
        
        <div className="px-1 lg:px-2 text-xs lg:text-sm font-medium min-w-[40px] lg:min-w-[50px] text-center">
          {zoomLevel}%
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={zoomIn}
          className="w-6 h-6 lg:w-8 lg:h-8 p-0"
          title="Zoom In"
        >
          <ZoomIn className="w-3 h-3 lg:w-4 lg:h-4" />
        </Button>
        
        <div className="w-px h-4 lg:h-6 bg-gray-200" />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={resetZoom}
          className="w-6 h-6 lg:w-8 lg:h-8 p-0"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3 h-3 lg:w-4 lg:h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={fitToScreen}
          className="w-6 h-6 lg:w-8 lg:h-8 p-0"
          title="Fit to Screen"
        >
          <Maximize className="w-3 h-3 lg:w-4 lg:h-4" />
        </Button>
        
        <div className="w-px h-4 lg:h-6 bg-gray-200" />
        
        <Button
          size="sm"
          variant={isPanning ? "default" : "ghost"}
          onClick={togglePanning}
          className="w-6 h-6 lg:w-8 lg:h-8 p-0"
          title="Pan Mode"
        >
          <Move className="w-3 h-3 lg:w-4 lg:h-4" />
        </Button>
        
        <Button
          size="sm"
          variant={showMinimap ? "default" : "ghost"}
          onClick={() => setShowMinimap(!showMinimap)}
          className="w-6 h-6 lg:w-8 lg:h-8 p-0"
          title="Toggle Minimap"
        >
          <Map className="w-3 h-3 lg:w-4 lg:h-4" />
        </Button>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <div className="text-xs font-medium text-gray-600 mb-2">Minimap</div>
          <canvas
            ref={minimapRef}
            width={150}
            height={112}
            className="border border-gray-300 cursor-pointer lg:w-[200px] lg:h-[150px]"
            onClick={handleMinimapClick}
            style={{ width: '150px', height: '112px' }}
          />
        </div>
      )}
    </div>
  )
}