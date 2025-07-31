import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { ApiResponse, Resource } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/resources/my - Get current user's resources
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    const { data: resources, error } = await supabase
      .from('resources')
      .select(
        `
        *,
        user:profiles!resources_user_id_fkey(
          id,
          name,
          avatar_url,
          university
        ),
        votes(type),
        comments(id)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user resources:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch your resources' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Resource[]> = {
      data: resources || [],
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/resources/my:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
