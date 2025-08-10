import Konva from 'konva'

/**
 * Manages memory usage and cleanup for canvas resources
 * Prevents memory leaks and optimizes performance
 */
export class CanvasMemoryManager {
  private static instance: CanvasMemoryManager
  private trackedStages = new Set<Konva.Stage>()
  private trackedLayers = new Set<Konva.Layer>()
  private trackedNodes = new Set<Konva.Node>()
  private cleanupCallbacks = new Set<() => void>()
  private isCleaningUp = false

  static getInstance(): CanvasMemoryManager {
    if (!CanvasMemoryManager.instance) {
      CanvasMemoryManager.instance = new CanvasMemoryManager()
    }
    return CanvasMemoryManager.instance
  }

  /**
   * Track a Konva stage for cleanup
   */
  trackStage(stage: Konva.Stage): void {
    this.trackedStages.add(stage)
  }

  /**
   * Track a Konva layer for cleanup
   */
  trackLayer(layer: Konva.Layer): void {
    this.trackedLayers.add(layer)
  }

  /**
   * Track a Konva node for cleanup
   */
  trackNode(node: Konva.Node): void {
    this.trackedNodes.add(node)
  }

  /**
   * Add a cleanup callback
   */
  addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback)
  }

  /**
   * Remove a cleanup callback
   */
  removeCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.delete(callback)
  }

  /**
   * Clean up a specific stage and its resources
   */
  cleanupStage(stage: Konva.Stage): void {
    try {
      this.cleanupStageDirect(stage)
      this.trackedStages.delete(stage)
    } catch (error) {
      console.warn('Error cleaning up stage:', error)
    }
  }

  /**
   * Direct stage cleanup without tracking management
   */
  private cleanupStageDirect(stage: Konva.Stage): void {
    // Check if stage is already destroyed
    if (!stage || stage.isDestroyed?.()) {
      return
    }

    try {
      // Remove all layers and their children
      const layers = stage.getLayers()
      layers.forEach(layer => {
        this.cleanupLayerDirect(layer)
      })

      // Destroy the stage
      stage.destroy()
    } catch (error) {
      // Silently ignore errors during cleanup
      console.debug('Stage cleanup error (ignored):', error)
    }
  }

  /**
   * Clean up a specific layer and its children
   */
  cleanupLayer(layer: Konva.Layer): void {
    try {
      this.cleanupLayerDirect(layer)
      this.trackedLayers.delete(layer)
    } catch (error) {
      console.warn('Error cleaning up layer:', error)
    }
  }

  /**
   * Direct layer cleanup without tracking management
   */
  private cleanupLayerDirect(layer: Konva.Layer): void {
    // Check if layer is already destroyed
    if (!layer || layer.isDestroyed?.()) {
      return
    }

    try {
      // Destroy all children
      const children = layer.getChildren()
      children.forEach(child => {
        this.cleanupNodeDirect(child)
      })

      // Destroy the layer
      layer.destroy()
    } catch (error) {
      // Silently ignore errors during cleanup
      console.debug('Layer cleanup error (ignored):', error)
    }
  }

  /**
   * Clean up a specific node
   */
  cleanupNode(node: Konva.Node): void {
    try {
      this.cleanupNodeDirect(node)
      this.trackedNodes.delete(node)
    } catch (error) {
      console.warn('Error cleaning up node:', error)
    }
  }

  /**
   * Direct node cleanup without tracking management
   */
  private cleanupNodeDirect(node: Konva.Node): void {
    // Check if node is already destroyed
    if (!node || node.isDestroyed?.()) {
      return
    }

    try {
      // If it's a group, clean up children first
      if (node instanceof Konva.Group) {
        const children = node.getChildren()
        children.forEach(child => {
          this.cleanupNodeDirect(child)
        })
      }

      // Remove event listeners
      node.off()

      // Destroy the node
      node.destroy()
    } catch (error) {
      // Silently ignore errors during cleanup
      console.debug('Node cleanup error (ignored):', error)
    }
  }

  /**
   * Clean up all tracked resources
   */
  cleanupAll(): void {
    // Prevent recursive cleanup calls
    if (this.isCleaningUp) {
      return
    }
    
    this.isCleaningUp = true
    
    try {
      // Execute cleanup callbacks first
      const callbacks = Array.from(this.cleanupCallbacks)
      this.cleanupCallbacks.clear() // Clear immediately to prevent recursion
      
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.warn('Error executing cleanup callback:', error)
        }
      })

      // Clean up all tracked nodes
      const nodes = Array.from(this.trackedNodes)
      this.trackedNodes.clear()
      nodes.forEach(node => {
        try {
          this.cleanupNodeDirect(node)
        } catch (error) {
          console.warn('Error cleaning up node:', error)
        }
      })

      // Clean up all tracked layers
      const layers = Array.from(this.trackedLayers)
      this.trackedLayers.clear()
      layers.forEach(layer => {
        try {
          this.cleanupLayerDirect(layer)
        } catch (error) {
          console.warn('Error cleaning up layer:', error)
        }
      })

      // Clean up all tracked stages
      const stages = Array.from(this.trackedStages)
      this.trackedStages.clear()
      stages.forEach(stage => {
        try {
          this.cleanupStageDirect(stage)
        } catch (error) {
          console.warn('Error cleaning up stage:', error)
        }
      })
    } finally {
      this.isCleaningUp = false
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    stages: number
    layers: number
    nodes: number
    callbacks: number
  } {
    return {
      stages: this.trackedStages.size,
      layers: this.trackedLayers.size,
      nodes: this.trackedNodes.size,
      callbacks: this.cleanupCallbacks.size
    }
  }

  /**
   * Force garbage collection if available (for development/testing)
   */
  forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        ;(window as any).gc()
      } catch (error) {
        console.warn('Garbage collection not available:', error)
      }
    }
  }

  /**
   * Optimize canvas performance by limiting the number of nodes
   */
  optimizePerformance(layer: Konva.Layer, maxNodes: number = 1000): void {
    const children = layer.getChildren()
    
    if (children.length > maxNodes) {
      // Remove oldest nodes (assuming they were added in chronological order)
      const nodesToRemove = children.slice(0, children.length - maxNodes)
      nodesToRemove.forEach(node => {
        this.cleanupNode(node)
      })
      
      console.log(`Removed ${nodesToRemove.length} nodes to optimize performance`)
    }
  }

  /**
   * Monitor memory usage and warn if it gets too high
   */
  monitorMemoryUsage(): void {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory
      const usedMB = memory.usedJSHeapSize / 1024 / 1024
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024
      
      const usagePercent = (usedMB / limitMB) * 100
      
      if (usagePercent > 80) {
        console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`)
        
        // Suggest cleanup
        if (usagePercent > 90) {
          console.warn('Consider cleaning up canvas resources to prevent memory issues')
        }
      }
    }
  }

  /**
   * Reset the memory manager to initial state
   */
  reset(): void {
    this.isCleaningUp = false
    this.trackedStages.clear()
    this.trackedLayers.clear()
    this.trackedNodes.clear()
    this.cleanupCallbacks.clear()
  }
}

/**
 * Hook for React components to use canvas memory management
 */
export function useCanvasMemoryManager() {
  const memoryManager = CanvasMemoryManager.getInstance()

  const trackStage = (stage: Konva.Stage) => memoryManager.trackStage(stage)
  const trackLayer = (layer: Konva.Layer) => memoryManager.trackLayer(layer)
  const trackNode = (node: Konva.Node) => memoryManager.trackNode(node)
  const addCleanupCallback = (callback: () => void) => memoryManager.addCleanupCallback(callback)
  const removeCleanupCallback = (callback: () => void) => memoryManager.removeCleanupCallback(callback)
  const cleanupAll = () => memoryManager.cleanupAll()
  const getMemoryStats = () => memoryManager.getMemoryStats()
  const reset = () => memoryManager.reset()

  return {
    trackStage,
    trackLayer,
    trackNode,
    addCleanupCallback,
    removeCleanupCallback,
    cleanupAll,
    getMemoryStats,
    reset,
    memoryManager
  }
}