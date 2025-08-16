import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' && 
         supabaseAnonKey !== 'placeholder-key' &&
         supabaseUrl && 
         supabaseAnonKey
}

// Client-side Supabase client
export const createClient = () => {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client for Server Components
export const createServerSupabaseClient = async () => {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }
  
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Server-side Supabase client for API routes
export const createApiSupabaseClient = (request: Request) => {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookieHeader = request.headers.get('cookie')
        if (!cookieHeader) return undefined
        
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        
        return cookies[name]
      },
      set() {
        // No-op for API routes - cookies are handled by the client
      },
      remove() {
        // No-op for API routes - cookies are handled by the client
      },
    },
  })
}

// Server-side Supabase client with service role for admin operations
export const createServiceSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!hasValidSupabaseConfig() || !serviceRoleKey) {
    throw new Error('Supabase configuration or service role key is missing. Please check your environment variables.')
  }
  
  return createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {
          // No-op for service role client
        },
        remove() {
          // No-op for service role client
        },
      },
    }
  )
}

// Legacy export for backward compatibility - only create if config is valid
export const supabase = hasValidSupabaseConfig() ? createClient() : null
