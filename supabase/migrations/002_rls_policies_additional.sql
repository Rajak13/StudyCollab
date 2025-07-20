-- Enable Row Level Security on new tables (profiles already has RLS enabled)
ALTER TABLE "task_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_folders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_members" ENABLE ROW LEVEL SECURITY;

-- Task categories policies
CREATE POLICY "Users can view own task categories" ON "task_categories"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own task categories" ON "task_categories"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task categories" ON "task_categories"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task categories" ON "task_categories"
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON "tasks"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON "tasks"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON "tasks"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON "tasks"
    FOR DELETE USING (auth.uid() = user_id);

-- Note folders policies
CREATE POLICY "Users can view own note folders" ON "note_folders"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own note folders" ON "note_folders"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own note folders" ON "note_folders"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own note folders" ON "note_folders"
    FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON "notes"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public notes" ON "notes"
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own notes" ON "notes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON "notes"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON "notes"
    FOR DELETE USING (auth.uid() = user_id);

-- Resources policies
CREATE POLICY "Anyone can view resources" ON "resources"
    FOR SELECT USING (true);

CREATE POLICY "Users can create resources" ON "resources"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resources" ON "resources"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resources" ON "resources"
    FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can view votes" ON "votes"
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON "votes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON "votes"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON "votes"
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON "comments"
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON "comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON "comments"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON "comments"
    FOR DELETE USING (auth.uid() = user_id);

-- Study groups policies
CREATE POLICY "Anyone can view public study groups" ON "study_groups"
    FOR SELECT USING (is_private = false);

CREATE POLICY "Group members can view private study groups" ON "study_groups"
    FOR SELECT USING (
        is_private = true AND 
        EXISTS (
            SELECT 1 FROM "group_members" 
            WHERE "group_id" = "study_groups"."id" 
            AND "user_id" = auth.uid()
        )
    );

CREATE POLICY "Users can create study groups" ON "study_groups"
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update study groups" ON "study_groups"
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete study groups" ON "study_groups"
    FOR DELETE USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Anyone can view group memberships for public groups" ON "group_members"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "study_groups" 
            WHERE "id" = "group_members"."group_id" 
            AND "is_private" = false
        )
    );

CREATE POLICY "Group members can view memberships for private groups" ON "group_members"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "study_groups" 
            WHERE "id" = "group_members"."group_id" 
            AND (
                "is_private" = false OR 
                EXISTS (
                    SELECT 1 FROM "group_members" gm2 
                    WHERE gm2."group_id" = "group_members"."group_id" 
                    AND gm2."user_id" = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can join groups" ON "group_members"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group owners and admins can manage memberships" ON "group_members"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "group_members" gm 
            WHERE gm."group_id" = "group_members"."group_id" 
            AND gm."user_id" = auth.uid() 
            AND gm."role" IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can leave groups" ON "group_members"
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Group owners and admins can remove members" ON "group_members"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "group_members" gm 
            WHERE gm."group_id" = "group_members"."group_id" 
            AND gm."user_id" = auth.uid() 
            AND gm."role" IN ('OWNER', 'ADMIN')
        )
    );