/**
 * Comprehensive error handling and user experience utilities
 */

import { toast } from '@/components/ui/use-toast'

export enum ErrorType {
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    NOT_FOUND = 'NOT_FOUND',
    SERVER = 'SERVER',
    CLIENT = 'CLIENT',
    UNKNOWN = 'UNKNOWN',
}

export interface AppError {
    name: string
    message: string
    stack?: string
    type: ErrorType
    code?: string
    statusCode?: number
    details?: Record<string, any>
    userMessage: string
    retryable: boolean
}

/**
 * Custom error classes for different error types
 */
export class NetworkError extends Error implements AppError {
    type = ErrorType.NETWORK as const
    retryable = true
    userMessage: string

    constructor(message: string, public statusCode?: number) {
        super(message)
        this.name = 'NetworkError'
        this.userMessage = 'Network connection failed. Please check your internet connection and try again.'
    }
}

export class ValidationError extends Error implements AppError {
    type = ErrorType.VALIDATION as const
    retryable = false
    userMessage: string

    constructor(message: string, public details?: Record<string, any>) {
        super(message)
        this.name = 'ValidationError'
        this.userMessage = 'Please check your input and try again.'
    }
}

export class AuthenticationError extends Error implements AppError {
    type = ErrorType.AUTHENTICATION as const
    retryable = false
    statusCode = 401
    userMessage: string

    constructor(message: string = 'Authentication required') {
        super(message)
        this.name = 'AuthenticationError'
        this.userMessage = 'Please log in to continue.'
    }
}

export class AuthorizationError extends Error implements AppError {
    type = ErrorType.AUTHORIZATION as const
    retryable = false
    statusCode = 403
    userMessage: string

    constructor(message: string = 'Access denied') {
        super(message)
        this.name = 'AuthorizationError'
        this.userMessage = 'You do not have permission to perform this action.'
    }
}

export class NotFoundError extends Error implements AppError {
    type = ErrorType.NOT_FOUND as const
    retryable = false
    statusCode = 404
    userMessage: string

    constructor(resource: string = 'Resource') {
        super(`${resource} not found`)
        this.name = 'NotFoundError'
        this.userMessage = `The requested ${resource.toLowerCase()} could not be found.`
    }
}

export class ServerError extends Error implements AppError {
    type = ErrorType.SERVER as const
    retryable = true
    statusCode = 500
    userMessage: string

    constructor(message: string = 'Internal server error') {
        super(message)
        this.name = 'ServerError'
        this.userMessage = 'Something went wrong on our end. Please try again later.'
    }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
    private static errorCounts: Map<string, number> = new Map()
    private static lastErrors: Map<string, number> = new Map()

    /**
     * Handle and classify errors
     */
    static handle(error: unknown, context?: string): AppError {
        const appError = this.classifyError(error)

        // Log error for monitoring
        this.logError(appError, context)

        // Track error frequency
        this.trackError(appError)

        // Show user-friendly message
        this.showUserMessage(appError)

        return appError
    }

    /**
     * Classify unknown errors into AppError types
     */
    private static classifyError(error: unknown): AppError {
        // Check if it's already an AppError
        if (this.isAppError(error)) {
            return error
        }

        if (error instanceof Error) {
            // Network errors
            if (error.message.includes('fetch') || error.message.includes('network')) {
                return new NetworkError(error.message)
            }

            // Validation errors (from Zod or similar)
            if (error.name === 'ZodError' || error.message.includes('validation')) {
                return new ValidationError(error.message)
            }

            // Convert generic error to AppError
            return this.createAppError(error.message, ErrorType.UNKNOWN)
        }

        // Handle non-Error objects
        const message = typeof error === 'string' ? error : 'Unknown error occurred'
        return this.createAppError(message, ErrorType.UNKNOWN)
    }

    /**
     * Check if an object is an AppError
     */
    private static isAppError(error: unknown): error is AppError {
        return (
            typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'userMessage' in error &&
            'retryable' in error
        )
    }

    /**
     * Create a generic AppError
     */
    private static createAppError(message: string, type: ErrorType): AppError {
        return {
            name: 'AppError',
            message,
            type,
            retryable: false,
            userMessage: 'An unexpected error occurred. Please try again.',
        }
    }

    /**
     * Log errors for monitoring and debugging
     */
    private static logError(error: AppError, context?: string): void {
        const errorInfo = {
            type: error.type,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
        }

        // In development, log to console
        if (process.env.NODE_ENV === 'development') {
            console.error('Error occurred:', errorInfo)
        }

        // In production, send to monitoring service
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
            this.sendToMonitoring(errorInfo)
        }
    }

    /**
     * Track error frequency for monitoring
     */
    private static trackError(error: AppError): void {
        const key = `${error.type}:${error.message}`
        const count = this.errorCounts.get(key) || 0
        this.errorCounts.set(key, count + 1)
        this.lastErrors.set(key, Date.now())

        // Alert if error occurs frequently
        if (count > 5) {
            console.warn(`Frequent error detected: ${key} (${count} times)`)
        }
    }

    /**
     * Show user-friendly error messages
     */
    private static showUserMessage(error: AppError): void {
        const message = error.userMessage || error.message

        // Use toast for user notifications
        toast({
            title: this.getErrorTitle(error.type),
            description: message,
            variant: 'destructive',
        })
    }

    /**
     * Get appropriate error title based on type
     */
    private static getErrorTitle(type: ErrorType): string {
        switch (type) {
            case ErrorType.NETWORK:
                return 'Connection Error'
            case ErrorType.VALIDATION:
                return 'Invalid Input'
            case ErrorType.AUTHENTICATION:
                return 'Authentication Required'
            case ErrorType.AUTHORIZATION:
                return 'Access Denied'
            case ErrorType.NOT_FOUND:
                return 'Not Found'
            case ErrorType.SERVER:
                return 'Server Error'
            default:
                return 'Error'
        }
    }

    /**
     * Send error to monitoring service
     */
    private static sendToMonitoring(errorInfo: any): void {
        // Placeholder for monitoring service integration
        // In a real app, you would send this to Sentry, LogRocket, etc.
        if (typeof window !== 'undefined') {
            // Could use navigator.sendBeacon for reliable error reporting
            navigator.sendBeacon?.('/api/errors', JSON.stringify(errorInfo))
        }
    }

    /**
     * Get error statistics
     */
    static getErrorStats(): Record<string, { count: number; lastOccurred: number }> {
        const stats: Record<string, { count: number; lastOccurred: number }> = {}

        for (const [key, count] of this.errorCounts.entries()) {
            stats[key] = {
                count,
                lastOccurred: this.lastErrors.get(key) || 0,
            }
        }

        return stats
    }

    /**
     * Clear error statistics
     */
    static clearStats(): void {
        this.errorCounts.clear()
        this.lastErrors.clear()
    }
}

/**
 * Retry utility for handling retryable operations
 */
export class RetryHandler {
    static async withRetry<T>(
        operation: () => Promise<T>,
        options: {
            maxAttempts?: number
            delay?: number
            backoff?: boolean
            retryCondition?: (error: any) => boolean
        } = {}
    ): Promise<T> {
        const {
            maxAttempts = 3,
            delay = 1000,
            backoff = true,
            retryCondition = (error) => error instanceof NetworkError || error instanceof ServerError
        } = options

        let lastError: any

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation()
            } catch (error) {
                lastError = error

                // Don't retry if it's the last attempt or error is not retryable
                if (attempt === maxAttempts || !retryCondition(error)) {
                    throw error
                }

                // Calculate delay with optional exponential backoff
                const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay

                // Add jitter to prevent thundering herd
                const jitter = Math.random() * 0.1 * currentDelay
                const totalDelay = currentDelay + jitter

                await new Promise(resolve => setTimeout(resolve, totalDelay))
            }
        }

        throw lastError
    }
}

/**
 * Optimistic update handler
 */
export class OptimisticUpdateHandler<T> {
    private originalData: T
    private rollbackFn?: () => void

    constructor(originalData: T) {
        this.originalData = originalData
    }

    /**
     * Apply optimistic update
     */
    apply(updateFn: (data: T) => T, rollbackFn?: () => void): T {
        this.rollbackFn = rollbackFn
        return updateFn(this.originalData)
    }

    /**
     * Rollback optimistic update on error
     */
    rollback(): void {
        if (this.rollbackFn) {
            this.rollbackFn()
        }
    }

    /**
     * Confirm optimistic update (no rollback needed)
     */
    confirm(): void {
        this.rollbackFn = undefined
    }
}

/**
 * Offline detection and handling
 */
export class OfflineHandler {
    private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    private static listeners: Array<(online: boolean) => void> = []
    private static queuedOperations: Array<() => Promise<any>> = []

    static {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline = true
                this.notifyListeners(true)
                this.processQueuedOperations()
            })

            window.addEventListener('offline', () => {
                this.isOnline = false
                this.notifyListeners(false)
            })
        }
    }

    /**
     * Check if currently online
     */
    static getOnlineStatus(): boolean {
        return this.isOnline
    }

    /**
     * Add listener for online/offline status changes
     */
    static addListener(listener: (online: boolean) => void): () => void {
        this.listeners.push(listener)

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener)
            if (index > -1) {
                this.listeners.splice(index, 1)
            }
        }
    }

    /**
     * Queue operation for when back online
     */
    static queueOperation(operation: () => Promise<any>): void {
        this.queuedOperations.push(operation)
    }

    /**
     * Process queued operations when back online
     */
    private static async processQueuedOperations(): Promise<void> {
        const operations = [...this.queuedOperations]
        this.queuedOperations.length = 0

        for (const operation of operations) {
            try {
                await operation()
            } catch (error) {
                console.error('Failed to process queued operation:', error)
                // Re-queue failed operations
                this.queuedOperations.push(operation)
            }
        }
    }

    /**
     * Notify all listeners of status change
     */
    private static notifyListeners(online: boolean): void {
        this.listeners.forEach(listener => {
            try {
                listener(online)
            } catch (error) {
                console.error('Error in offline status listener:', error)
            }
        })
    }
}

// Export singleton instances
export const errorHandler = ErrorHandler
export const retryHandler = RetryHandler
export const offlineHandler = OfflineHandler