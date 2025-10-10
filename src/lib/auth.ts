import type { User } from '@supabase/supabase-js'
import { createClient, createServerSupabaseClient } from './supabase'

// Client-side authentication functions
export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: { name?: string }) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData?.name || email.split('@')[0],
        },
      },
    })

    return { data, error }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  },

  // Sign out
  async signOut() {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    return { error }
  },

  // Get current session
  async getSession() {
    const supabase = createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    return { session, error }
  },

  // Get current user
  async getUser() {
    const supabase = createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return { user, error }
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    return { data, error }
  },

  // Update password
  async updatePassword(password: string) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.updateUser({
      password,
    })

    return { data, error }
  },

  // Update user metadata
  async updateUser(updates: {
    email?: string
    data?: Record<string, unknown>
  }) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.updateUser(updates)

    return { data, error }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const supabase = createClient()

    return supabase.auth.onAuthStateChange(callback)
  },
}

// Server-side helper function for API routes
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Server-side authentication functions
export const serverAuth = {
  // Get user from server-side
  async getUser() {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return { user, error }
  },

  // Get session from server-side
  async getSession() {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    return { session, error }
  },
}

// Authentication guards and utilities
export const authGuards = {
  // Check if user is authenticated
  async requireAuth() {
    const { user, error } = await auth.getUser()

    if (error || !user) {
      throw new Error('Authentication required')
    }

    return user
  },

  // Check if user is authenticated on server-side
  async requireServerAuth() {
    const { user, error } = await serverAuth.getUser()

    if (error || !user) {
      throw new Error('Authentication required')
    }

    return user
  },

  // Check if user owns a resource
  async requireOwnership(userId: string, resourceUserId: string) {
    if (userId !== resourceUserId) {
      throw new Error('Access denied: You do not own this resource')
    }
  },

  // Check if user is admin or owner
  async requireAdminOrOwner(
    userId: string,
    resourceUserId: string,
    isAdmin = false
  ) {
    if (!isAdmin && userId !== resourceUserId) {
      throw new Error('Access denied: Admin or owner access required')
    }
  },
}

// Authentication error handling
export const authErrors = {
  // Map Supabase auth errors to user-friendly messages
  getErrorMessage(error: unknown): string {
    if (!error) return 'An unknown error occurred'

    const errorMessage =
      (error as { message?: string }).message?.toLowerCase() || ''

    if (errorMessage.includes('invalid login credentials')) {
      return 'Invalid email or password'
    }

    if (errorMessage.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link'
    }

    if (errorMessage.includes('signup is disabled')) {
      return 'Account registration is currently disabled'
    }

    if (errorMessage.includes('password should be at least')) {
      return 'Password must be at least 6 characters long'
    }

    if (errorMessage.includes('user already registered')) {
      return 'An account with this email already exists'
    }

    if (errorMessage.includes('invalid email')) {
      return 'Please enter a valid email address'
    }

    if (errorMessage.includes('too many requests')) {
      return 'Too many attempts. Please try again later'
    }

    return (
      (error as { message?: string }).message ||
      'An error occurred during authentication'
    )
  },

  // Check if error is related to authentication
  isAuthError(error: unknown): boolean {
    if (!error) return false

    const authErrorCodes = [
      'invalid_credentials',
      'email_not_confirmed',
      'signup_disabled',
      'weak_password',
      'user_already_exists',
      'invalid_email',
      'too_many_requests',
    ]

    return authErrorCodes.some((code) =>
      (error as { message?: string }).message
        ?.toLowerCase()
        .includes(code.replace('_', ' '))
    )
  },
}

// Type definitions
export type AuthUser = User

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: AuthUser
}

export interface AuthError {
  message: string
  status?: number
}
