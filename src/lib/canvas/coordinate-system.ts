/**
 * Canvas Coordinate System Manager
 * Handles coordinate transformations between screen, canvas, and world coordinates
 */

import { Point } from '@/types/study-board'

export interface Size {
  width: number
  height: number
}

export interface Transform {
  scale: number
  offset: Point
}

export interface CanvasCoordinates {
  screen: Point
  canvas: Point
  world: Point
}

export class CoordinateSystem {
  private scale: number = 1
  private offset: Point = { x: 0, y: 0 }
  private containerSize: Size = { width: 0, height: 0 }
  private canvasSize: Size = { width: 0, height: 0 }

  constructor(containerSize: Size, canvasSize: Size) {
    this.containerSize = containerSize
    this.canvasSize = canvasSize
  }

  /**
   * Update the coordinate system with new sizes and transform
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
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  screenToCanvas(point: Point): Point {
    const rect = this.getCanvasRect()
    return {
      x: point.x - rect.x,
      y: point.y - rect.y
    }
  }

  /**
   * Convert canvas coordinates to world coordinates
   */
  canvasToWorld(point: Point): Point {
    return {
      x: (point.x - this.offset.x) / this.scale,
      y: (point.y - this.offset.y) / this.scale
    }
  }

  /**
   * Convert world coordinates to canvas coordinates
   */
  worldToCanvas(point: Point): Point {
    return {
      x: point.x * this.scale + this.offset.x,
      y: point.y * this.scale + this.offset.y
    }
  }

  /**
   * Convert screen coordinates directly to world coordinates
   */
  screenToWorld(point: Point): Point {
    const canvasPoint = this.screenToCanvas(point)
    return this.canvasToWorld(canvasPoint)
  }

  /**
   * Convert world coordinates directly to screen coordinates
   */
  worldToScreen(point: Point): Point {
    const canvasPoint = this.worldToCanvas(point)
    const rect = this.getCanvasRect()
    return {
      x: canvasPoint.x + rect.x,
      y: canvasPoint.y + rect.y
    }
  }

  /**
   * Get the canvas rectangle within the container
   */
  private getCanvasRect(): { x: number; y: number; width: number; height: number } {
    const centerX = this.containerSize.width / 2
    const centerY = this.containerSize.height / 2
    
    return {
      x: centerX - this.canvasSize.width / 2,
      y: centerY - this.canvasSize.height / 2,
      width: this.canvasSize.width,
      height: this.canvasSize.height
    }
  }

  /**
   * Calculate transform to fit content to container
   */
  fitToContainer(): Transform {
    if (this.containerSize.width === 0 || this.containerSize.height === 0) {
      return { scale: 1, offset: { x: 0, y: 0 } }
    }

    const scaleX = this.containerSize.width / this.canvasSize.width
    const scaleY = this.containerSize.height / this.canvasSize.height
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up beyond 1:1

    const offsetX = (this.containerSize.width - this.canvasSize.width * scale) / 2
    const offsetY = (this.containerSize.height - this.canvasSize.height * scale) / 2

    return {
      scale,
      offset: { x: offsetX, y: offsetY }
    }
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
   * Check if a point is within the canvas bounds
   */
  isPointInCanvas(point: Point): boolean {
    return (
      point.x >= 0 &&
      point.y >= 0 &&
      point.x <= this.canvasSize.width &&
      point.y <= this.canvasSize.height
    )
  }

  /**
   * Clamp a point to canvas bounds
   */
  clampToCanvas(point: Point): Point {
    return {
      x: Math.max(0, Math.min(this.canvasSize.width, point.x)),
      y: Math.max(0, Math.min(this.canvasSize.height, point.y))
    }
  }
}