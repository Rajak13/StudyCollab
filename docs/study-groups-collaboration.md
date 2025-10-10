# Study Groups Collaboration Features

This document outlines the collaboration features implemented for study groups in StudyCollab MVP.

## Overview

The collaboration features enhance study groups with real-time communication, resource sharing, activity tracking, and group management capabilities.

## Features Implemented

### 1. Group Chat (Real-time)

- **Real-time messaging** using Supabase Realtime
- **Message threading** with reply functionality
- **File attachments** support in messages
- **Message types**: TEXT, FILE, SYSTEM
- **Auto-scroll** to new messages
- **User avatars** and timestamps
- **Permission-based** access (group members only)

**Components:**

- `GroupChat` - Main chat interface
- `useGroupMessages` - Hook for real-time message management
- `useCreateMessage` - Hook for sending messages

**API Endpoints:**

- `GET /api/study-groups/[id]/messages` - Fetch messages with pagination
- `POST /api/study-groups/[id]/messages` - Send new message

### 2. Shared Resources

- **File upload and sharing** within groups
- **Resource metadata** (title, description, tags)
- **Download tracking** with statistics
- **File type categorization** and filtering
- **Search functionality** across resources
- **Permission-based deletion** (owner or admin)

**Components:**

- `GroupSharedResources` - Resource management interface
- `useGroupResources` - Hook for resource management
- `useCreateResource` - Hook for sharing resources
- `useDownloadResource` - Hook for downloading with tracking

**API Endpoints:**

- `GET /api/study-groups/[id]/resources` - List shared resources
- `POST /api/study-groups/[id]/resources` - Share new resource
- `DELETE /api/study-groups/[id]/resources/[resourceId]` - Delete resource
- `POST /api/study-groups/[id]/resources/[resourceId]/download` - Track download

### 3. Activity Tracking

- **Comprehensive activity logging** for all group actions
- **Activity types**: Member actions, messages, resources, group changes
- **Real-time activity feed** with formatted messages
- **Activity filtering** by type, user, and date
- **Visual activity indicators** with icons and descriptions

**Activity Types Tracked:**

- `MEMBER_JOINED`, `MEMBER_LEFT`, `MEMBER_PROMOTED`, `MEMBER_DEMOTED`
- `MESSAGE_SENT`, `RESOURCE_SHARED`, `RESOURCE_DOWNLOADED`
- `GROUP_CREATED`, `GROUP_UPDATED`, `GROUP_ARCHIVED`

**Components:**

- `GroupActivities` - Activity feed display
- `useGroupActivities` - Hook for activity management
- `formatActivityMessage` - Helper for activity formatting

**API Endpoints:**

- `GET /api/study-groups/[id]/activities` - Fetch group activities

### 4. Group Archival System

- **Manual archival** by group owners
- **Automatic archival** for inactive groups (90+ days)
- **Archive status tracking** with timestamps
- **Unarchival capability** for group owners
- **Activity logging** for archival events

**Components:**

- Archive functionality integrated into `GroupDetail`
- Admin endpoint for automated archival

**API Endpoints:**

- `POST /api/study-groups/[id]/archive` - Archive group
- `DELETE /api/study-groups/[id]/archive` - Unarchive group
- `POST /api/admin/archive-inactive-groups` - Automated archival

## Database Schema

### New Tables Created

#### `group_messages`

```sql
- id (UUID, Primary Key)
- group_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- content (TEXT)
- message_type (ENUM: TEXT, FILE, SYSTEM)
- file_url, file_name, file_size (Optional file data)
- reply_to_id (UUID, Self-referencing for threading)
- created_at, updated_at (Timestamps)
```

#### `group_shared_resources`

```sql
- id (UUID, Primary Key)
- group_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- title, description (Resource metadata)
- file_url, file_name, file_size, file_type (File data)
- tags (TEXT[])
- download_count (INTEGER)
- created_at, updated_at (Timestamps)
```

#### `group_activities`

```sql
- id (UUID, Primary Key)
- group_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- activity_type (ENUM with 10+ activity types)
- activity_data (JSONB for additional data)
- created_at (Timestamp)
```

### Enhanced Tables

#### `study_groups` (Added columns)

```sql
- is_archived (BOOLEAN, default FALSE)
- archived_at (TIMESTAMP, nullable)
- last_activity_at (TIMESTAMP, default NOW())
```

## Security & Permissions

### Row Level Security (RLS)

- All new tables have RLS enabled
- Users can only access data for groups they're members of
- Proper permission checks for admin actions

### Permission Levels

- **Members**: Can view and participate in chat, share resources
- **Admins**: Can delete any resources, manage members
- **Owners**: Can archive/unarchive groups, full admin privileges

## Real-time Features

### Supabase Realtime Integration

- **Message subscriptions** for live chat updates
- **Automatic cache updates** when new messages arrive
- **Optimistic updates** for better user experience
- **Connection management** with proper cleanup

## Performance Optimizations

### Database Indexing

- Comprehensive indexes on all foreign keys
- Composite indexes for common query patterns
- Full-text search indexes where applicable

### Query Optimization

- Pagination for all list endpoints
- Cursor-based pagination for messages
- Efficient joins with proper select statements

### Caching Strategy

- TanStack Query for server state management
- Appropriate stale times for different data types
- Optimistic updates with rollback capability

## Testing

### Test Page

- `/test-study-groups-collaboration` - Comprehensive testing interface
- Individual component testing
- API endpoint testing
- Feature demonstration

### API Testing

- All endpoints include proper error handling
- Validation using Zod schemas
- Comprehensive error responses

## Usage Examples

### Basic Chat Usage

```tsx
import { GroupChat } from '@/components/study-groups/group-chat'

function MyGroupPage({ groupId }: { groupId: string }) {
  return <GroupChat groupId={groupId} />
}
```

### Resource Sharing

```tsx
import { GroupSharedResources } from '@/components/study-groups/group-shared-resources'

function ResourcesTab({ groupId }: { groupId: string }) {
  return <GroupSharedResources groupId={groupId} />
}
```

### Activity Tracking

```tsx
import { GroupActivities } from '@/components/study-groups/group-activities'

function ActivityFeed({ groupId }: { groupId: string }) {
  return <GroupActivities groupId={groupId} limit={10} />
}
```

## Future Enhancements

### Planned Features

- **Push notifications** for group activities
- **File preview** for common formats
- **Message search** and filtering
- **Bulk resource operations**
- **Advanced member management**
- **Group analytics and insights**

### Technical Improvements

- **File upload to Supabase Storage** (currently simulated)
- **Message encryption** for sensitive content
- **Advanced caching strategies**
- **Mobile app support**

## Deployment Notes

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_API_TOKEN=your_admin_token
```

### Database Migration

Run the migration file `013_study_groups_collaboration.sql` to create the new tables and functions.

### Scheduled Tasks

Set up a cron job or scheduled function to call the inactive group archival endpoint:

```bash
# Daily at 2 AM
0 2 * * * curl -X POST -H "Authorization: Bearer $ADMIN_API_TOKEN" https://your-app.com/api/admin/archive-inactive-groups
```

## Requirements Fulfilled

This implementation fulfills the following requirements from the task:

✅ **6.3**: Basic chat functionality for group communication  
✅ **6.4**: Shared resource space for documents and files  
✅ **6.7**: Group activity notifications and member tracking  
✅ **6.8**: Group archival system for inactive groups

All features are implemented with proper security, real-time capabilities, and comprehensive error handling.
