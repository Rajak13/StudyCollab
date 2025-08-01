| schemaname | tablename       | policyname                                  | permissive | roles    | cmd    | qual                                        | with_check             |
| ---------- | --------------- | ------------------------------------------- | ---------- | -------- | ------ | ------------------------------------------- | ---------------------- |
| public     | profiles        | Users can view their own profile            | PERMISSIVE | {public} | SELECT | (auth.uid() = id)                           | null                   |
| public     | profiles        | Users can update their own profile          | PERMISSIVE | {public} | UPDATE | (auth.uid() = id)                           | null                   |
| public     | profiles        | Users can insert their own profile          | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = id)      |
| public     | task_categories | Users can view own task categories          | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                      | null                   |
| public     | task_categories | Users can create own task categories        | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = user_id) |
| public     | task_categories | Users can update own task categories        | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                      | null                   |
| public     | task_categories | Users can delete own task categories        | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                      | null                   |
| public     | tasks           | Users can view own tasks                    | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                      | null                   |
| public     | tasks           | Users can create own tasks                  | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = user_id) |
| public     | tasks           | Users can update own tasks                  | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                      | null                   |
| public     | tasks           | Users can delete own tasks                  | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                      | null                   |
| public     | note_folders    | Users can view own note folders             | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                      | null                   |
| public     | note_folders    | Users can create own note folders           | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = user_id) |
| public     | note_folders    | Users can update own note folders           | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                      | null                   |
| public     | note_folders    | Users can delete own note folders           | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                      | null                   |
| public     | notes           | Users can view own notes                    | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                      | null                   |
| public     | notes           | Users can view public notes                 | PERMISSIVE | {public} | SELECT | (is_public = true)                          | null                   |
| public     | notes           | Users can create own notes                  | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = user_id) |
| public     | notes           | Users can update own notes                  | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                      | null                   |
| public     | notes           | Users can delete own notes                  | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                      | null                   |
| public     | resources       | Anyone can view resources                   | PERMISSIVE | {public} | SELECT | true                                        | null                   |
| public     | resources       | Users can create resources                  | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = user_id) |
| public     | resources       | Users can update own resources              | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                      | null                   |
| public     | resources       | Users can delete own resources              | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                      | null                   |
| public     | votes           | Anyone can view votes                       | PERMISSIVE | {public} | SELECT | true                                        | null                   |
| public     | votes           | Users can create votes                      | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = user_id) |
| public     | votes           | Users can update own votes                  | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                      | null                   |
| public     | votes           | Users can delete own votes                  | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                      | null                   |
| public     | comments        | Anyone can view comments                    | PERMISSIVE | {public} | SELECT | true                                        | null                   |
| public     | comments        | Users can create comments                   | PERMISSIVE | {public} | INSERT | null                                        | (auth.uid() = user_id) |
| public     | comments        | Users can update own comments               | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                      | null                   |
| public     | comments        | Users can delete own comments               | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                      | null                   |
| public     | study_groups    | Anyone can view public study groups         | PERMISSIVE | {public} | SELECT | (is_private = false)                        | null                   |
| public     | study_groups    | Group members can view private study groups | PERMISSIVE | {public} | SELECT | ((is_private = true) AND (EXISTS ( SELECT 1 |

FROM group_members
WHERE ((group_members.group_id = study_groups.id) AND (group_members.user_id = auth.uid()))))) | null |
| public | study_groups | Users can create study groups | PERMISSIVE | {public} | INSERT | null | (auth.uid() = owner_id) |
| public | study_groups | Group owners can update study groups | PERMISSIVE | {public} | UPDATE | (auth.uid() = owner_id) | null |
| public | study_groups | Group owners can delete study groups | PERMISSIVE | {public} | DELETE | (auth.uid() = owner_id) | null |
| public | group_members | Anyone can view group memberships for public groups | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
FROM study_groups
WHERE ((study_groups.id = group_members.group_id) AND (study_groups.is_private = false)))) | null |
| public | group_members | Group members can view memberships for private groups | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
FROM study_groups
WHERE ((study_groups.id = group_members.group_id) AND ((study_groups.is_private = false) OR (EXISTS ( SELECT 1
FROM group_members gm2
WHERE ((gm2.group_id = group_members.group_id) AND (gm2.user_id = auth.uid())))))))) | null |
| public | group_members | Users can join groups | PERMISSIVE | {public} | INSERT | null | (auth.uid() = user_id) |
| public | group_members | Group owners and admins can manage memberships | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
FROM group_members gm
WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = auth.uid()) AND (gm.role = ANY (ARRAY['OWNER'::"GroupRole", 'ADMIN'::"GroupRole"]))))) | null |
| public | group_members | Users can leave groups | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id) | null |
| public | group_members | Group owners and admins can remove members | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
FROM group_members gm
WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = auth.uid()) AND (gm.role = ANY (ARRAY['OWNER'::"GroupRole", 'ADMIN'::"GroupRole"]))))) | null |
| storage | objects | Users can upload their own avatars | PERMISSIVE | {public} | INSERT | null | ((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)) |
| storage | objects | Anyone can view avatars | PERMISSIVE | {public} | SELECT | (bucket_id = 'avatars'::text) | null |
| storage | objects | Users can update their own avatars | PERMISSIVE | {public} | UPDATE | ((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)) | null |
| storage | objects | Users can delete their own avatars | PERMISSIVE | {public} | DELETE | ((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)) | null |
| public | files | Users can view own files | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null |
| public | files | Users can view public files | PERMISSIVE | {public} | SELECT | (is_public = true) | null |
| public | files | Users can create own files | PERMISSIVE | {public} | INSERT | null | (auth.uid() = user_id) |
| public | files | Users can update own files | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id) | null |
| public | files | Users can delete own files | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id) | null |
| public | file_folders | Users can view own file folders | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null |
| public | file_folders | Users can create own file folders | PERMISSIVE | {public} | INSERT | null | (auth.uid() = user_id) |
| public | file_folders | Users can update own file folders | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id) | null |
| public | file_folders | Users can delete own file folders | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id) | null |
| public | file_shares | Users can view own file shares | PERMISSIVE | {public} | SELECT | ((auth.uid() = created_by) OR (EXISTS ( SELECT 1
FROM files
WHERE ((files.id = file_shares.file_id) AND (files.user_id = auth.uid()))))) | null |
| public | file_shares | Users can create file shares for own files | PERMISSIVE | {public} | INSERT | null | ((auth.uid() = created_by) AND (EXISTS ( SELECT 1
FROM files
WHERE ((files.id = file_shares.file_id) AND (files.user_id = auth.uid()))))) |
| public | file_shares | Users can update own file shares | PERMISSIVE | {public} | UPDATE | (auth.uid() = created_by) | null |
| public | file_shares | Users can delete own file shares | PERMISSIVE | {public} | DELETE | (auth.uid() = created_by) | null |
| public | file_access_logs | Users can view access logs for own files | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
FROM files
WHERE ((files.id = file_access_logs.file_id) AND (files.user_id = auth.uid())))) | null |
| storage | objects | Users can upload their own files | PERMISSIVE | {public} | INSERT | null | ((bucket_id = 'files'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])) |
| storage | objects | Users can view their own files | PERMISSIVE | {public} | SELECT | ((bucket_id = 'files'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])) | null |
| storage | objects | Users can update their own files | PERMISSIVE | {public} | UPDATE | ((bucket_id = 'files'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])) | null |
| storage | objects | Users can delete their own files | PERMISSIVE | {public} | DELETE | ((bucket_id = 'files'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])) | null |
| storage | objects | Public files are viewable by everyone | PERMISSIVE | {public} | SELECT | (bucket_id = 'files'::text) | null |
