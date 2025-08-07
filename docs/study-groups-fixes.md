# Study Groups Issues and Fixes

## Issues Identified

### 1. Foreign Key Constraint Violations (500 errors on DELETE)
**Error**: `insert or update on table "group_activities" violates foreign key constraint "group_activities_group_id_fkey"`

**Root Cause**: When deleting study groups, the cascade deletion wasn't working properly due to timing issues or data inconsistencies.

### 2. Group Not Found Errors (404 errors)
**Error**: `Group not found: {error: {code: 'PGRST116', details: 'The result contains 0 rows'}}`

**Root Cause**: Groups exist in the `study_groups` table but owners are missing from the `group_members` table, causing membership checks to fail.

### 3. Data Consistency Issues
- Group owners not properly added to `group_members` table
- Orphaned records in related tables
- Membership inconsistencies

## Fixes Applied

### 1. Database Migration (015_fix_study_groups_deletion_and_consistency.sql)

#### Data Consistency Fixes:
- Automatically add missing group owners to `group_members` table
- Clean up orphaned records in all related tables
- Create robust trigger function for owner membership

#### Safe Deletion Function:
```sql
CREATE OR REPLACE FUNCTION delete_study_group_safely(group_id_param UUID)
```
- Deletes records in correct order to avoid foreign key violations
- Returns boolean indicating success/failure

#### Utility Functions:
- `fix_group_membership_consistency()`: Fixes missing owner memberships
- `cleanup_orphaned_group_data()`: Removes orphaned records
- `group_consistency_check` view: For debugging data consistency

### 2. API Route Updates

#### DELETE Route (`/api/study-groups/[id]/route.ts`):
- Uses `delete_study_group_safely()` function instead of direct DELETE
- Better error handling and logging
- Returns appropriate status codes

#### Requests Route (`/api/study-groups/[id]/requests/route.ts`):
- Automatically fixes membership consistency for group owners
- Better error handling for missing memberships
- Improved debugging information

### 3. Debug Tools

#### Debug Page (`/debug-study-groups-fix`):
- Visual interface to check group consistency
- Buttons to run fix functions
- Real-time status of all groups

#### Quick Fix Script (`scripts/fix-study-groups.sql`):
- Manual SQL script for immediate fixes
- Can be run directly in Supabase SQL editor

## How to Apply Fixes

### Option 1: Run Migration
```bash
cd studycollab-mvp
npx supabase db push
```

### Option 2: Manual SQL Execution
1. Open Supabase SQL Editor
2. Copy and paste contents of `scripts/fix-study-groups.sql`
3. Execute the script

### Option 3: Use Debug Interface
1. Navigate to `/debug-study-groups-fix`
2. Click "Fix Membership Consistency"
3. Click "Cleanup Orphaned Data"
4. Verify results in the table

## Verification

After applying fixes, verify:

1. **No 404 errors** when accessing group requests
2. **No 500 errors** when deleting groups
3. **All group owners** appear in `group_members` table
4. **No orphaned records** in related tables

## Prevention

The updated trigger function and API routes should prevent these issues from recurring by:

- Using `ON CONFLICT` clauses to handle duplicate insertions
- Automatically fixing membership consistency when detected
- Using safe deletion functions
- Better error handling and logging

## Testing

Test the following scenarios:
1. Create a new study group → Owner should be automatically added to members
2. Delete a study group → Should delete cleanly without foreign key errors
3. Access group requests as owner → Should work without 404 errors
4. Join/leave groups → Should maintain data consistency