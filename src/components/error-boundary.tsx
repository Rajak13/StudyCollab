'use client'

import { errorHandler, ErrorType } from '@/lib/error-handling'
import { AlertTriangle, Bug, Home, RefreshCw } from 'lucide-react'
import * as React from 'react'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void; retryCount: number }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
  showDetails?: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId?: NodeJS.Timeout

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Handle error with our error handler
    const appError = errorHandler.handle(error, 'ErrorBoundary')

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log additional context
    console.error('Error Boundary caught error:', {
      error: appError,
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      componentStack: errorInfo.componentStack,
    })

    // Auto-retry for certain error types
    if (appError.retryable && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry()
    }
  }

  scheduleRetry = () => {
    // Clear existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    // Schedule retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorId: undefined,
        retryCount: prevState.retryCount + 1,
      }))
    }, delay)
  }

  resetError = () => {
    // Clear retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorId: undefined,
      retryCount: 0,
    })
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          retryCount={this.state.retryCount}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  resetError: () => void
  retryCount: number
}

function DefaultErrorFallback({ error, resetError, retryCount }: DefaultErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  const getErrorType = (error?: Error): ErrorType => {
    if (!error) return ErrorType.UNKNOWN

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return ErrorType.NETWORK
    }

    if (error.message.includes('fetch')) {
      return ErrorType.NETWORK
    }

    return ErrorType.CLIENT
  }

  const getErrorMessage = (error?: Error): { title: string; description: string } => {
    const errorType = getErrorType(error)

    switch (errorType) {
      case ErrorType.NETWORK:
        return {
          title: 'Connection Problem',
          description: 'There seems to be a network issue. Please check your connection and try again.'
        }
      case ErrorType.CLIENT:
        return {
          title: 'Application Error',
          description: 'Something went wrong in the application. This has been reported to our team.'
        }
      default:
        return {
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try refreshing the page.'
        }
    }
  }

  const { title, description } = getErrorMessage(error)
  const isRetrying = retryCount > 0

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-600">
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {isRetrying && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Retrying... (Attempt {retryCount})</span>
            </div>
          )}

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <Button
              onClick={resetError}
              className="flex-1"
              disabled={isRetrying}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs"
              >
                <Bug className="mr-1 h-3 w-3" />
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>

              {showDetails && error && (
                <div className="mt-2 rounded bg-gray-100 p-2 text-left text-xs">
                  <div className="font-mono">
                    <div className="font-semibold">Error:</div>
                    <div className="text-red-600">{error.message}</div>
                    {error.stack && (
                      <>
                        <div className="mt-2 font-semibold">Stack:</div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {error.stack}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook for using error boundary in functional components
 */
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    errorHandler.handle(error, errorInfo?.componentStack || 'useErrorHandler')
  }, [])
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}
