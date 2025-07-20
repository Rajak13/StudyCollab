# Supabase Database Setup Guide

This guide will help you set up the StudyCollab database using Supabase SQL Editor.

## Prerequisites

✅ You already have:

- Supabase project created
- `profiles` table with RLS policies
- `avatars` storage bucket
- User creation trigger function

## Step-by-Step Setup

### 1. Run Migration Files in Order

Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

#### Step 1: Create Additional Tables

Copy and paste the contents of `supabase/migrations/001_additional_tables.sql` into the SQL Editor and run it.

This will create:

- Custom enums (TaskPriority, TaskStatus, ResourceType, VoteType, GroupRole)
- All application tables (tasks, notes, resources, etc.)
- Indexes for performance
- Update triggers

#### Step 2: Enable Row Level Security

Copy and paste the contents of `supabase/migrations/002_rls_policies_additional.sql` into the SQL Editor and run it.

This will:

- Enable RLS on all new tables
- Create security policies for data access control
- Ensure users can only access their own data

#### Step 3: Add Helper Functions

Copy and paste the contents of `supabase/migrations/003_additional_functions.sql` into the SQL Editor and run it.

This will create:

- Resource scoring system based on votes
- Self-vote prevention system

### 2. Verify Setup

After running all migrations, verify your setup:

```sql
-- Check that all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check that RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Test the profiles table
SELECT * FROM profiles LIMIT 1;
```

### 3. Test Authentication Flow

1. **Sign up a test user** through your app
2. **Check that profile is created automatically**:
   ```sql
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
   ```
3. **Test RLS policies** by trying to access data from different users

### 4. Environment Configuration

Make sure your `.env.local` has the correct Supabase configuration:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rvosteyajdubiwvvhitu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema Overview

After setup, you'll have these tables:

```
auth.users (Supabase managed)
├── profiles (your existing table)
    ├── task_categories
    ├── tasks
    ├── note_folders
    ├── notes
    ├── resources
    │   ├── votes
    │   └── comments
    └── study_groups
        └── group_members
```

## Key Features

### Row Level Security (RLS)

- ✅ Users can only see their own tasks, notes, and categories
- ✅ Resources are public but users can only edit their own
- ✅ Study groups have member-based access control
- ✅ Votes and comments are public but users can only manage their own

### Automatic Functions

- ✅ Profile creation on user signup (already working)
- ✅ Resource score calculation based on votes
- ✅ Prevention of self-voting on resources
- ✅ Automatic timestamp updates

### Storage Integration

- ✅ `avatars` bucket for profile pictures
- ✅ Ready for additional buckets (resources, etc.)

## Testing Your Setup

### 1. Test Profile Creation

```javascript
// In your app, sign up a new user and check if profile is created
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    data: { name: 'Test User' },
  },
})
```

### 2. Test RLS Policies

```javascript
// Try to create a task for the authenticated user
const { data, error } = await supabase.from('tasks').insert({
  title: 'Test Task',
  description: 'Testing RLS',
  priority: 'MEDIUM',
  status: 'TODO',
})
```

### 3. Test Resource Voting

```javascript
// Create a resource and try to vote on it
const { data: resource } = await supabase
  .from('resources')
  .insert({
    title: 'Test Resource',
    description: 'Testing resource creation',
    type: 'PDF',
    subject: 'Computer Science',
  })
  .select()
  .single()

// Try to vote (should fail if it's your own resource)
const { error } = await supabase.from('votes').insert({
  type: 'UPVOTE',
  resource_id: resource.id,
})
```

## Troubleshooting

### Common Issues:

1. **Migration fails**: Check if you have the correct permissions and run migrations in order
2. **RLS blocking queries**: Ensure you're authenticated when testing
3. **Profile not created**: Check if the trigger function is working
4. **Can't vote on resources**: This is expected behavior for your own resources

### Useful SQL Queries:

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check triggers
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check functions
SELECT * FROM information_schema.routines WHERE routine_schema = 'public';
```

## Next Steps

After completing the database setup:

1. ✅ Test user registration and profile creation
2. ✅ Verify RLS policies are working
3. ✅ Test CRUD operations for all entities
4. ✅ Set up file upload for resources (if needed)
5. ✅ Add sample data for development

Your database is now ready for the StudyCollab application! 🎉
