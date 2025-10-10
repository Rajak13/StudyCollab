import Konva from 'konva'

export interface CanvasMemoryManager {
  trackStage: (stage: Konva.Stage) => void
  trackLayer: (layer: Konva.Layer) => void
  cleanupAll: () => void
}

export function useCanvasMemoryManager(): CanvasMemoryManager {
  const stages = new Set<Konva.Stage>()
  const layers = new Set<Konva.Layer>()

  const trackStage = (stage: Konva.Stage) => {
    stages.add(stage)
  }

  const trackLayer = (layer: Konva.Layer) => {
    layers.add(layer)
  }

  const cleanupAll = () => {
    // Clean up stages
    stages.forEach(stage => {
      try {
        stage.destroy()
      } catch (error) {
        console.warn('Error destroying stage:', error)
      }
    })
    stages.clear()

    // Clean up layers
    layers.forEach(layer => {
      try {
        layer.destroy()
      } catch (error) {
        console.warn('Error destroying layer:', error)
      }
    })
    layers.clear()
  }

  return {
    trackStage,
    trackLayer,
    cleanupAll
  }
}