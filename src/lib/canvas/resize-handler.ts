/**
 * Canvas Resize Handler
 * Manages responsive canvas sizing and container resize detection
 */

export interface Size {
  width: number;
  height: number;
}

export interface ResizeConfig {
  maintainAspectRatio: boolean;
  aspectRatio?: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  padding: number;
}

export interface ResizeResult {
  canvasSize: Size;
  containerSize: Size;
  scale: number;
  needsResize: boolean;
}

export class CanvasResizeHandler {
  private resizeObserver: ResizeObserver | null = null;
  private containerElement: HTMLElement | null = null;
  private config: ResizeConfig;
  private currentCanvasSize: Size = { width: 0, height: 0 };
  private currentContainerSize: Size = { width: 0, height: 0 };
  private resizeCallbacks: Set<(result: ResizeResult) => void> = new Set();
  private resizeTimeout: NodeJS.Timeout | null = null;
  private readonly RESIZE_DEBOUNCE_MS = 100;

  constructor(config: Partial<ResizeConfig> = {}) {
    this.config = {
      maintainAspectRatio: true,
      aspectRatio: 3/2,
      minWidth: 400,
      minHeight: 300,
      padding: 40,
      ...config
    };
  }

  /**
   * Initialize resize handling for a container element
   */
  initialize(containerElement: HTMLElement): void {
    this.cleanup();
    this.containerElement = containerElement;
    this.setupResizeObserver();
    this.performInitialResize();
  }

  /**
   * Add a callback to be called when resize occurs
   */
  onResize(callback: (result: ResizeResult) => void): () => void {
    this.resizeCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.resizeCallbacks.delete(callback);
    };
  }

  /**
   * Update resize configuration
   */
  updateConfig(newConfig: Partial<ResizeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.triggerResize();
  }

  /**
   * Calculate optimal canvas size for given container size
   */
  calculateCanvasSize(containerSize: Size): Size {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { width: this.config.minWidth, height: this.config.minHeight };
    }

    // Account for padding
    const availableWidth = Math.max(containerSize.width - this.config.padding, this.config.minWidth);
    const availableHeight = Math.max(containerSize.height - this.config.padding, this.config.minHeight);

    let width = availableWidth;
    let height = availableHeight;

    // Apply aspect ratio constraints
    if (this.config.maintainAspectRatio && this.config.aspectRatio) {
      const containerAspectRatio = availableWidth / availableHeight;
      
      if (containerAspectRatio > this.config.aspectRatio) {
        // Container is wider than desired aspect ratio
        width = availableHeight * this.config.aspectRatio;
      } else {
        // Container is taller than desired aspect ratio
        height = availableWidth / this.config.aspectRatio;
      }
    }

    // Apply size constraints
    width = Math.max(this.config.minWidth, width);
    height = Math.max(this.config.minHeight, height);

    if (this.config.maxWidth) {
      width = Math.min(this.config.maxWidth, width);
    }
    if (this.config.maxHeight) {
      height = Math.min(this.config.maxHeight, height);
    }

    // Ensure we maintain aspect ratio after applying constraints
    if (this.config.maintainAspectRatio && this.config.aspectRatio) {
      const currentAspectRatio = width / height;
      if (Math.abs(currentAspectRatio - this.config.aspectRatio) > 0.01) {
        if (currentAspectRatio > this.config.aspectRatio) {
          width = height * this.config.aspectRatio;
        } else {
          height = width / this.config.aspectRatio;
        }
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Get current canvas size
   */
  getCurrentCanvasSize(): Size {
    return { ...this.currentCanvasSize };
  }

  /**
   * Get current container size
   */
  getCurrentContainerSize(): Size {
    return { ...this.currentContainerSize };
  }

  /**
   * Force a resize check
   */
  triggerResize(): void {
    if (this.containerElement) {
      const rect = this.containerElement.getBoundingClientRect();
      this.handleResize({ width: rect.width, height: rect.height });
    }
  }

  /**
   * Setup ResizeObserver for the container
   */
  private setupResizeObserver(): void {
    if (!this.containerElement || !window.ResizeObserver) {
      console.warn('ResizeObserver not available, falling back to window resize events');
      this.setupFallbackResizeHandling();
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      
      this.debouncedHandleResize({ width, height });
    });

    this.resizeObserver.observe(this.containerElement);
  }

  /**
   * Fallback resize handling for browsers without ResizeObserver
   */
  private setupFallbackResizeHandling(): void {
    const handleWindowResize = () => {
      if (this.containerElement) {
        const rect = this.containerElement.getBoundingClientRect();
        this.debouncedHandleResize({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    
    // Store cleanup function
    this.cleanup = () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }

  /**
   * Debounced resize handler to prevent excessive calls
   */
  private debouncedHandleResize(containerSize: Size): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.handleResize(containerSize);
    }, this.RESIZE_DEBOUNCE_MS);
  }

  /**
   * Handle resize event
   */
  private handleResize(containerSize: Size): void {
    const newCanvasSize = this.calculateCanvasSize(containerSize);
    
    const needsResize = (
      newCanvasSize.width !== this.currentCanvasSize.width ||
      newCanvasSize.height !== this.currentCanvasSize.height ||
      containerSize.width !== this.currentContainerSize.width ||
      containerSize.height !== this.currentContainerSize.height
    );

    if (needsResize) {
      this.currentCanvasSize = newCanvasSize;
      this.currentContainerSize = containerSize;

      const scale = Math.min(
        containerSize.width / newCanvasSize.width,
        containerSize.height / newCanvasSize.height
      );

      const result: ResizeResult = {
        canvasSize: newCanvasSize,
        containerSize,
        scale: Math.min(scale, 1), // Don't scale up beyond 1:1
        needsResize: true
      };

      // Notify all callbacks
      this.resizeCallbacks.forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error in resize callback:', error);
        }
      });
    }
  }

  /**
   * Perform initial resize calculation
   */
  private performInitialResize(): void {
    if (this.containerElement) {
      const rect = this.containerElement.getBoundingClientRect();
      this.handleResize({ width: rect.width, height: rect.height });
    }
  }

  /**
   * Cleanup resize handling
   */
  cleanup(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    this.containerElement = null;
    this.resizeCallbacks.clear();
  }

  /**
   * Get resize statistics for debugging
   */
  getStats(): {
    currentCanvasSize: Size;
    currentContainerSize: Size;
    aspectRatio: number;
    callbackCount: number;
    config: ResizeConfig;
  } {
    return {
      currentCanvasSize: { ...this.currentCanvasSize },
      currentContainerSize: { ...this.currentContainerSize },
      aspectRatio: this.currentCanvasSize.width / this.currentCanvasSize.height,
      callbackCount: this.resizeCallbacks.size,
      config: { ...this.config }
    };
  }
}