-- File Storage and Management System Migration (Fixed for Supabase SQL Editor)

-- Create file storage table for personal file management (separate from resources)
CREATE TABLE "files" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL, -- Supabase Storage path
    "file_url" TEXT NOT NULL, -- Public URL
    "file_size" BIGINT NOT NULL, -- Size in bytes
    "mime_type" VARCHAR(100) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL, -- PDF, IMAGE, DOCUMENT, etc.
    "description" TEXT,
    "tags" TEXT[] DEFAULT '{}',
    "folder_id" UUID REFERENCES "file_folders"("id"),
    "is_public" BOOLEAN DEFAULT FALSE,
    "download_count" INTEGER DEFAULT 0,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file folders table for organization
CREATE TABLE "file_folders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7) DEFAULT '#6B7280',
    "parent_id" UUID REFERENCES "file_folders"("id"),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file shares table for secure sharing
CREATE TABLE "file_shares" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "file_id" UUID NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
    "share_token" VARCHAR(255) UNIQUE NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE,
    "password_hash" TEXT, -- Optional password protection
    "max_downloads" INTEGER, -- Optional download limit
    "download_count" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_by" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file access logs for tracking
CREATE TABLE "file_access_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "file_id" UUID NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "profiles"("id"), -- NULL for anonymous access
    "action" VARCHAR(50) NOT NULL, -- VIEW, DOWNLOAD, SHARE
    "ip_address" INET,
    "user_agent" TEXT,
    "share_token" VARCHAR(255), -- If accessed via share link
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX "idx_files_user_id" ON "files"("user_id");
CREATE INDEX "idx_files_folder_id" ON "files"("folder_id");
CREATE INDEX "idx_files_file_type" ON "files"("file_type");
CREATE INDEX "idx_files_created_at" ON "files"("created_at" DESC);
CREATE INDEX "idx_files_search" ON "files" USING GIN (to_tsvector('english', "name" || ' ' || COALESCE("description", '')));

CREATE INDEX "idx_file_folders_user_id" ON "file_folders"("user_id");
CREATE INDEX "idx_file_folders_parent_id" ON "file_folders"("parent_id");

CREATE INDEX "idx_file_shares_file_id" ON "file_shares"("file_id");
CREATE INDEX "idx_file_shares_token" ON "file_shares"("share_token");
CREATE INDEX "idx_file_shares_expires_at" ON "file_shares"("expires_at");

CREATE INDEX "idx_file_access_logs_file_id" ON "file_access_logs"("file_id");
CREATE INDEX "idx_file_access_logs_user_id" ON "file_access_logs"("user_id");
CREATE INDEX "idx_file_access_logs_created_at" ON "file_access_logs"("created_at" DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON "files" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_file_folders_updated_at BEFORE UPDATE ON "file_folders" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "file_folders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "file_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "file_access_logs" ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can view own files" ON "files"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public files" ON "files"
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own files" ON "files"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON "files"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON "files"
    FOR DELETE USING (auth.uid() = user_id);

-- File folders policies
CREATE POLICY "Users can view own file folders" ON "file_folders"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own file folders" ON "file_folders"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own file folders" ON "file_folders"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own file folders" ON "file_folders"
    FOR DELETE USING (auth.uid() = user_id);

-- File shares policies
CREATE POLICY "Users can view own file shares" ON "file_shares"
    FOR SELECT USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM "files" WHERE "id" = file_id AND "user_id" = auth.uid())
    );

CREATE POLICY "Users can create file shares for own files" ON "file_shares"
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (SELECT 1 FROM "files" WHERE "id" = file_id AND "user_id" = auth.uid())
    );

CREATE POLICY "Users can update own file shares" ON "file_shares"
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own file shares" ON "file_shares"
    FOR DELETE USING (auth.uid() = created_by);

-- File access logs policies (read-only for users)
CREATE POLICY "Users can view access logs for own files" ON "file_access_logs"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM "files" WHERE "id" = file_id AND "user_id" = auth.uid())
    );