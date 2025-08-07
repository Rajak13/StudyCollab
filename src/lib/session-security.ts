/**
 * Secure session management utilities
 */

import { NextRequest, NextResponse } from 'next/server'

export interface SessionData {
  userId: string
  email: string
  role?: string
  lastActivity: number
  csrfToken: string
}

export class SecureSessionManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours
  private static readonly CSRF_TOKEN_NAME = 'csrf-token'
  private static readonly SESSION_COOKIE_NAME = 'session-data'

  /**
   * Create a secure session
   */
  static async createSession(
    response: NextResponse,
    sessionData: Omit<SessionData, 'lastActivity' | 'csrfToken'>
  ): Promise<string> {
    const csrfToken = this.generateCSRFToken()
    const session: SessionData = {
      ...sessionData,
      lastActivity: Date.now(),
      csrfToken,
    }

    // Set secure session cookie
    response.cookies.set(this.SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.SESSION_TIMEOUT / 1000,
      path: '/',
    })

    // Set CSRF token cookie (accessible to client)
    response.cookies.set(this.CSRF_TOKEN_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.SESSION_TIMEOUT / 1000,
      path: '/',
    })

    return csrfToken
  }

  /**
   * Validate and refresh session
   */
  static async validateSession(request: NextRequest): Promise<SessionData | null> {
    try {
      const sessionCookie = request.cookies.get(this.SESSION_COOKIE_NAME)
      if (!sessionCookie) return null

      const session: SessionData = JSON.parse(sessionCookie.value)
      
      // Check if session is expired
      if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
        return null
      }

      // Update last activity
      session.lastActivity = Date.now()

      return session
    } catch (error) {
      console.error('Session validation error:', error)
      return null
    }
  }

  /**
   * Destroy session
   */
  static destroySession(response: NextResponse): void {
    response.cookies.delete(this.SESSION_COOKIE_NAME)
    response.cookies.delete(this.CSRF_TOKEN_NAME)
  }

  /**
   * Generate secure CSRF token
   */
  private static generateCSRFToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(request: NextRequest, sessionToken: string): boolean {
    const headerToken = request.headers.get('X-CSRF-Token')
    if (!headerToken) return false

    // Constant-time comparison
    if (headerToken.length !== sessionToken.length) return false
    
    let result = 0
    for (let i = 0; i < headerToken.length; i++) {
      result |= headerToken.charCodeAt(i) ^ sessionToken.charCodeAt(i)
    }
    
    return result === 0
  }

  /**
   * Check for suspicious activity
   */
  static detectSuspiciousActivity(
    request: NextRequest,
    session: SessionData
  ): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = []

    // Check for rapid requests (potential bot)
    const timeSinceLastActivity = Date.now() - session.lastActivity
    if (timeSinceLastActivity < 100) { // Less than 100ms
      reasons.push('Rapid successive requests')
    }

    // Check for unusual user agent changes
    const userAgent = request.headers.get('user-agent')
    if (!userAgent || userAgent.length < 10) {
      reasons.push('Missing or suspicious user agent')
    }

    // Check for IP address changes (if available)
    const currentIP = request.ip
    const sessionIP = request.headers.get('x-session-ip')
    if (sessionIP && currentIP && sessionIP !== currentIP) {
      reasons.push('IP address change detected')
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    }
  }
}

/**
 * Password security utilities
 */
export class PasswordSecurity {
  private static readonly MIN_LENGTH = 8
  private static readonly MAX_LENGTH = 128

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`)
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must be no more than ${this.MAX_LENGTH} characters long`)
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)')
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters')
    }

    if (/123|abc|qwe/i.test(password)) {
      errors.push('Password cannot contain common sequences')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Check if password is commonly used
   */
  static async isCommonPassword(password: string): Promise<boolean> {
    // In a real implementation, you would check against a database of common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ]

    return commonPasswords.includes(password.toLowerCase())
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&'
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    
    return Array.from(array, byte => charset[byte % charset.length]).join('')
  }
}

/**
 * Account lockout protection
 */
export class AccountLockout {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map()
  private static readonly MAX_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  /**
   * Record failed login attempt
   */
  static recordFailedAttempt(identifier: string): void {
    const now = Date.now()
    const existing = this.attempts.get(identifier)

    if (existing) {
      // Reset count if last attempt was more than lockout duration ago
      if (now - existing.lastAttempt > this.LOCKOUT_DURATION) {
        this.attempts.set(identifier, { count: 1, lastAttempt: now })
      } else {
        this.attempts.set(identifier, { 
          count: existing.count + 1, 
          lastAttempt: now 
        })
      }
    } else {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
    }
  }

  /**
   * Check if account is locked
   */
  static isLocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier)
    if (!attempt) return false

    const now = Date.now()
    
    // If lockout duration has passed, remove the entry
    if (now - attempt.lastAttempt > this.LOCKOUT_DURATION) {
      this.attempts.delete(identifier)
      return false
    }

    return attempt.count >= this.MAX_ATTEMPTS
  }

  /**
   * Clear failed attempts (on successful login)
   */
  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier)
  }

  /**
   * Get remaining lockout time
   */
  static getRemainingLockoutTime(identifier: string): number {
    const attempt = this.attempts.get(identifier)
    if (!attempt || attempt.count < this.MAX_ATTEMPTS) return 0

    const elapsed = Date.now() - attempt.lastAttempt
    return Math.max(0, this.LOCKOUT_DURATION - elapsed)
  }
}

// Export singleton instances
export const sessionManager = SecureSessionManager
export const passwordSecurity = PasswordSecurity
export const accountLockout = AccountLockout