import { createClient } from '@/lib/supabase'
import { ApiResponse } from '@/types/database'
import { NextResponse } from 'next/server'

// GET /api/resources/subjects - Get popular subjects
export async function GET() {
  try {
    const supabase = createClient()

    // Get subjects ordered by frequency of use
    const { data: subjects, error } = await supabase
      .from('resources')
      .select('subject')
      .not('subject', 'is', null)

    if (error) {
      console.error('Error fetching subjects:', error)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch subjects' },
        { status: 500 }
      )
    }

    // Count frequency of each subject
    const subjectCounts = subjects.reduce(
      (acc: Record<string, number>, { subject }) => {
        acc[subject] = (acc[subject] || 0) + 1
        return acc
      },
      {}
    )

    // Sort by frequency and return top subjects
    const popularSubjects = Object.entries(subjectCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([subject]) => subject)

    const response: ApiResponse<string[]> = {
      data: popularSubjects,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/resources/subjects:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
