import { useAuthStore } from '@/lib/stores/auth-store'
import { useEffect } from 'react'

export function useAuth() {
  const {
    user,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    updateProfile,
    uploadAvatar,
    initialize,
  } = useAuthStore()

  // Initialize auth on first use
  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  return {
    // State
    user,
    session,
    loading,
    initialized,
    isAuthenticated: !!user,

    // Actions
    signIn,
    signUp,
    signOut,
    updateProfile,
    uploadAvatar,
  }
}

// Hook for components that require authentication
export function useRequireAuth() {
  const auth = useAuth()

  useEffect(() => {
    if (auth.initialized && !auth.isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login'
    }
  }, [auth.initialized, auth.isAuthenticated])

  return auth
}
