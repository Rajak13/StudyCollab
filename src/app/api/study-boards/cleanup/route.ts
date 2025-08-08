import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // This endpoint can be called by a cron job or scheduled task
    // For security, you might want to add API key authentication here
    
    // Clean up old presence data
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_old_presence')

    if (cleanupError) {
      console.error('Error cleaning up old presence data:', cleanupError)
      return NextResponse.json({ error: 'Failed to cleanup old presence data' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Cleanup completed successfully',
      cleaned_records: cleanupResult
    })

  } catch (error) {
    console.error('Error in POST /api/study-boards/cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}