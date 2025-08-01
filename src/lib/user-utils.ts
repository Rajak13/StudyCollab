import type { User } from '@supabase/supabase-js'

export interface LayoutUser {
  name: string
  email: string
  avatar?: string
}

/**
 * Transform Supabase user to layout user format
 */
export function transformUserForLayout(user: User | null): LayoutUser | null {
  if (!user) return null

  return {
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url,
  }
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'User'
  return user.user_metadata?.name || user.email?.split('@')[0] || 'User'
}

/**
 * Check if user email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  return user?.email_confirmed_at !== null
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(user: User | null): string {
  if (!user) return 'U'

  const name = getUserDisplayName(user)
  const words = name.split(' ')

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return name.charAt(0).toUpperCase()
}

/**
 * Format user creation date
 */
export function formatUserCreatedDate(user: User | null): string {
  if (!user?.created_at) return 'Unknown'

  return new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format user last sign in date
 */
export function formatUserLastSignIn(user: User | null): string {
  if (!user?.last_sign_in_at) return 'Unknown'

  return new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get user academic info
 */
export function getUserAcademicInfo(user: User | null) {
  if (!user) return null

  return {
    university: user.user_metadata?.university || null,
    major: user.user_metadata?.major || null,
    graduationYear: user.user_metadata?.graduation_year || null,
    bio: user.user_metadata?.bio || null,
  }
}
