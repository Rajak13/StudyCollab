/**
 * API middleware for security, rate limiting, and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { csrfProtection, inputSanitizer } from './security'
import { createClient } from './supabase'

export interface ApiContext {
  req: NextRequest
  user?: any
  params?: Record<string, string>
}

export type ApiHandler = (context: ApiContext) => Promise<NextResponse>

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: ApiHandler,
  options: { windowMs?: number; maxRequests?: number } = {}
) {
  const windowMs = options.windowMs ?? 60_000
  const maxRequests = options.maxRequests ?? 60
  const requests = new Map<string, number[]>()

  return async (context: ApiContext): Promise<NextResponse> => {
    const now = Date.now()
    const identifier = (context as any).ip ?? 'anonymous'

    const timestamps = requests.get(identifier) || []
    const fresh = timestamps.filter((t) => now - t < windowMs)
    fresh.push(now)
    requests.set(identifier, fresh)

    const remaining = Math.max(0, maxRequests - fresh.length)
    if (fresh.length > maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
          },
        },
      )
    }

    const response = await handler(context)
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return response
  }
}

/**
 * Authentication middleware
 */
export function withAuth(handler: ApiHandler) {
  return async (context: ApiContext): Promise<NextResponse> => {
    const supabase = createClient()
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      context.user = user
      return handler(context)
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * Input validation middleware
 */
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: ApiHandler) => {
    return async (context: ApiContext): Promise<NextResponse> => {
      try {
        let data: any

        if (context.req.method === 'GET') {
          // Validate query parameters
          const url = new URL(context.req.url)
          const params = Object.fromEntries(url.searchParams.entries())
          data = schema.parse(params)
        } else {
          // Validate request body
          const body = await context.req.json()
          data = schema.parse(body)
        }

        // Sanitize string inputs
        const sanitizedData = sanitizeObject(data)
        
        // Add validated data to context
        ;(context as any).validatedData = sanitizedData

        return handler(context)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: 'Validation failed',
              details: error.errors
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: 'Invalid request data' },
          { status: 400 }
        )
      }
    }
  }
}

/**
 * CSRF protection middleware
 */
export function withCSRF(handler: ApiHandler) {
  return async (context: ApiContext): Promise<NextResponse> => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.req.method || '')) {
      const token = context.req.headers.get('X-CSRF-Token')
      const sessionToken = context.req.cookies.get('csrf-token')?.value

      if (!token || !sessionToken || !csrfProtection.validateToken(token, sessionToken)) {
        return NextResponse.json(
          { error: 'CSRF token validation failed' },
          { status: 403 }
        )
      }
    }

    return handler(context)
  }
}

/**
 * Error handling middleware
 */
export function withErrorHandling(handler: ApiHandler) {
  return async (context: ApiContext): Promise<NextResponse> => {
    try {
      return await handler(context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        // Don't expose internal errors in production
        const message = process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Internal server error'

        return NextResponse.json(
          { error: message },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Unknown error occurred' },
        { status: 500 }
      )
    }
  }
}

/**
 * CORS middleware
 */
export function withCORS(handler: ApiHandler, options: {
  origin?: string[]
  methods?: string[]
  headers?: string[]
} = {}) {
  const {
    origin = ['http://localhost:3000'],
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization', 'X-CSRF-Token']
  } = options

  return async (context: ApiContext): Promise<NextResponse> => {
    const response = await handler(context)

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin.join(', '))
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '))
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    return response
  }
}

/**
 * Compose multiple middlewares
 */
export function compose(...middlewares: Array<(handler: ApiHandler) => ApiHandler>) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

/**
 * Common middleware combinations
 */
export const secureApiHandler = (handler: ApiHandler) =>
  compose(
    withErrorHandling,
    withRateLimit,
    withAuth,
    withCSRF
  )(handler)

export const publicApiHandler = (handler: ApiHandler) =>
  compose(
    withErrorHandling,
    withRateLimit,
    withCORS
  )(handler)

/**
 * Utility functions
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return inputSanitizer.sanitizeText(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Create API route handler with middleware
 */
export function createApiRoute(
  handlers: {
    GET?: ApiHandler
    POST?: ApiHandler
    PUT?: ApiHandler
    PATCH?: ApiHandler
    DELETE?: ApiHandler
  },
  middleware: (handler: ApiHandler) => ApiHandler = secureApiHandler
) {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    const method = req.method as keyof typeof handlers
    const handler = handlers[method]

    if (!handler) {
      return NextResponse.json(
        { error: `Method ${method} not allowed` },
        { status: 405 }
      )
    }

    const wrappedHandler = middleware(handler)
    return wrappedHandler({ req, params: context.params })
  }
}