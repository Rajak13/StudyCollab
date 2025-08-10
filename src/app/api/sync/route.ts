import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
  userId?: string;
  retryCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const change: OfflineChange = await request.json();
    const supabase = createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process the change based on entity type and operation
    switch (change.entity) {
      case 'notes':
        return await handleNotesSync(supabase, change, user.id);
      case 'tasks':
        return await handleTasksSync(supabase, change, user.id);
      case 'files':
        return await handleFilesSync(supabase, change, user.id);
      case 'studyGroups':
        return await handleStudyGroupsSync(supabase, change, user.id);
      default:
        return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleNotesSync(supabase: any, change: OfflineChange, userId: string) {
  const table = 'notes';
  
  switch (change.type) {
    case 'create':
    case 'update':
      const { error: upsertError } = await supabase
        .from(table)
        .upsert({
          id: change.entityId,
          ...change.data,
          user_id: userId,
          updated_at: new Date(change.timestamp).toISOString(),
        });
      
      if (upsertError) {
        throw upsertError;
      }
      break;
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', change.entityId)
        .eq('user_id', userId);
      
      if (deleteError) {
        throw deleteError;
      }
      break;
  }
  
  return NextResponse.json({ success: true });
}

async function handleTasksSync(supabase: any, change: OfflineChange, userId: string) {
  const table = 'tasks';
  
  switch (change.type) {
    case 'create':
    case 'update':
      const { error: upsertError } = await supabase
        .from(table)
        .upsert({
          id: change.entityId,
          ...change.data,
          user_id: userId,
          updated_at: new Date(change.timestamp).toISOString(),
        });
      
      if (upsertError) {
        throw upsertError;
      }
      break;
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', change.entityId)
        .eq('user_id', userId);
      
      if (deleteError) {
        throw deleteError;
      }
      break;
  }
  
  return NextResponse.json({ success: true });
}

async function handleFilesSync(supabase: any, change: OfflineChange, userId: string) {
  const table = 'files';
  
  switch (change.type) {
    case 'create':
    case 'update':
      const { error: upsertError } = await supabase
        .from(table)
        .upsert({
          id: change.entityId,
          ...change.data,
          user_id: userId,
          updated_at: new Date(change.timestamp).toISOString(),
        });
      
      if (upsertError) {
        throw upsertError;
      }
      break;
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', change.entityId)
        .eq('user_id', userId);
      
      if (deleteError) {
        throw deleteError;
      }
      break;
  }
  
  return NextResponse.json({ success: true });
}

async function handleStudyGroupsSync(supabase: any, change: OfflineChange, userId: string) {
  const table = 'study_groups';
  
  switch (change.type) {
    case 'create':
    case 'update':
      // For study groups, we need to check if the user has permission to modify
      const { data: existingGroup } = await supabase
        .from(table)
        .select('owner_id')
        .eq('id', change.entityId)
        .single();
      
      if (existingGroup && existingGroup.owner_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized to modify this study group' }, { status: 403 });
      }
      
      const { error: upsertError } = await supabase
        .from(table)
        .upsert({
          id: change.entityId,
          ...change.data,
          owner_id: userId,
          updated_at: new Date(change.timestamp).toISOString(),
        });
      
      if (upsertError) {
        throw upsertError;
      }
      break;
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', change.entityId)
        .eq('owner_id', userId);
      
      if (deleteError) {
        throw deleteError;
      }
      break;
  }
  
  return NextResponse.json({ success: true });
}