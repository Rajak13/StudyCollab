import { Size } from './coordinate-system'

export interface CanvasSizeConfig {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  aspectRatio?: number
  maintainAspectRatio: boolean
  padding: number
}

export interface CalculatedSize {
  width: number
  height: number
  scale: number
  offset: { x: number; y: number }
}

/**
 * Calculates optimal canvas size based on container dimensions and configuration
 * Handles responsive sizing and aspect ratio maintenance
 */
export class CanvasSizeCalculator {
  private config: CanvasSizeConfig

  constructor(config: Partial<CanvasSizeConfig> = {}) {
    this.config = {
      minWidth: 400,
      minHeight: 300,
      maxWidth: 4000,
      maxHeight: 3000,
      maintainAspectRatio: true,
      padding: 20,
      ...config
    }
  }

  /**
   * Calculate optimal canvas size for the given container
   */
  calculateSize(containerSize: Size): CalculatedSize {
    const availableWidth = Math.max(0, containerSize.width - this.config.padding * 2)
    const availableHeight = Math.max(0, containerSize.height - this.config.padding * 2)

    let width = availableWidth
    let height = availableHeight

    // Apply aspect ratio if specified
    if (this.config.aspectRatio && this.config.maintainAspectRatio) {
      const containerAspectRatio = availableWidth / availableHeight
      
      if (containerAspectRatio > this.config.aspectRatio) {
        // Container is wider than desired aspect ratio
        width = availableHeight * this.config.aspectRatio
        height = availableHeight
      } else {
        // Container is taller than desired aspect ratio
        width = availableWidth
        height = availableWidth / this.config.aspectRatio
      }
    }

    // Apply size constraints
    width = Math.max(this.config.minWidth, Math.min(this.config.maxWidth, width))
    height = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, height))

    // Recalculate if aspect ratio needs to be maintained after constraints
    if (this.config.aspectRatio && this.config.maintainAspectRatio) {
      const currentAspectRatio = width / height
      
      if (Math.abs(currentAspectRatio - this.config.aspectRatio) > 0.01) {
        if (currentAspectRatio > this.config.aspectRatio) {
          width = height * this.config.aspectRatio
        } else {
          height = width / this.config.aspectRatio
        }
      }
    }

    // Calculate scale factor
    const scaleX = width / availableWidth
    const scaleY = height / availableHeight
    const scale = Math.min(scaleX, scaleY, 1)

    // Calculate offset to center the canvas
    const offset = {
      x: (containerSize.width - width) / 2,
      y: (containerSize.height - height) / 2
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
      scale,
      offset
    }
  }

  /**
   * Calculate size for a specific aspect ratio
   */
  calculateSizeWithAspectRatio(containerSize: Size, aspectRatio: number): CalculatedSize {
    const tempConfig = { ...this.config, aspectRatio, maintainAspectRatio: true }
    const tempCalculator = new CanvasSizeCalculator(tempConfig)
    return tempCalculator.calculateSize(containerSize)
  }

  /**
   * Calculate size that fits content with padding
   */
  calculateSizeForContent(contentBounds: { width: number; height: number }, containerSize: Size): CalculatedSize {
    const paddedContentWidth = contentBounds.width + this.config.padding * 2
    const paddedContentHeight = contentBounds.height + this.config.padding * 2

    const scaleX = containerSize.width / paddedContentWidth
    const scaleY = containerSize.height / paddedContentHeight
    const scale = Math.min(scaleX, scaleY, 1)

    const width = Math.min(paddedContentWidth * scale, containerSize.width)
    const height = Math.min(paddedContentHeight * scale, containerSize.height)

    const offset = {
      x: (containerSize.width - width) / 2,
      y: (containerSize.height - height) / 2
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
      scale,
      offset
    }
  }

  /**
   * Get responsive breakpoints for different screen sizes
   */
  getResponsiveSize(containerSize: Size): CalculatedSize & { breakpoint: string } {
    const width = containerSize.width
    let breakpoint = 'desktop'

    if (width < 640) {
      breakpoint = 'mobile'
      // Mobile-specific adjustments
      const mobileConfig = {
        ...this.config,
        padding: 10,
        minWidth: 300,
        minHeight: 200
      }
      const tempCalculator = new CanvasSizeCalculator(mobileConfig)
      return { ...tempCalculator.calculateSize(containerSize), breakpoint }
    } else if (width < 1024) {
      breakpoint = 'tablet'
      // Tablet-specific adjustments
      const tabletConfig = {
        ...this.config,
        padding: 15
      }
      const tempCalculator = new CanvasSizeCalculator(tabletConfig)
      return { ...tempCalculator.calculateSize(containerSize), breakpoint }
    }

    return { ...this.calculateSize(containerSize), breakpoint }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CanvasSizeConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): CanvasSizeConfig {
    return { ...this.config }
  }

  /**
   * Calculate minimum container size needed for the given canvas size
   */
  calculateMinimumContainerSize(canvasSize: Size): Size {
    return {
      width: canvasSize.width + this.config.padding * 2,
      height: canvasSize.height + this.config.padding * 2
    }
  }

  /**
   * Check if the container size is sufficient for the canvas
   */
  isContainerSizeSufficient(containerSize: Size, requiredCanvasSize: Size): boolean {
    const minContainerSize = this.calculateMinimumContainerSize(requiredCanvasSize)
    return containerSize.width >= minContainerSize.width && containerSize.height >= minContainerSize.height
  }
}