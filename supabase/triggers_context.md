| event_object_schema | event_object_table | trigger_name                      | action_timing | event_manipulation | action_statement                                       |
| ------------------- | ------------------ | --------------------------------- | ------------- | ------------------ | ------------------------------------------------------ |
| realtime            | subscription       | tr_check_filters                  | BEFORE        | INSERT             | EXECUTE FUNCTION realtime.subscription_check_filters() |
| realtime            | subscription       | tr_check_filters                  | BEFORE        | UPDATE             | EXECUTE FUNCTION realtime.subscription_check_filters() |
| storage             | objects            | update_objects_updated_at         | BEFORE        | UPDATE             | EXECUTE FUNCTION storage.update_updated_at_column()    |
| auth                | users              | on_auth_user_created              | AFTER         | INSERT             | EXECUTE FUNCTION handle_new_user()                     |
| public              | task_categories    | update_task_categories_updated_at | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | tasks              | update_tasks_updated_at           | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | note_folders       | update_note_folders_updated_at    | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | notes              | update_notes_updated_at           | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | resources          | update_resources_updated_at       | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | comments           | update_comments_updated_at        | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | study_groups       | update_study_groups_updated_at    | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | votes              | on_vote_change                    | AFTER         | INSERT             | EXECUTE FUNCTION update_resource_score()               |
| public              | votes              | on_vote_change                    | AFTER         | DELETE             | EXECUTE FUNCTION update_resource_score()               |
| public              | votes              | on_vote_change                    | AFTER         | UPDATE             | EXECUTE FUNCTION update_resource_score()               |
| public              | votes              | prevent_self_vote_trigger         | BEFORE        | INSERT             | EXECUTE FUNCTION prevent_self_vote()                   |
| public              | votes              | prevent_self_vote_trigger         | BEFORE        | UPDATE             | EXECUTE FUNCTION prevent_self_vote()                   |
| public              | files              | update_files_updated_at           | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | file_folders       | update_file_folders_updated_at    | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()            |
| public              | file_access_logs   | on_file_access_log                | AFTER         | INSERT             | EXECUTE FUNCTION increment_file_download_count()       |
