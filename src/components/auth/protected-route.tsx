'use client'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push(redirectTo)
    }
  }, [initialized, loading, user, router, redirectTo])

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {fallback || (
          <div className="flex flex-col items-center space-y-4">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user) {
    return null
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string
    fallback?: React.ReactNode
  }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute
        redirectTo={options?.redirectTo}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
