import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Client-side Supabase client
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client for Server Components
export const createServerSupabaseClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
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

// Backward compatibility export - returns a function that creates the client
export const supabase = () => createClient()
