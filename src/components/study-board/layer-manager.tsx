'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { CanvasElement } from '@/types/study-board'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import {
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    GripVertical,
    Layers,
    Plus,
    Trash2
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface LayerInfo {
  layer: number
  elements: CanvasElement[]
  visible: boolean
  name: string
}

interface LayerManagerProps {
  className?: string
}

export function LayerManager({ className = '' }: LayerManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hiddenLayers, setHiddenLayers] = useState<Set<number>>(new Set())
  const { elements, updateElement, removeElement } = useStudyBoardStore()

  // Group elements by layer
  const layers = useMemo(() => {
    const layerMap = new Map<number, CanvasElement[]>()
    
    elements.forEach(element => {
      const layer = element.layer || 0
      if (!layerMap.has(layer)) {
        layerMap.set(layer, [])
      }
      layerMap.get(layer)!.push(element)
    })

    const layerInfos: LayerInfo[] = []
    const sortedLayers = Array.from(layerMap.keys()).sort((a, b) => b - a) // Higher layers first

    sortedLayers.forEach(layerNum => {
      layerInfos.push({
        layer: layerNum,
        elements: layerMap.get(layerNum) || [],
        visible: !hiddenLayers.has(layerNum),
        name: `Layer ${layerNum}`,
      })
    })

    return layerInfos
  }, [elements, hiddenLayers])

  const toggleLayerVisibility = (layer: number) => {
    const newHiddenLayers = new Set(hiddenLayers)
    if (hiddenLayers.has(layer)) {
      newHiddenLayers.delete(layer)
    } else {
      newHiddenLayers.add(layer)
    }
    setHiddenLayers(newHiddenLayers)

    // Update visibility of elements in the layer
    const layerElements = elements.filter(el => el.layer === layer)
    layerElements.forEach(element => {
      // In a real implementation, you'd update the Konva objects' visibility
      // For now, we'll just track the hidden state
    })
  }

  const moveElementToLayer = (elementId: string, newLayer: number) => {
    updateElement(elementId, { layer: newLayer })
  }

  const moveLayerUp = (layer: number) => {
    const layerElements = elements.filter(el => el.layer === layer)
    layerElements.forEach(element => {
      updateElement(element.id, { layer: layer + 1 })
    })
  }

  const moveLayerDown = (layer: number) => {
    const layerElements = elements.filter(el => el.layer === layer)
    layerElements.forEach(element => {
      updateElement(element.id, { layer: Math.max(0, layer - 1) })
    })
  }

  const deleteLayer = (layer: number) => {
    if (window.confirm(`Are you sure you want to delete Layer ${layer} and all its elements?`)) {
      const layerElements = elements.filter(el => el.layer === layer)
      layerElements.forEach(element => {
        removeElement(element.id)
      })
    }
  }

  const createNewLayer = () => {
    const maxLayer = Math.max(...elements.map(el => el.layer || 0), 0)
    // New layer will be created when elements are added to it
    console.log(`New layer ${maxLayer + 1} will be created when elements are added`)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index
    
    if (sourceIndex === destIndex) return

    // Reorder layers by updating layer numbers
    const reorderedLayers = [...layers]
    const [movedLayer] = reorderedLayers.splice(sourceIndex, 1)
    reorderedLayers.splice(destIndex, 0, movedLayer)

    // Update layer numbers for all elements
    reorderedLayers.forEach((layerInfo, index) => {
      const newLayerNumber = reorderedLayers.length - 1 - index // Reverse order for display
      if (layerInfo.layer !== newLayerNumber) {
        layerInfo.elements.forEach(element => {
          updateElement(element.id, { layer: newLayerNumber })
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`${className} text-xs lg:text-sm`}>
          <Layers className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Layers</span>
          <span className="sm:hidden">Lay</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>Layer Manager</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* New Layer Button */}
          <Button 
            onClick={createNewLayer}
            size="sm" 
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Layer
          </Button>

          {/* Layers List */}
          <div className="max-h-96 overflow-y-auto">
            {layers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No layers found. Add some elements to create layers.
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="layers">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {layers.map((layerInfo, index) => (
                        <Draggable 
                          key={layerInfo.layer} 
                          draggableId={layerInfo.layer.toString()} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border border-gray-200 rounded-lg p-3 bg-white ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                  </div>
                                  <span className="font-medium text-sm">
                                    {layerInfo.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({layerInfo.elements.length} elements)
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleLayerVisibility(layerInfo.layer)}
                                    className="w-6 h-6 p-0"
                                  >
                                    {layerInfo.visible ? (
                                      <Eye className="w-3 h-3" />
                                    ) : (
                                      <EyeOff className="w-3 h-3" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveLayerUp(layerInfo.layer)}
                                    className="w-6 h-6 p-0"
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveLayerDown(layerInfo.layer)}
                                    className="w-6 h-6 p-0"
                                    disabled={index === layers.length - 1}
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteLayer(layerInfo.layer)}
                                    className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Layer Elements */}
                              {layerInfo.elements.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {layerInfo.elements.slice(0, 3).map(element => (
                                    <div 
                                      key={element.id}
                                      className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded flex items-center justify-between"
                                    >
                                      <span>
                                        {element.type} - {element.id.substring(0, 8)}...
                                      </span>
                                      <select
                                        value={element.layer}
                                        onChange={(e) => moveElementToLayer(element.id, parseInt(e.target.value))}
                                        className="text-xs border-none bg-transparent"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {Array.from(new Set(elements.map(el => el.layer || 0)))
                                          .sort((a, b) => b - a)
                                          .map(layerNum => (
                                            <option key={layerNum} value={layerNum}>
                                              Layer {layerNum}
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                  ))}
                                  {layerInfo.elements.length > 3 && (
                                    <div className="text-xs text-gray-500 px-2">
                                      +{layerInfo.elements.length - 3} more elements
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}