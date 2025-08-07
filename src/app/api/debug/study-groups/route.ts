import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface DebugInfo {
  user: {
    id: string | undefined
    email: string | undefined
  }
  timestamp: string
  specificGroup?: {
    groupId: string | null
    exists: boolean
    data: unknown
    error: PostgrestError | null
  }
  userGroups: {
    count: number
    data: unknown
    error: PostgrestError | null
  }
  memberships: {
    count: number
    data: unknown
    error: PostgrestError | null
  }
  connection: {
    test: unknown
    error: PostgrestError | null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    const debugInfo: DebugInfo = {
      user: {
        id: user.id,
        email: user.email,
      },
      timestamp: new Date().toISOString(),
      userGroups: {
        count: 0,
        data: null,
        error: null,
      },
      memberships: {
        count: 0,
        data: null,
        error: null,
      },
      connection: {
        test: null,
        error: null,
      },
    }

    // Check if specific group exists
    if (groupId) {
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle()

      debugInfo.specificGroup = {
        groupId,
        exists: !!group,
        data: group,
        error: groupError,
      }
    }

    // Get all study groups for the user
    const { data: userGroups, error: userGroupsError } = await supabase
      .from('study_groups')
      .select('*')
      .or(`owner_id.eq.${user.id},id.in.(${
        supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .toString()
      })`)

    debugInfo.userGroups = {
      count: userGroups?.length || 0,
      data: userGroups,
      error: userGroupsError,
    }

    // Get user's memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', user.id)

    debugInfo.memberships = {
      count: memberships?.length || 0,
      data: memberships,
      error: membershipsError,
    }

    // Check database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('study_groups')
      .select('count')
      .limit(1)

    debugInfo.connection = {
      test: connectionTest,
      error: connectionError,
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 