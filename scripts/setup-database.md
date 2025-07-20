# Database Setup Instructions

This document provides step-by-step instructions for setting up the StudyCollab database with Supabase.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Database password from your Supabase project settings

## Step 1: Configure Environment Variables

1. Copy your database connection string from Supabase Dashboard > Settings > Database
2. Update the `DATABASE_URL` in your `.env.local` file:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.rvosteyajdubiwvvhitu.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your actual database password.

## Step 2: Run Database Migrations

Execute the following SQL files in your Supabase SQL Editor in order:

### 1. Initial Schema (`supabase/migrations/001_initial_schema.sql`)

- Creates all database tables
- Sets up indexes for performance
- Creates triggers for automatic timestamp updates

### 2. Row Level Security Policies (`supabase/migrations/002_rls_policies.sql`)

- Enables RLS on all tables
- Creates security policies for data access control
- Ensures users can only access their own data (where appropriate)

### 3. Authentication Functions (`supabase/migrations/003_auth_functions.sql`)

- Creates function to automatically create user records on signup
- Sets up vote scoring system for resources
- Prevents users from voting on their own resources

## Step 3: Push Prisma Schema (Alternative Method)

If you prefer to use Prisma to manage the database schema:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

## Step 4: Verify Setup

1. Check that all tables are created in your Supabase dashboard
2. Verify that RLS is enabled on all tables
3. Test user registration to ensure the trigger creates user records
4. Run the seed script to populate with sample data

## Step 5: Enable Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Enable email authentication
3. Configure email templates if desired
4. Set up any additional authentication providers

## Troubleshooting

### Common Issues:

1. **Connection Error**: Verify your DATABASE_URL is correct and includes the right password
2. **Permission Denied**: Ensure you're using the correct service role key for admin operations
3. **RLS Blocking Queries**: Check that your RLS policies are correctly configured
4. **Trigger Not Working**: Verify the auth trigger is created and enabled

### Testing the Setup:

```sql
-- Test user creation
SELECT * FROM auth.users LIMIT 5;
SELECT * FROM public.users LIMIT 5;

-- Test RLS policies
SELECT * FROM public.tasks; -- Should only show your tasks
SELECT * FROM public.resources; -- Should show all public resources
```

## Next Steps

After completing the database setup:

1. Test user registration and login
2. Verify that protected routes work with middleware
3. Test CRUD operations for tasks, notes, and resources
4. Ensure RLS policies are working correctly
