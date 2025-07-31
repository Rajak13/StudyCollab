import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import {
  createResourceSchema,
  resourceFiltersSchema,
} from '@/lib/validations/resources'
import { PaginatedResponse, Resource } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/resources - List resources with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const filters = resourceFiltersSchema.parse({
      type: searchParams.getAll('type'),
      subject: searchParams.getAll('subject'),
      tags: searchParams.getAll('tags'),
      is_verified: searchParams.get('is_verified') === 'true',
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'recent',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    })

    // Build query
    let query = supabase.from('resources').select(`
        *,
        user:profiles!resources_user_id_fkey(
          id,
          name,
          avatar_url,
          university
        ),
        votes(type),
        comments(id)
      `)

    // Apply filters
    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type)
    }

    if (filters.subject && filters.subject.length > 0) {
      query = query.in('subject', filters.subject)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified)
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
      )
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('upvotes', { ascending: false })
        break
      case 'score':
        query = query.order('score', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    const { data: resources, error, count } = await query

    if (error) {
      console.error('Error fetching resources:', error)
      return NextResponse.json(
        { data: [], error: 'Failed to fetch resources', pagination: null },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / filters.limit) : 0

    const response: PaginatedResponse<Resource> = {
      data: resources || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages,
      },
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/resources:', error)
    return NextResponse.json(
      { data: [], error: 'Internal server error', pagination: null },
      { status: 500 }
    )
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createResourceSchema.parse(body)

    const supabase = createClient()

    // Create resource data
    const resourceData = {
      ...validatedData,
      user_id: user.id,
    }

    const { data: resource, error } = await supabase
      .from('resources')
      .insert([resourceData])
      .select(
        `
        *,
        user:profiles!resources_user_id_fkey(
          id,
          name,
          avatar_url,
          university
        )
      `
      )
      .single()

    if (error) {
      console.error('Error creating resource:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to create resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: resource, error: null }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/resources:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { data: null, error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
