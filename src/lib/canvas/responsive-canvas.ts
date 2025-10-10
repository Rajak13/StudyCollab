/**
 * Responsive Canvas Manager
 * Handles responsive sizing and container detection for canvas components
 */

import { Size } from './coordinate-system'

export interface ResponsiveCanvasConfig {
  maintainAspectRatio: boolean
  aspectRatio?: number
  minWidth: number
  minHeight: number
  maxWidth?: number
  maxHeight?: number
  padding: number
  autoResize: boolean
}

export interface CanvasDimensions {
  container: Size
  canvas: Size
  scale: number
  offset: { x: number; y: number }
}

export class ResponsiveCanvasManager {
  private config: ResponsiveCanvasConfig
  private resizeObserver?: ResizeObserver
  private resizeCallbacks: Array<(dimensions: CanvasDimensions) => void> = []
  private lastDimensions?: CanvasDimensions
  private resizeTimeout?: NodeJS.Timeout

  constructor(config: Partial<ResponsiveCanvasConfig> = {}) {
    this.config = {
      maintainAspectRatio: true,
      aspectRatio: 3/2,
      minWidth: 400,
      minHeight: 300,
      padding: 20,
      autoResize: true,
      ...config
    }
  }

  /**
   * Initialize responsive behavior for a container element
   */
  initialize(containerElement: HTMLElement): void {
    if (!containerElement) {
      console.warn('ResponsiveCanvasManager: Container element is required')
      return
    }

    this.cleanup()

    if (this.config.autoResize) {
      this.setupResizeObserver(containerElement)
    }

    // Calculate initial dimensions
    const rect = containerElement.getBoundingClientRect()
    const dimensions = this.calculateDimensions({
      width: rect.width,
      height: rect.height
    })

    this.lastDimensions = dimensions
    this.notifyResize(dimensions)
  }

  /**
   * Setup ResizeObserver for automatic resize handling
   */
  private setupResizeObserver(containerElement: HTMLElement): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return

      // Debounce resize events
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }

      this.resizeTimeout = setTimeout(() => {
        const entry = entries[0]
        const { width, height } = entry.contentRect

        const dimensions = this.calculateDimensions({ width, height })
        
        // Only notify if dimensions actually changed
        if (!this.lastDimensions || this.dimensionsChanged(this.lastDimensions, dimensions)) {
          this.lastDimensions = dimensions
          this.notifyResize(dimensions)
        }
      }, 16) // ~60fps
    })

    this.resizeObserver.observe(containerElement)
  }

  /**
   * Check if dimensions have changed significantly
   */
  private dimensionsChanged(prev: CanvasDimensions, current: CanvasDimensions): boolean {
    const threshold = 1 // 1px threshold
    return (
      Math.abs(prev.container.width - current.container.width) > threshold ||
      Math.abs(prev.container.height - current.container.height) > threshold ||
      Math.abs(prev.canvas.width - current.canvas.width) > threshold ||
      Math.abs(prev.canvas.height - current.canvas.height) > threshold
    )
  }

  /**
   * Calculate optimal canvas dimensions for a given container size
   */
  calculateDimensions(containerSize: Size): CanvasDimensions {
    const availableWidth = Math.max(containerSize.width - this.config.padding * 2, this.config.minWidth)
    const availableHeight = Math.max(containerSize.height - this.config.padding * 2, this.config.minHeight)

    let canvasWidth = availableWidth
    let canvasHeight = availableHeight

    // Apply aspect ratio constraints
    if (this.config.maintainAspectRatio && this.config.aspectRatio) {
      const containerAspectRatio = availableWidth / availableHeight
      
      if (containerAspectRatio > this.config.aspectRatio) {
        // Container is wider than desired aspect ratio
        canvasWidth = availableHeight * this.config.aspectRatio
        canvasHeight = availableHeight
      } else {
        // Container is taller than desired aspect ratio
        canvasWidth = availableWidth
        canvasHeight = availableWidth / this.config.aspectRatio
      }
    }

    // Apply size constraints
    canvasWidth = Math.max(this.config.minWidth, canvasWidth)
    canvasHeight = Math.max(this.config.minHeight, canvasHeight)

    if (this.config.maxWidth) {
      canvasWidth = Math.min(this.config.maxWidth, canvasWidth)
    }
    if (this.config.maxHeight) {
      canvasHeight = Math.min(this.config.maxHeight, canvasHeight)
    }

    // Ensure canvas fits within container
    if (canvasWidth > availableWidth) {
      const scale = availableWidth / canvasWidth
      canvasWidth = availableWidth
      canvasHeight = canvasHeight * scale
    }
    if (canvasHeight > availableHeight) {
      const scale = availableHeight / canvasHeight
      canvasHeight = availableHeight
      canvasWidth = canvasWidth * scale
    }

    // Calculate positioning
    const offsetX = (containerSize.width - canvasWidth) / 2
    const offsetY = (containerSize.height - canvasHeight) / 2

    // Calculate scale factor
    const scaleX = canvasWidth / this.config.minWidth
    const scaleY = canvasHeight / this.config.minHeight
    const scale = Math.min(scaleX, scaleY, 1)

    return {
      container: containerSize,
      canvas: {
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight)
      },
      scale,
      offset: {
        x: Math.round(offsetX),
        y: Math.round(offsetY)
      }
    }
  }

  /**
   * Manually trigger a resize calculation
   */
  recalculate(containerSize: Size): CanvasDimensions {
    const dimensions = this.calculateDimensions(containerSize)
    this.lastDimensions = dimensions
    this.notifyResize(dimensions)
    return dimensions
  }

  /**
   * Add a callback to be notified of resize events
   */
  onResize(callback: (dimensions: CanvasDimensions) => void): () => void {
    this.resizeCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.resizeCallbacks.indexOf(callback)
      if (index > -1) {
        this.resizeCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Notify all callbacks of resize event
   */
  private notifyResize(dimensions: CanvasDimensions): void {
    this.resizeCallbacks.forEach(callback => {
      try {
        callback(dimensions)
      } catch (error) {
        console.error('Error in resize callback:', error)
      }
    })
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ResponsiveCanvasConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Recalculate if we have last dimensions
    if (this.lastDimensions) {
      const dimensions = this.calculateDimensions(this.lastDimensions.container)
      this.lastDimensions = dimensions
      this.notifyResize(dimensions)
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ResponsiveCanvasConfig {
    return { ...this.config }
  }

  /**
   * Get last calculated dimensions
   */
  getLastDimensions(): CanvasDimensions | undefined {
    return this.lastDimensions ? { ...this.lastDimensions } : undefined
  }

  /**
   * Check if canvas is currently responsive
   */
  isResponsive(): boolean {
    return this.config.autoResize && !!this.resizeObserver
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = undefined
    }

    this.resizeCallbacks = []
    this.lastDimensions = undefined
  }
}