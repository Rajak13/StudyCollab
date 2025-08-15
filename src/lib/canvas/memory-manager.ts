/**
 * Canvas Memory Manager
 * Handles memory cleanup and resource management for canvas components
 */

import Konva from 'konva'

export interface CanvasResources {
  stage?: Konva.Stage
  layers: Konva.Layer[]
  shapes: Konva.Shape[]
  groups: Konva.Group[]
  animations: Konva.Animation[]
  resizeObserver?: ResizeObserver
  eventListeners: Array<{
    element: EventTarget
    event: string
    handler: EventListener
  }>
}

export class MemoryManager {
  private resources: CanvasResources = {
    layers: [],
    shapes: [],
    groups: [],
    animations: [],
    eventListeners: []
  }

  /**
   * Register a stage for cleanup
   */
  registerStage(stage: Konva.Stage): void {
    this.resources.stage = stage
  }

  /**
   * Register a layer for cleanup
   */
  registerLayer(layer: Konva.Layer): void {
    if (!this.resources.layers.includes(layer)) {
      this.resources.layers.push(layer)
    }
  }

  /**
   * Register a shape for cleanup
   */
  registerShape(shape: Konva.Shape): void {
    if (!this.resources.shapes.includes(shape)) {
      this.resources.shapes.push(shape)
    }
  }

  /**
   * Register a group for cleanup
   */
  registerGroup(group: Konva.Group): void {
    if (!this.resources.groups.includes(group)) {
      this.resources.groups.push(group)
    }
  }

  /**
   * Register an animation for cleanup
   */
  registerAnimation(animation: Konva.Animation): void {
    if (!this.resources.animations.includes(animation)) {
      this.resources.animations.push(animation)
    }
  }

  /**
   * Register a ResizeObserver for cleanup
   */
  registerResizeObserver(observer: ResizeObserver): void {
    this.resources.resizeObserver = observer
  }

  /**
   * Register an event listener for cleanup
   */
  registerEventListener(element: EventTarget, event: string, handler: EventListener): void {
    this.resources.eventListeners.push({ element, event, handler })
    element.addEventListener(event, handler)
  }

  /**
   * Unregister and cleanup a specific shape
   */
  unregisterShape(shape: Konva.Shape): void {
    const index = this.resources.shapes.indexOf(shape)
    if (index > -1) {
      this.resources.shapes.splice(index, 1)
      this.cleanupShape(shape)
    }
  }

  /**
   * Unregister and cleanup a specific group
   */
  unregisterGroup(group: Konva.Group): void {
    const index = this.resources.groups.indexOf(group)
    if (index > -1) {
      this.resources.groups.splice(index, 1)
      this.cleanupGroup(group)
    }
  }

  /**
   * Clean up a specific shape
   */
  private cleanupShape(shape: Konva.Shape): void {
    try {
      // Remove event listeners
      shape.off()
      
      // Remove from parent
      shape.remove()
      
      // Destroy the shape
      shape.destroy()
    } catch (error) {
      console.warn('Error cleaning up shape:', error)
    }
  }

  /**
   * Clean up a specific group
   */
  private cleanupGroup(group: Konva.Group): void {
    try {
      // Clean up all children first
      const children = group.getChildren()
      children.forEach(child => {
        if (child instanceof Konva.Shape) {
          this.cleanupShape(child)
        } else if (child instanceof Konva.Group) {
          this.cleanupGroup(child)
        }
      })
      
      // Remove event listeners
      group.off()
      
      // Remove from parent
      group.remove()
      
      // Destroy the group
      group.destroy()
    } catch (error) {
      console.warn('Error cleaning up group:', error)
    }
  }

  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    console.log('Starting canvas memory cleanup...')

    // Stop and cleanup animations
    this.resources.animations.forEach(animation => {
      try {
        animation.stop()
      } catch (error) {
        console.warn('Error cleaning up animation:', error)
      }
    })
    this.resources.animations = []

    // Cleanup shapes
    this.resources.shapes.forEach(shape => this.cleanupShape(shape))
    this.resources.shapes = []

    // Cleanup groups
    this.resources.groups.forEach(group => this.cleanupGroup(group))
    this.resources.groups = []

    // Cleanup layers
    this.resources.layers.forEach(layer => {
      try {
        layer.destroyChildren()
        layer.off()
        layer.remove()
        layer.destroy()
      } catch (error) {
        console.warn('Error cleaning up layer:', error)
      }
    })
    this.resources.layers = []

    // Cleanup stage
    if (this.resources.stage) {
      try {
        this.resources.stage.destroyChildren()
        this.resources.stage.off()
        this.resources.stage.destroy()
      } catch (error) {
        console.warn('Error cleaning up stage:', error)
      }
      this.resources.stage = undefined
    }

    // Cleanup ResizeObserver
    if (this.resources.resizeObserver) {
      try {
        this.resources.resizeObserver.disconnect()
      } catch (error) {
        console.warn('Error cleaning up ResizeObserver:', error)
      }
      this.resources.resizeObserver = undefined
    }

    // Cleanup event listeners
    this.resources.eventListeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler)
      } catch (error) {
        console.warn('Error removing event listener:', error)
      }
    })
    this.resources.eventListeners = []

    console.log('Canvas memory cleanup completed')
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    stages: number
    layers: number
    shapes: number
    groups: number
    animations: number
    eventListeners: number
  } {
    return {
      stages: this.resources.stage ? 1 : 0,
      layers: this.resources.layers.length,
      shapes: this.resources.shapes.length,
      groups: this.resources.groups.length,
      animations: this.resources.animations.length,
      eventListeners: this.resources.eventListeners.length
    }
  }

  /**
   * Force garbage collection if available (development only)
   */
  forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && 'gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc()
        console.log('Forced garbage collection')
      } catch (error) {
        console.warn('Could not force garbage collection:', error)
      }
    }
  }
}