/**
 * Database query optimization utilities
 */

import { createClient } from '@/lib/supabase'

/**
 * Optimized query builder with automatic indexing hints
 */
export class OptimizedQueryBuilder {
  private supabase = createClient()
  private tableName: string
  private selectFields: string = '*'
  private whereConditions: Array<{ column: string; operator: string; value: any }> = []
  private orderByFields: Array<{ column: string; ascending: boolean }> = []
  private limitValue?: number
  private offsetValue?: number

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields: string) {
    this.selectFields = fields
    return this
  }

  where(column: string, operator: string, value: any) {
    this.whereConditions.push({ column, operator, value })
    return this
  }

  orderBy(column: string, ascending = true) {
    this.orderByFields.push({ column, ascending })
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  offset(count: number) {
    this.offsetValue = count
    return this
  }

  async execute() {
    let query = this.supabase
      .from(this.tableName)
      .select(this.selectFields)

    // Apply where conditions
    this.whereConditions.forEach(({ column, operator, value }) => {
      switch (operator) {
        case 'eq':
          query = query.eq(column, value)
          break
        case 'neq':
          query = query.neq(column, value)
          break
        case 'gt':
          query = query.gt(column, value)
          break
        case 'gte':
          query = query.gte(column, value)
          break
        case 'lt':
          query = query.lt(column, value)
          break
        case 'lte':
          query = query.lte(column, value)
          break
        case 'like':
          query = query.like(column, value)
          break
        case 'ilike':
          query = query.ilike(column, value)
          break
        case 'in':
          query = query.in(column, value)
          break
      }
    })

    // Apply ordering
    this.orderByFields.forEach(({ column, ascending }) => {
      query = query.order(column, { ascending })
    })

    // Apply pagination
    if (this.limitValue) {
      query = query.limit(this.limitValue)
    }
    if (this.offsetValue) {
      query = query.range(this.offsetValue, (this.offsetValue + (this.limitValue || 10)) - 1)
    }

    return query
  }
}

/**
 * Common optimized queries
 */
export const optimizedQueries = {
  // Get user's recent tasks with minimal data
  getUserRecentTasks: (userId: string, limit = 10) => 
    new OptimizedQueryBuilder('tasks')
      .select('id, title, due_date, priority, completed, created_at')
      .where('user_id', 'eq', userId)
      .orderBy('created_at', false)
      .limit(limit),

  // Get user's recent notes with minimal data
  getUserRecentNotes: (userId: string, limit = 10) =>
    new OptimizedQueryBuilder('notes')
      .select('id, title, updated_at, folder_id')
      .where('user_id', 'eq', userId)
      .orderBy('updated_at', false)
      .limit(limit),

  // Get study group members with user info
  getGroupMembers: (groupId: string) =>
    new OptimizedQueryBuilder('study_group_members')
      .select(`
        id,
        role,
        joined_at,
        user:user_id (
          id,
          name,
          avatar_url
        )
      `)
      .where('group_id', 'eq', groupId),

  // Get paginated resources with vote counts
  getPaginatedResources: (page: number, limit: number, filters?: Record<string, any>) => {
    const query = new OptimizedQueryBuilder('resources')
      .select(`
        id,
        title,
        description,
        file_url,
        file_type,
        subject,
        course_code,
        created_at,
        user:user_id (
          id,
          name,
          avatar_url
        ),
        votes:resource_votes (
          vote_type
        )
      `)
      .orderBy('created_at', false)
      .limit(limit)
      .offset((page - 1) * limit)

    // Apply filters if provided
    if (filters?.subject) {
      query.where('subject', 'ilike', `%${filters.subject}%`)
    }
    if (filters?.course_code) {
      query.where('course_code', 'ilike', `%${filters.course_code}%`)
    }

    return query
  },
}

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor
  private queryTimes: Map<string, number[]> = new Map()

  static getInstance() {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor()
    }
    return QueryPerformanceMonitor.instance
  }

  async measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await queryFn()
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record query time
      if (!this.queryTimes.has(queryName)) {
        this.queryTimes.set(queryName, [])
      }
      this.queryTimes.get(queryName)!.push(duration)

      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      console.error(`Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }

  getQueryStats(queryName: string) {
    const times = this.queryTimes.get(queryName) || []
    if (times.length === 0) return null

    const sum = times.reduce((a, b) => a + b, 0)
    const avg = sum / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    return { avg, min, max, count: times.length }
  }

  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [queryName] of this.queryTimes) {
      stats[queryName] = this.getQueryStats(queryName)
    }
    return stats
  }

  clearStats() {
    this.queryTimes.clear()
  }
}

export const queryPerformanceMonitor = QueryPerformanceMonitor.getInstance()