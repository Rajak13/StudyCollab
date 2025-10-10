import { createApiSupabaseClient } from '@/lib/supabase'
import { ApiResponse, Resource } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/resources/trending - Get trending resources
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiSupabaseClient(request)
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '10')
    const days = parseInt(searchParams.get('days') || '7') // Trending in last N days

    // Calculate trending score based on recent activity
    // Score = (upvotes - downvotes) + (comment_count * 0.5) + (recency_bonus)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

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
      .gte('created_at', cutoffDate.toISOString())
      .order('score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching trending resources:', error)
      return NextResponse.json(
        { data: [], error: 'Failed to fetch trending resources' },
        { status: 500 }
      )
    }

    // Calculate trending score for each resource
    const trendingResources = (resources || []).map((resource) => {
      const daysSinceCreated = Math.max(
        1,
        (Date.now() - new Date(resource.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )

      // Recency bonus: newer resources get higher scores
      const recencyBonus = Math.max(0, (days - daysSinceCreated) / days) * 5

      // Comment bonus
      const commentBonus = (resource.comments?.length || 0) * 0.5

      // Total trending score
      const trendingScore = resource.score + commentBonus + recencyBonus

      return {
        ...resource,
        trendingScore,
      }
    })

    // Sort by trending score
    trendingResources.sort((a, b) => b.trendingScore - a.trendingScore)

    const response: ApiResponse<Resource[]> = {
      data: trendingResources,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/resources/trending:', error)
    return NextResponse.json(
      { data: [], error: 'Internal server error' },
      { status: 500 }
    )
  }
}
