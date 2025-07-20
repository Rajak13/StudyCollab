-- Additional tables for StudyCollab (profiles table already exists)

-- Create custom types/enums
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'DOCX', 'PPT', 'VIDEO', 'LINK', 'IMAGE', 'OTHER');
CREATE TYPE "VoteType" AS ENUM ('UPVOTE', 'DOWNVOTE');
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- Create task_categories table
CREATE TABLE "task_categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) DEFAULT '#3B82F6',
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE "tasks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" DEFAULT 'MEDIUM',
    "status" "TaskStatus" DEFAULT 'TODO',
    "due_date" TIMESTAMP WITH TIME ZONE,
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "tags" TEXT[] DEFAULT '{}',
    "category_id" UUID REFERENCES "task_categories"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_folders table
CREATE TABLE "note_folders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "color" VARCHAR(7) DEFAULT '#6B7280',
    "parent_id" UUID REFERENCES "note_folders"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE "notes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "content" JSONB NOT NULL,
    "summary" TEXT,
    "tags" TEXT[] DEFAULT '{}',
    "is_public" BOOLEAN DEFAULT FALSE,
    "template" VARCHAR(50),
    "folder_id" UUID REFERENCES "note_folders"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE "resources" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "file_url" TEXT,
    "file_size" INTEGER,
    "subject" VARCHAR(100) NOT NULL,
    "course_code" VARCHAR(20),
    "tags" TEXT[] DEFAULT '{}',
    "upvotes" INTEGER DEFAULT 0,
    "downvotes" INTEGER DEFAULT 0,
    "score" FLOAT DEFAULT 0,
    "is_verified" BOOLEAN DEFAULT FALSE,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE "votes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" "VoteType" NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "resource_id" UUID NOT NULL REFERENCES "resources"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id", "resource_id")
);

-- Create comments table
CREATE TABLE "comments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "parent_id" UUID REFERENCES "comments"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "resource_id" UUID NOT NULL REFERENCES "resources"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_groups table
CREATE TABLE "study_groups" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "subject" VARCHAR(100),
    "university" VARCHAR(255),
    "is_private" BOOLEAN DEFAULT FALSE,
    "owner_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE "group_members" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "role" "GroupRole" DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "group_id" UUID NOT NULL REFERENCES "study_groups"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "group_id")
);

-- Create indexes for better performance
CREATE INDEX "idx_tasks_user_id" ON "tasks"("user_id");
CREATE INDEX "idx_tasks_due_date" ON "tasks"("due_date");
CREATE INDEX "idx_tasks_status" ON "tasks"("status");
CREATE INDEX "idx_notes_user_id" ON "notes"("user_id");
CREATE INDEX "idx_notes_folder_id" ON "notes"("folder_id");
CREATE INDEX "idx_notes_search" ON "notes" USING GIN (to_tsvector('english', "title" || ' ' || "content"));
CREATE INDEX "idx_resources_user_id" ON "resources"("user_id");
CREATE INDEX "idx_resources_subject" ON "resources"("subject");
CREATE INDEX "idx_resources_score" ON "resources"("score" DESC);
CREATE INDEX "idx_votes_resource_id" ON "votes"("resource_id");
CREATE INDEX "idx_comments_resource_id" ON "comments"("resource_id");
CREATE INDEX "idx_group_members_group_id" ON "group_members"("group_id");

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (profiles already has this)
CREATE TRIGGER update_task_categories_updated_at BEFORE UPDATE ON "task_categories" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON "tasks" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_note_folders_updated_at BEFORE UPDATE ON "note_folders" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON "notes" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON "resources" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON "comments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON "study_groups" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();