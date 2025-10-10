# How to Access Study Groups Functionality

This guide explains how to access and use the study groups collaboration features in StudyCollab MVP.

## 🚀 Quick Access

### 1. Main Study Groups Page

- **URL**: `/study-groups`
- **Navigation**: Click "Study Groups" in the sidebar
- **Features**: Browse, create, join, and manage study groups

### 2. Individual Group Pages

- **URL**: `/study-groups/[group-id]`
- **Access**: Click "View Group" button on any group you're a member of
- **Features**: Chat, shared resources, activities, member management

### 3. Test/Demo Page

- **URL**: `/test-study-groups-collaboration`
- **Access**: Link available on the main study groups page
- **Features**: Test all collaboration features with demo data

## 📱 Navigation Structure

```
StudyCollab MVP
├── Dashboard (/)
├── Study Groups (/study-groups)
│   ├── Browse & Join Groups
│   ├── Create New Groups
│   ├── My Groups Tab
│   └── Individual Group Pages (/study-groups/[id])
│       ├── Group Chat
│       ├── Shared Resources
│       ├── Activity Feed
│       └── Member Management
└── Test Page (/test-study-groups-collaboration)
```

## 🔧 How to Use Study Groups

### Step 1: Access Study Groups

1. Log into StudyCollab MVP
2. Click "Study Groups" in the left sidebar
3. You'll see the main study groups page with three tabs:
   - **Discover**: Browse and join public groups
   - **My Groups**: Groups you're already a member of
   - **Join Requests**: Pending requests (for group owners)

### Step 2: Create or Join a Group

**To Create a Group:**

1. Click "Create Group" button
2. Fill in group details (name, description, subject, etc.)
3. Choose privacy setting (public or private)
4. Click "Create"

**To Join a Group:**

1. Browse available groups in the "Discover" tab
2. Click "Join Group" for public groups
3. Click "Request to Join" for private groups
4. Wait for approval if it's a private group

### Step 3: Access Group Features

1. Go to "My Groups" tab
2. Click "View Group" on any group you're a member of
3. You'll see four main tabs:
   - **Chat**: Real-time group messaging
   - **Resources**: Shared files and documents
   - **Activity**: Group activity feed
   - **Members**: Member list and management

## 💬 Group Chat Features

### Real-time Messaging

- Send text messages instantly
- Messages appear in real-time for all members
- Auto-scroll to new messages

### Message Threading

- Reply to specific messages
- See reply context in conversations
- Organized threaded discussions

### File Sharing

- Share files directly in chat
- Support for various file types
- File size and type indicators

## 📎 Shared Resources

### Upload Resources

1. Go to the "Resources" tab in your group
2. Click "Share Resource"
3. Select file, add title and description
4. Add tags for organization
5. Click "Share"

### Download & Track

- Download any shared resource
- View download statistics
- See who shared what and when

### Search & Filter

- Search resources by title/description
- Filter by file type
- Sort by date, title, or popularity

## 📊 Activity Tracking

### What's Tracked

- Member joins/leaves
- Messages sent
- Resources shared/downloaded
- Group updates and changes
- Administrative actions

### Activity Feed

- Real-time activity updates
- Formatted activity messages
- User avatars and timestamps
- Activity type indicators

## 👥 Group Management

### Member Roles

- **Owner**: Full control, can archive group
- **Admin**: Manage members, delete resources
- **Member**: Participate in chat, share resources

### Group Settings

- Archive/unarchive groups (owners only)
- Update group information
- Manage privacy settings
- View group statistics

## 🔒 Permissions & Privacy

### Public Groups

- Anyone can join immediately
- Visible in group discovery
- Open participation

### Private Groups

- Require approval to join
- Only visible to members
- Owner/admin approval required

### Data Security

- Row Level Security (RLS) enabled
- Users only see groups they're members of
- Proper permission checks on all actions

## 🧪 Testing Features

### Test Page Features

The `/test-study-groups-collaboration` page includes:

- Complete group detail view
- Individual component testing
- API endpoint testing
- Feature demonstrations

### API Testing

Use the test page to verify:

- Message sending/receiving
- Resource sharing
- Activity logging
- Group archival

## 🚨 Troubleshooting

### "View Details" Button Not Working

- **Solution**: Use "View Group" button instead
- **Reason**: Updated to proper navigation

### Can't Access Group Chat

- **Check**: Are you a member of the group?
- **Solution**: Join the group first

### Resources Not Loading

- **Check**: Database migration applied?
- **Solution**: Run `npx supabase db push` (if you have access)

### Real-time Chat Not Working

- **Check**: Supabase Realtime enabled?
- **Solution**: Verify Supabase configuration

## 📝 Development Notes

### Database Requirements

- Migration `013_study_groups_collaboration.sql` must be applied
- Supabase Realtime must be enabled
- RLS policies must be active

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for admin functions)
```

### Dependencies

- `@radix-ui/react-scroll-area`
- `@radix-ui/react-avatar`
- `class-variance-authority`
- `date-fns`

## 🎯 Next Steps

1. **Start with the main page**: Go to `/study-groups`
2. **Create a test group**: Use the "Create Group" button
3. **Test collaboration**: Use the test page for comprehensive testing
4. **Explore features**: Try chat, resources, and activities
5. **Invite others**: Share group links with team members

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify you're logged in
3. Ensure database migrations are applied
4. Test with the demo page first
5. Check network connectivity for real-time features

The study groups collaboration system is fully functional and ready for use!
