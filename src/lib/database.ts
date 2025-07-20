import { createClient, createServerSupabaseClient } from './supabase'

// Database operation wrapper with error handling
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error: unknown) {
    console.error('Database operation failed:', error)

    // Handle specific PostgreSQL/Supabase errors
    const err = error as { code?: string; message?: string }

    if (err.code === '23505') {
      return {
        data: null,
        error: 'A record with this information already exists',
      }
    }

    if (err.code === '23503') {
      return { data: null, error: 'Related record not found' }
    }

    if (err.code === '42501') {
      return { data: null, error: 'Permission denied' }
    }

    if (err.message?.includes('duplicate key')) {
      return { data: null, error: 'Duplicate entry' }
    }

    if (err.message?.includes('not found')) {
      return { data: null, error: 'Record not found' }
    }

    return { data: null, error: err.message || 'Database operation failed' }
  }
}

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('profiles').select('count').limit(1)
    return !error
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Helper functions for common database operations
export const db = {
  // Get Supabase client for client-side operations
  client: () => createClient(),

  // Get Supabase client for server-side operations
  serverClient: async () => await createServerSupabaseClient(),

  // Generic query wrapper
  async query<T>(
    _table: string,
    operation: (
      client: ReturnType<typeof createClient>
    ) => Promise<{ data: T | null; error: unknown }>
  ): Promise<{ data: T | null; error: string | null }> {
    return handleDatabaseOperation(async () => {
      const supabase = createClient()
      const { data, error } = await operation(supabase)

      if (error) {
        throw error
      }

      return data
    })
  },

  // Server-side query wrapper
  async serverQuery<T>(
    _table: string,
    operation: (
      client: Awaited<ReturnType<typeof createServerSupabaseClient>>
    ) => Promise<{ data: T | null; error: unknown }>
  ): Promise<{ data: T | null; error: string | null }> {
    return handleDatabaseOperation(async () => {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await operation(supabase)

      if (error) {
        throw error
      }

      return data
    })
  },
}
