import { createServiceSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const serviceSupabase = createServiceSupabaseClient()

        // Test basic service role functionality
        const debug: Record<string, unknown> = {
            serviceRoleKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
            timestamp: new Date().toISOString()
        }

        // Try a simple query that should work with service role
        try {
            const { data: allGroups, error: groupsError } = await serviceSupabase
                .from('study_groups')
                .select('id, name, owner_id')
                .limit(5)

            debug.allGroups = allGroups
            debug.groupsError = groupsError
        } catch (error) {
            debug.groupsError = error
        }

        // Try to get all group members (should bypass RLS)
        try {
            const { data: allMembers, error: membersError } = await serviceSupabase
                .from('group_members')
                .select('*')
                .limit(5)

            debug.allMembers = allMembers
            debug.membersError = membersError
        } catch (error) {
            debug.membersError = error
        }

        return NextResponse.json({ debug })
    } catch (error) {
        console.error('Service role test error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}