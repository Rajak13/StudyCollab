import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // ISO timestamp
    const entities = searchParams.get('entities')?.split(',') || ['notes', 'tasks', 'files', 'studyGroups'];

    const result: Record<string, any> = {};

    // Fetch latest data for each entity type
    for (const entity of entities) {
      try {
        const data = await fetchEntityData(supabase, entity, user.id, since);
        if (data && Object.keys(data).length > 0) {
          Object.assign(result, data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${entity}:`, error);
        // Continue with other entities even if one fails
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync latest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchEntityData(supabase: any, entity: string, userId: string, since?: string | null) {
  let query = supabase.from(getTableName(entity)).select('*').eq('user_id', userId);
  
  // Add timestamp filter if provided
  if (since) {
    query = query.gte('updated_at', since);
  }
  
  // Limit results to prevent large responses
  query = query.limit(1000).order('updated_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  if (!data || data.length === 0) {
    return {};
  }
  
  // Transform data into the expected format
  const result: Record<string, any> = {};
  
  for (const item of data) {
    const entityId = item.id;
    result[entityId] = {
      id: entityId,
      data: item,
      updatedAt: new Date(item.updated_at).getTime(),
    };
  }
  
  return result;
}

function getTableName(entity: string): string {
  switch (entity) {
    case 'notes':
      return 'notes';
    case 'tasks':
      return 'tasks';
    case 'files':
      return 'files';
    case 'studyGroups':
      return 'study_groups';
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}

// Handle study groups separately since they have different access patterns
async function fetchStudyGroupData(supabase: any, userId: string, since?: string | null) {
  // Get study groups where user is owner or member
  let query = supabase
    .from('study_groups')
    .select(`
      *,
      study_group_members!inner(user_id)
    `)
    .or(`owner_id.eq.${userId},study_group_members.user_id.eq.${userId}`);
  
  if (since) {
    query = query.gte('updated_at', since);
  }
  
  query = query.limit(100).order('updated_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  if (!data || data.length === 0) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  for (const group of data) {
    result[group.id] = {
      id: group.id,
      data: group,
      updatedAt: new Date(group.updated_at).getTime(),
    };
  }
  
  return result;
}