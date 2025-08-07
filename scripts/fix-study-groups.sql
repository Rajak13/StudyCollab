-- Quick fix script for study groups issues
-- Run this in your Supabase SQL editor or via CLI

-- 1. Fix missing owner memberships
INSERT INTO group_members (user_id, group_id, role, joined_at)
SELECT 
  sg.owner_id,
  sg.id,
  'OWNER'::group_role,
  sg.created_at
FROM study_groups sg
WHERE NOT EXISTS (
  SELECT 1 FROM group_members gm 
  WHERE gm.user_id = sg.owner_id AND gm.group_id = sg.id
)
ON CONFLICT (user_id, group_id) DO NOTHING;

-- 2. Clean up orphaned records
DELETE FROM group_activities WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_messages WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_shared_resources WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_join_requests WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_members WHERE group_id NOT IN (SELECT id FROM study_groups);

-- 3. Create safe deletion function
CREATE OR REPLACE FUNCTION delete_study_group_safely(group_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  group_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM study_groups WHERE id = group_id_param) INTO group_exists;
  
  IF NOT group_exists THEN
    RETURN FALSE;
  END IF;
  
  DELETE FROM group_activities WHERE group_id = group_id_param;
  DELETE FROM group_messages WHERE group_id = group_id_param;
  DELETE FROM group_shared_resources WHERE group_id = group_id_param;
  DELETE FROM group_join_requests WHERE group_id = group_id_param;
  DELETE FROM group_members WHERE group_id = group_id_param;
  DELETE FROM study_groups WHERE id = group_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION delete_study_group_safely(UUID) TO authenticated;