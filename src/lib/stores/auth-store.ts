import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: {
    name?: string
    avatar?: string
    university?: string
    major?: string
    graduationYear?: number
    bio?: string
  }) => Promise<{ error?: string }>
  uploadAvatar: (file: File) => Promise<{ error?: string; url?: string }>
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  session: null,
  loading: false,
  initialized: false,

  // Actions
  signIn: async (email: string, password: string) => {
    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
      })

      return {}
    } catch (error) {
      set({ loading: false })
      return { error: 'An unexpected error occurred' }
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      // If email confirmation is required, user will be null
      if (data.user && !data.user.email_confirmed_at) {
        set({ loading: false })
        return { error: 'Please check your email to confirm your account' }
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
      })

      return {}
    } catch (error) {
      set({ loading: false })
      return { error: 'An unexpected error occurred' }
    }
  },

  signOut: async () => {
    set({ loading: true })

    try {
      await supabase.auth.signOut()
      set({
        user: null,
        session: null,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      console.error('Error signing out:', error)
    }
  },

  updateProfile: async (updates: {
    name?: string
    avatar?: string
    university?: string
    major?: string
    graduationYear?: number
    bio?: string
  }) => {
    const { user } = get()
    if (!user) return { error: 'No user logged in' }

    set({ loading: true })

    try {
      // Update auth user metadata (for name and avatar)
      const authUpdates: { name?: string; avatar_url?: string } = {}
      if (updates.name) authUpdates.name = updates.name
      if (updates.avatar) authUpdates.avatar_url = updates.avatar

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdates,
        })

        if (authError) {
          set({ loading: false })
          return { error: authError.message }
        }
      }

      // Update profiles table (for all profile data)
      const profileUpdates: Record<string, unknown> = {}
      if (updates.name) profileUpdates.name = updates.name
      if (updates.avatar) profileUpdates.avatar_url = updates.avatar
      if (updates.university) profileUpdates.university = updates.university
      if (updates.major) profileUpdates.major = updates.major
      if (updates.graduationYear)
        profileUpdates.graduation_year = updates.graduationYear
      if (updates.bio) profileUpdates.bio = updates.bio

      console.log('Profile updates:', profileUpdates) // Debug log

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString()

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          ...profileUpdates,
        })

        if (profileError) {
          set({ loading: false })
          return { error: profileError.message }
        }
      }

      // Get updated user data
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser()

      set({
        user: updatedUser,
        loading: false,
      })

      return {}
    } catch (error) {
      set({ loading: false })
      return { error: 'Failed to update profile' }
    }
  },

  uploadAvatar: async (file: File) => {
    const { user } = get()
    if (!user) return { error: 'No user logged in' }

    set({ loading: true })

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        set({ loading: false })
        return { error: uploadError.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const avatarUrl = urlData.publicUrl

      // Update user profile with new avatar URL
      const { error: updateError } = await get().updateProfile({
        avatar: avatarUrl,
      })

      if (updateError) {
        set({ loading: false })
        return { error: updateError }
      }

      set({ loading: false })
      return { url: avatarUrl }
    } catch (error) {
      set({ loading: false })
      return { error: 'Failed to upload avatar' }
    }
  },

  initialize: async () => {
    try {
      // Get initial session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      set({
        user: session?.user ?? null,
        session,
        initialized: true,
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        set({
          user: session?.user ?? null,
          session,
        })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ initialized: true })
    }
  },

  setUser: (user: User | null) => set({ user }),
  setSession: (session: Session | null) => set({ session }),
  setLoading: (loading: boolean) => set({ loading }),
}))
