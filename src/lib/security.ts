/**
 * Security utilities for input validation, sanitization, and protection
 */

import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    })
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
  }

  /**
   * Sanitize file names
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 255) // Limit length
  }

  /**
   * Sanitize URL parameters
   */
  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol')
      }
      return urlObj.toString()
    } catch {
      return ''
    }
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  /**
   * Check if request is allowed for given identifier
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || []
    
    // Filter out old requests
    requests = requests.filter(time => time > windowStart)
    
    // Check if under limit
    if (requests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    requests.push(now)
    this.requests.set(identifier, requests)

    return true
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now()
    const windowStart = now - this.windowMs
    const requests = this.requests.get(identifier) || []
    const validRequests = requests.filter(time => time > windowStart)
    
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  /**
   * Reset requests for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart)
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
}

/**
 * File security utilities
 */
export class FileSecurityValidator {
  private static readonly ALLOWED_MIME_TYPES = new Set([
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/csv',
    'application/json',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
  ])

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  /**
   * Validate file type and size
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.has(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`
      }
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!this.isExtensionValid(extension, file.type)) {
      return {
        isValid: false,
        error: 'File extension does not match file type'
      }
    }

    return { isValid: true }
  }

  private static isExtensionValid(extension: string | undefined, mimeType: string): boolean {
    if (!extension) return false

    const validExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'image/svg+xml': ['svg'],
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
      'application/vnd.ms-powerpoint': ['ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
      'text/plain': ['txt'],
      'text/csv': ['csv'],
      'application/json': ['json'],
      'application/zip': ['zip'],
      'application/x-rar-compressed': ['rar'],
    }

    return validExtensions[mimeType]?.includes(extension) || false
  }

  /**
   * Scan file content for potential threats (basic implementation)
   */
  static async scanFileContent(file: File): Promise<{ isSafe: boolean; threats?: string[] }> {
    const threats: string[] = []

    // Read file as text for basic scanning
    try {
      const text = await file.text()
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.write/i,
      ]

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(text)) {
          threats.push(`Suspicious pattern detected: ${pattern.source}`)
        }
      }
    } catch {
      // If we can't read as text, it's likely a binary file, which is okay
    }

    return {
      isSafe: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined
    }
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false
    if (token.length !== expectedToken.length) return false
    
    // Use constant-time comparison to prevent timing attacks
    let result = 0
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
    }
    
    return result === 0
  }
}

/**
 * Comprehensive validation schemas
 */
export const securitySchemas = {
  // User input validation
  userInput: z.object({
    name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_.]+$/),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  }),

  // Content validation
  content: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
  }),

  // File validation
  file: z.object({
    name: z.string().min(1).max(255),
    size: z.number().min(1).max(50 * 1024 * 1024), // 50MB
    type: z.string().min(1),
  }),

  // API parameters
  pagination: z.object({
    page: z.number().min(1).max(1000).default(1),
    limit: z.number().min(1).max(100).default(20),
  }),

  // Search parameters
  search: z.object({
    query: z.string().min(1).max(200),
    filters: z.record(z.string()).optional(),
  }),
}

// Export singleton instances
export const inputSanitizer = InputSanitizer
export const rateLimiter = new RateLimiter()
export const fileSecurityValidator = FileSecurityValidator
export const csrfProtection = CSRFProtection