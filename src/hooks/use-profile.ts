'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './use-auth'

interface ProfileData {
  id: string
  name: string | null
  avatar_url: string | null
  university: string | null
  major: string | null
  graduation_year: number | null
  bio: string | null
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/user')

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const refreshProfile = () => {
    fetchProfile()
  }

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    refreshProfile,
  }
}
