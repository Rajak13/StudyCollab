import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for server-side operations
 * This function is called at runtime, not build time, to avoid environment variable issues
 */
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Creates a Supabase client for admin operations (using service role key)
 * This function is called at runtime, not build time, to avoid environment variable issues
 */
export function createSupabaseAdminClient() {
  return createSupabaseServerClient()
}

/**
 * Creates a Supabase client for user operations (using anon key)
 * This function is called at runtime, not build time, to avoid environment variable issues
 */
export function createSupabaseUserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}
