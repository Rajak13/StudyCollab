import { getCurrentUser } from '@/lib/auth'
import { createApiSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export interface SearchResult {
  id: string
  type: 'task' | 'note' | 'resource'
  title: string
  description?: string
  content?: string
  tags: string[]
  created_at: string
  updated_at: string
  relevance_score: number
  // Type-specific fields
  priority?: string
  status?: string
  due_date?: string
  is_public?: boolean
  subject?: string
  upvotes?: number
  downvotes?: number
}

export interface SearchFilters {
  query?: string
  types?: ('task' | 'note' | 'resource')[]
  tags?: string[]
  date_from?: string
  date_to?: string
  categories?: string[]
  subjects?: string[]
  priority?: string[]
  status?: string[]
  is_public?: boolean
  sort_by?: 'relevance' | 'date' | 'popularity'
  page?: number
  limit?: number
}

export interface SearchResponse {
  data: SearchResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  suggestions: string[]
  error: string | null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { data: [], pagination: null, suggestions: [], error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createApiSupabaseClient(request)
    const { searchParams } = new URL(request.url)

    // Parse search parameters
    const filters: SearchFilters = {
      query: searchParams.get('query') || undefined,
      types: (searchParams.get('types')?.split(',') as (
        | 'task'
        | 'note'
        | 'resource'
      )[]) || ['task', 'note', 'resource'],
      tags: searchParams.get('tags')?.split(',') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      categories: searchParams.get('categories')?.split(',') || undefined,
      subjects: searchParams.get('subjects')?.split(',') || undefined,
      priority: searchParams.get('priority')?.split(',') || undefined,
      status: searchParams.get('status')?.split(',') || undefined,
      is_public: searchParams.get('is_public') === 'true' ? true : undefined,
      sort_by:
        (searchParams.get('sort_by') as 'relevance' | 'date' | 'popularity') ||
        'relevance',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    const results: SearchResult[] = []
    let totalCount = 0

    // Search tasks
    if (filters.types?.includes('task')) {
      let taskQuery = supabase
        .from('tasks')
        .select(
          `
          id,
          title,
          description,
          tags,
          priority,
          status,
          due_date,
          created_at,
          updated_at,
          category:task_categories(name)
        `
        )
        .eq('user_id', user.id)

      // Apply task-specific filters
      if (filters.query) {
        taskQuery = taskQuery.or(
          `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
        )
      }

      if (filters.tags && filters.tags.length > 0) {
        taskQuery = taskQuery.overlaps('tags', filters.tags)
      }

      if (filters.priority && filters.priority.length > 0) {
        taskQuery = taskQuery.in('priority', filters.priority)
      }

      if (filters.status && filters.status.length > 0) {
        taskQuery = taskQuery.in('status', filters.status)
      }

      if (filters.date_from) {
        taskQuery = taskQuery.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        taskQuery = taskQuery.lte('created_at', filters.date_to)
      }

      const { data: tasks, error: taskError } = await taskQuery

      if (!taskError && tasks) {
        const taskResults: SearchResult[] = tasks.map((task) => ({
          id: task.id,
          type: 'task' as const,
          title: task.title,
          description: task.description || undefined,
          tags: task.tags,
          created_at: task.created_at,
          updated_at: task.updated_at,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date || undefined,
          relevance_score: calculateRelevanceScore(
            task.title,
            task.description,
            filters.query
          ),
        }))
        results.push(...taskResults)
        totalCount += tasks.length
      }
    }

    // Search notes
    if (filters.types?.includes('note')) {
      let noteQuery = supabase
        .from('notes')
        .select(
          `
          id,
          title,
          summary,
          tags,
          is_public,
          created_at,
          updated_at,
          folder:note_folders(name)
        `
        )
        .eq('user_id', user.id)

      // Apply note-specific filters
      if (filters.query) {
        noteQuery = noteQuery.or(
          `title.ilike.%${filters.query}%,summary.ilike.%${filters.query}%`
        )
      }

      if (filters.tags && filters.tags.length > 0) {
        noteQuery = noteQuery.overlaps('tags', filters.tags)
      }

      if (filters.is_public !== undefined) {
        noteQuery = noteQuery.eq('is_public', filters.is_public)
      }

      if (filters.date_from) {
        noteQuery = noteQuery.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        noteQuery = noteQuery.lte('created_at', filters.date_to)
      }

      const { data: notes, error: noteError } = await noteQuery

      if (!noteError && notes) {
        const noteResults: SearchResult[] = notes.map((note) => ({
          id: note.id,
          type: 'note' as const,
          title: note.title,
          description: note.summary || undefined,
          tags: note.tags,
          created_at: note.created_at,
          updated_at: note.updated_at,
          is_public: note.is_public,
          relevance_score: calculateRelevanceScore(
            note.title,
            note.summary,
            filters.query
          ),
        }))
        results.push(...noteResults)
        totalCount += notes.length
      }
    }

    // Search resources
    if (filters.types?.includes('resource')) {
      let resourceQuery = supabase.from('resources').select(`
          id,
          title,
          description,
          tags,
          subject,
          upvotes,
          downvotes,
          created_at,
          updated_at
        `)

      // Apply resource-specific filters
      if (filters.query) {
        resourceQuery = resourceQuery.or(
          `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,subject.ilike.%${filters.query}%`
        )
      }

      if (filters.tags && filters.tags.length > 0) {
        resourceQuery = resourceQuery.overlaps('tags', filters.tags)
      }

      if (filters.subjects && filters.subjects.length > 0) {
        resourceQuery = resourceQuery.in('subject', filters.subjects)
      }

      if (filters.date_from) {
        resourceQuery = resourceQuery.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        resourceQuery = resourceQuery.lte('created_at', filters.date_to)
      }

      const { data: resources, error: resourceError } = await resourceQuery

      if (!resourceError && resources) {
        const resourceResults: SearchResult[] = resources.map((resource) => ({
          id: resource.id,
          type: 'resource' as const,
          title: resource.title,
          description: resource.description,
          tags: resource.tags,
          created_at: resource.created_at,
          updated_at: resource.updated_at,
          subject: resource.subject,
          upvotes: resource.upvotes,
          downvotes: resource.downvotes,
          relevance_score: calculateRelevanceScore(
            resource.title,
            resource.description,
            filters.query
          ),
        }))
        results.push(...resourceResults)
        totalCount += resources.length
      }
    }

    // Sort results
    const sortedResults = [...results]
    switch (filters.sort_by) {
      case 'relevance':
        sortedResults.sort((a, b) => b.relevance_score - a.relevance_score)
        break
      case 'date':
        sortedResults.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        break
      case 'popularity':
        sortedResults.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
        break
    }

    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedResults = sortedResults.slice(startIndex, endIndex)

    // Generate search suggestions
    const suggestions = await generateSearchSuggestions(
      filters.query,
      supabase,
      user.id
    )

    const response: SearchResponse = {
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      suggestions,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in unified search:', error)
    return NextResponse.json(
      {
        data: [],
        pagination: null,
        suggestions: [],
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// Calculate relevance score based on query match
function calculateRelevanceScore(
  title: string,
  description: string | null,
  query?: string
): number {
  if (!query) return 1

  const queryLower = query.toLowerCase()
  const titleLower = title.toLowerCase()
  const descriptionLower = (description || '').toLowerCase()

  let score = 0

  // Exact title match gets highest score
  if (titleLower === queryLower) {
    score += 10
  } else if (titleLower.includes(queryLower)) {
    score += 5
  }

  // Description match gets lower score
  if (descriptionLower.includes(queryLower)) {
    score += 2
  }

  // Word boundary matches get bonus
  const titleWords = titleLower.split(/\s+/)
  const queryWords = queryLower.split(/\s+/)

  for (const queryWord of queryWords) {
    if (titleWords.some((word) => word.startsWith(queryWord))) {
      score += 1
    }
  }

  return Math.max(score, 0.1) // Minimum score to avoid zero
}

// Generate search suggestions based on existing content
async function generateSearchSuggestions(
  query: string | undefined,
  supabase: ReturnType<typeof createApiSupabaseClient>,
  userId: string
): Promise<string[]> {
  if (!query || query.length < 2) {
    return []
  }

  const suggestions: Set<string> = new Set()

  try {
    // Get suggestions from task titles
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, tags')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .limit(5)

    if (tasks) {
      tasks.forEach((task: { title: string; tags: string[] }) => {
        if (task.title.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(task.title)
        }
        task.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag)
          }
        })
      })
    }

    // Get suggestions from note titles
    const { data: notes } = await supabase
      .from('notes')
      .select('title, tags')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .limit(5)

    if (notes) {
      notes.forEach((note: { title: string; tags: string[] }) => {
        if (note.title.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(note.title)
        }
        note.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag)
          }
        })
      })
    }

    // Get suggestions from resource titles and subjects
    const { data: resources } = await supabase
      .from('resources')
      .select('title, subject, tags')
      .or(`title.ilike.%${query}%,subject.ilike.%${query}%`)
      .limit(5)

    if (resources) {
      resources.forEach(
        (resource: { title: string; subject: string; tags: string[] }) => {
          if (resource.title.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(resource.title)
          }
          if (resource.subject.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(resource.subject)
          }
          resource.tags.forEach((tag: string) => {
            if (tag.toLowerCase().includes(query.toLowerCase())) {
              suggestions.add(tag)
            }
          })
        }
      )
    }
  } catch (error) {
    console.error('Error generating suggestions:', error)
  }

  return Array.from(suggestions).slice(0, 8)
}
