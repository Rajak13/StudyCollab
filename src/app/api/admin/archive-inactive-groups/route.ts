import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Create a server-side Supabase client with service role key for admin operations
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations'
    )
  }

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request (you might want to add API key authentication)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.ADMIN_API_TOKEN

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Call the database function to archive inactive groups
    const { data, error } = await supabase.rpc('archive_inactive_groups')

    if (error) {
      console.error('Error archiving inactive groups:', error)
      return NextResponse.json(
        {
          error: 'Failed to archive inactive groups',
          details: error.message,
        },
        { status: 500 }
      )
    }

    const archivedCount = data || 0

    console.log(`Archived ${archivedCount} inactive groups`)

    return NextResponse.json({
      message: 'Inactive groups archival completed',
      archivedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in archive inactive groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    message: 'Archive inactive groups endpoint is healthy',
    timestamp: new Date().toISOString(),
  })
}
