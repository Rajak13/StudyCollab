-- FINAL FIX for Study Groups Issues
-- This version handles enum type casting correctly

-- Step 1: Fix missing owner memberships (without explicit casting)
INSERT INTO group_members (user_id, group_id, role, joined_at)
SELECT 
  sg.owner_id,
  sg.id,
  'OWNER',
  sg.created_at
FROM study_groups sg
WHERE NOT EXISTS (
  SELECT 1 FROM group_members gm 
  WHERE gm.user_id = sg.owner_id AND gm.group_id = sg.id
)
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Step 2: Clean up orphaned records
DELETE FROM group_activities WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_messages WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_shared_resources WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_join_requests WHERE group_id NOT IN (SELECT id FROM study_groups);
DELETE FROM group_members WHERE group_id NOT IN (SELECT id FROM study_groups);

-- Step 3: Create safe deletion function
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

-- Step 4: Create membership consistency fix function
CREATE OR REPLACE FUNCTION fix_group_membership_consistency()
RETURNS INTEGER AS $$
DECLARE
  fixed_count INTEGER := 0;
BEGIN
  INSERT INTO group_members (user_id, group_id, role, joined_at)
  SELECT 
    sg.owner_id,
    sg.id,
    'OWNER',
    sg.created_at
  FROM study_groups sg
  WHERE NOT EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.user_id = sg.owner_id AND gm.group_id = sg.id
  )
  ON CONFLICT (user_id, group_id) DO NOTHING;
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION delete_study_group_safely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_group_membership_consistency() TO authenticated;

-- Step 6: Run the fix and show results
SELECT fix_group_membership_consistency() as owners_fixed;

-- Step 7: Show current state for verification
SELECT 
  sg.name,
  sg.owner_id,
  CASE WHEN gm.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as owner_in_members
FROM study_groups sg
LEFT JOIN group_members gm ON sg.id = gm.group_id AND sg.owner_id = gm.user_id
ORDER BY sg.name;