import { Point } from '@/types/study-board'

export interface Size {
  width: number
  height: number
}

export interface CanvasCoordinates {
  screen: Point
  canvas: Point
  world: Point
}

export interface Transform {
  scale: number
  offset: Point
}

/**
 * Manages coordinate system transformations between screen, canvas, and world coordinates
 * Fixes coordinate mapping issues in the original canvas implementation
 */
export class CoordinateSystem {
  private scale: number = 1
  private offset: Point = { x: 0, y: 0 }
  private containerSize: Size = { width: 0, height: 0 }
  private canvasSize: Size = { width: 0, height: 0 }

  constructor(containerSize: Size, canvasSize: Size) {
    this.containerSize = containerSize
    this.canvasSize = canvasSize
    this.calculateInitialTransform()
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  screenToCanvas(point: Point): Point {
    return {
      x: (point.x - this.offset.x) / this.scale,
      y: (point.y - this.offset.y) / this.scale
    }
  }

  /**
   * Convert canvas coordinates to world coordinates
   */
  canvasToWorld(point: Point): Point {
    return {
      x: point.x * this.scale + this.offset.x,
      y: point.y * this.scale + this.offset.y
    }
  }

  /**
   * Convert world coordinates to canvas coordinates
   */
  worldToCanvas(point: Point): Point {
    return {
      x: (point.x - this.offset.x) / this.scale,
      y: (point.y - this.offset.y) / this.scale
    }
  }

  /**
   * Convert screen coordinates directly to world coordinates
   */
  screenToWorld(point: Point): Point {
    return this.canvasToWorld(this.screenToCanvas(point))
  }

  /**
   * Convert world coordinates directly to screen coordinates
   */
  worldToScreen(point: Point): Point {
    const canvasPoint = this.worldToCanvas(point)
    return {
      x: canvasPoint.x * this.scale + this.offset.x,
      y: canvasPoint.y * this.scale + this.offset.y
    }
  }

  /**
   * Update the transform (scale and offset)
   */
  updateTransform(scale: number, offset: Point): void {
    this.scale = Math.max(0.1, Math.min(5, scale)) // Clamp scale between 0.1 and 5
    this.offset = offset
  }

  /**
   * Update container and canvas sizes
   */
  updateSizes(containerSize: Size, canvasSize: Size): void {
    this.containerSize = containerSize
    this.canvasSize = canvasSize
    this.calculateInitialTransform()
  }

  /**
   * Calculate transform to fit canvas to container while maintaining aspect ratio
   */
  fitToContainer(): Transform {
    const scaleX = this.containerSize.width / this.canvasSize.width
    const scaleY = this.containerSize.height / this.canvasSize.height
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up beyond 1:1

    const scaledWidth = this.canvasSize.width * scale
    const scaledHeight = this.canvasSize.height * scale

    const offset: Point = {
      x: (this.containerSize.width - scaledWidth) / 2,
      y: (this.containerSize.height - scaledHeight) / 2
    }

    return { scale, offset }
  }

  /**
   * Calculate transform to center canvas in container
   */
  centerCanvas(): Transform {
    const offset: Point = {
      x: (this.containerSize.width - this.canvasSize.width) / 2,
      y: (this.containerSize.height - this.canvasSize.height) / 2
    }

    return { scale: 1, offset }
  }

  /**
   * Get current transform
   */
  getTransform(): Transform {
    return {
      scale: this.scale,
      offset: { ...this.offset }
    }
  }

  /**
   * Get current sizes
   */
  getSizes(): { container: Size; canvas: Size } {
    return {
      container: { ...this.containerSize },
      canvas: { ...this.canvasSize }
    }
  }

  /**
   * Calculate visible area in world coordinates
   */
  getVisibleArea(): { topLeft: Point; bottomRight: Point } {
    const topLeft = this.screenToWorld({ x: 0, y: 0 })
    const bottomRight = this.screenToWorld({
      x: this.containerSize.width,
      y: this.containerSize.height
    })

    return { topLeft, bottomRight }
  }

  /**
   * Check if a point is visible in the current viewport
   */
  isPointVisible(point: Point, margin: number = 0): boolean {
    const { topLeft, bottomRight } = this.getVisibleArea()
    return (
      point.x >= topLeft.x - margin &&
      point.x <= bottomRight.x + margin &&
      point.y >= topLeft.y - margin &&
      point.y <= bottomRight.y + margin
    )
  }

  /**
   * Calculate initial transform based on container and canvas sizes
   */
  private calculateInitialTransform(): void {
    if (this.containerSize.width === 0 || this.containerSize.height === 0) {
      return
    }

    const { scale, offset } = this.fitToContainer()
    this.scale = scale
    this.offset = offset
  }
}