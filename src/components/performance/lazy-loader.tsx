'use client'

import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring'
import { Loader2 } from 'lucide-react'
import {
    ComponentType,
    ReactNode,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react'

interface LazyLoaderProps {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  delay?: number
  priority?: 'low' | 'normal' | 'high'
  onLoad?: () => void
  onError?: (error: Error) => void
}

interface LazyComponentProps<T = {}> {
  loader: () => Promise<{ default: ComponentType<T> }>
  fallback?: ReactNode
  props?: T
  threshold?: number
  rootMargin?: string
  delay?: number
  priority?: 'low' | 'normal' | 'high'
  onLoad?: () => void
  onError?: (error: Error) => void
}

// Default loading fallback
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
  </div>
)

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error) => void; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy component error:', error, errorInfo)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8 text-red-500">
          <span>Failed to load component</span>
        </div>
      )
    }

    return this.props.children
  }
}

// Intersection Observer based lazy loader
export function LazyLoader({
  children,
  fallback = <DefaultFallback />,
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0,
  priority = 'normal',
  onLoad,
  onError,
}: LazyLoaderProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const { batteryMode, memoryPressure } = usePerformanceMonitoring()

  // Adjust loading behavior based on performance conditions
  const adjustedThreshold = memoryPressure ? Math.min(threshold * 2, 0.5) : threshold
  const adjustedDelay = batteryMode ? delay * 2 : delay

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Skip intersection observer for high priority items
    if (priority === 'high') {
      setIsVisible(true)
      return
    }

    // Delay loading for low priority items in battery mode
    if (priority === 'low' && batteryMode) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, adjustedDelay + 2000)
      return () => clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          if (adjustedDelay > 0) {
            setTimeout(() => {
              setIsVisible(true)
            }, adjustedDelay)
          } else {
            setIsVisible(true)
          }
          observer.unobserve(element)
        }
      },
      {
        threshold: adjustedThreshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [adjustedThreshold, rootMargin, adjustedDelay, priority, batteryMode])

  useEffect(() => {
    if (isVisible && !isLoaded) {
      setIsLoaded(true)
      onLoad?.()
    }
  }, [isVisible, isLoaded, onLoad])

  return (
    <div ref={elementRef} className="min-h-[1px]">
      {isVisible ? (
        <LazyErrorBoundary onError={onError}>
          <Suspense fallback={fallback}>
            {children}
          </Suspense>
        </LazyErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}

// Lazy component wrapper with performance optimizations
export function LazyComponent<T = {}>({
  loader,
  fallback = <DefaultFallback />,
  props,
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0,
  priority = 'normal',
  onLoad,
  onError,
}: LazyComponentProps<T>) {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { markPerformance, measurePerformance } = usePerformanceMonitoring()

  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      markPerformance('component-load-start')
      
      const module = await loader()
      const LoadedComponent = module.default

      markPerformance('component-load-end')
      measurePerformance('component-load', 'component-load-start', 'component-load-end')

      setComponent(() => LoadedComponent)
      onLoad?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load component')
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [Component, isLoading, loader, onLoad, onError, markPerformance, measurePerformance])

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <span>Failed to load component: {error.message}</span>
      </div>
    )
  }

  if (!Component) {
    return (
      <LazyLoader
        threshold={threshold}
        rootMargin={rootMargin}
        delay={delay}
        priority={priority}
        onLoad={loadComponent}
        fallback={fallback}
      >
        <div />
      </LazyLoader>
    )
  }

  return <Component {...(props as T)} />
}

// HOC for creating lazy components with performance optimizations
export function createLazyComponent<T = {}>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options: Partial<LazyComponentProps<T>> = {}
) {
  return function LazyComponentWrapper(props: T) {
    return (
      <LazyComponent
        loader={loader}
        props={props}
        {...options}
      />
    )
  }
}

// Preload utility for critical components
export function preloadComponent<T>(
  loader: () => Promise<{ default: ComponentType<T> }>
): Promise<{ default: ComponentType<T> }> {
  return loader()
}

// Batch preloader for multiple components
export async function preloadComponents(
  loaders: Array<() => Promise<{ default: ComponentType<any> }>>
): Promise<void> {
  const { markPerformance, measurePerformance } = usePerformanceMonitoring()
  
  markPerformance('batch-preload-start')
  
  try {
    await Promise.all(loaders.map(loader => loader()))
    markPerformance('batch-preload-end')
    measurePerformance('batch-preload', 'batch-preload-start', 'batch-preload-end')
  } catch (error) {
    console.error('Batch preload failed:', error)
  }
}

// Resource hints for better loading performance
export function addResourceHints(resources: Array<{ href: string; as?: string; type?: string }>) {
  if (typeof document === 'undefined') return

  resources.forEach(({ href, as = 'script', type }) => {
    // Check if hint already exists
    const existing = document.querySelector(`link[href="${href}"]`)
    if (existing) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    
    document.head.appendChild(link)
  })
}

// Performance-aware image lazy loading
interface LazyImageProps {
  src: string
  alt: string
  className?: string
  threshold?: number
  rootMargin?: string
  priority?: 'low' | 'normal' | 'high'
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  className,
  threshold = 0.1,
  rootMargin = '50px',
  priority = 'normal',
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const { batteryMode } = usePerformanceMonitoring()

  useEffect(() => {
    const img = imgRef.current
    if (!img || isLoaded) return

    // Skip lazy loading for high priority images
    if (priority === 'high') {
      img.src = src
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          img.src = src
          observer.unobserve(img)
        }
      },
      {
        threshold: batteryMode ? Math.min(threshold * 2, 0.5) : threshold,
        rootMargin,
      }
    )

    observer.observe(img)

    return () => {
      observer.unobserve(img)
    }
  }, [src, threshold, rootMargin, priority, batteryMode, isLoaded])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
    />
  )
}