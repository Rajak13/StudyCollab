# Search and Discovery System

This directory contains the implementation of the unified search and discovery system for StudyCollab, which allows users to search across tasks, notes, and resources with advanced filtering and bookmark management.

## Components

### UnifiedSearch

The main search interface that provides:

- Unified search across tasks, notes, and resources
- Advanced filtering by type, tags, dates, and other criteria
- Search suggestions and autocomplete
- Relevance-based ranking
- Pagination support

**Usage:**

```tsx
import { UnifiedSearch } from '@/components/search/unified-search'

;<UnifiedSearch
  onResultClick={(result) => handleResultClick(result)}
  placeholder="Search everything..."
  defaultFilters={{ types: ['task', 'note'] }}
/>
```

### QuickSearch

A command palette-style search component that can be triggered with Cmd/Ctrl+K:

- Quick access to search functionality
- Recent searches history
- Search suggestions
- Quick actions (create task, note, etc.)

**Usage:**

```tsx
import { QuickSearch } from '@/components/search/quick-search'

;<QuickSearch className="w-full max-w-md" />
```

### BookmarkManager

A comprehensive bookmark management interface:

- View and organize bookmarks
- Folder-based organization
- Search within bookmarks
- Filter by content type

**Usage:**

```tsx
import { BookmarkManager } from '@/components/search/bookmark-manager'

;<BookmarkManager onBookmarkClick={(bookmark) => navigateToContent(bookmark)} />
```

## Hooks

### useSearch

Main hook for performing searches:

```tsx
const { data, isLoading, error } = useSearch({
  query: 'calculus',
  types: ['note', 'resource'],
  sort_by: 'relevance',
})
```

### useBookmarks

Hook for managing bookmarks:

```tsx
const { data: bookmarks } = useBookmarks({ folder: 'Math' })
const createBookmark = useCreateBookmark()
const deleteBookmark = useDeleteBookmark()
```

### useQuickSearch

Hook for quick search functionality:

```tsx
const { recentSearches, performSearch } = useQuickSearch()
```

## API Endpoints

### Search API

- `GET /api/search` - Unified search with filtering
  - Query parameters: `query`, `types`, `tags`, `sort_by`, etc.
  - Returns: Search results with pagination and suggestions

### Bookmark API

- `GET /api/bookmarks` - List user bookmarks
- `POST /api/bookmarks` - Create new bookmark
- `PUT /api/bookmarks/[id]` - Update bookmark
- `DELETE /api/bookmarks/[id]` - Delete bookmark
- `GET /api/bookmarks/folders` - List bookmark folders

## Database Schema

### Bookmarks Table

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content_type VARCHAR(20) CHECK (content_type IN ('task', 'note', 'resource')),
  content_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[],
  folder_name VARCHAR(100),
  content_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Features Implemented

### ✅ Unified Search

- [x] Search across tasks, notes, and resources
- [x] Relevance-based ranking
- [x] Advanced filtering (type, date, tags, categories)
- [x] Pagination support
- [x] Search suggestions and autocomplete

### ✅ Bookmark System

- [x] Save content as bookmarks
- [x] Organize bookmarks into folders
- [x] Search within bookmarks
- [x] Filter bookmarks by type

### ✅ User Experience

- [x] Quick search with Cmd/Ctrl+K
- [x] Recent searches history
- [x] Responsive design
- [x] Loading states and error handling

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **5.1**: Unified search across tasks, notes, and resources with relevance ranking ✅
- **5.2**: Advanced filtering with multiple criteria (type, date, tags, categories) ✅
- **5.3**: Search suggestions and autocomplete functionality ✅
- **5.4**: Personal bookmark system for saving and organizing favorite content ✅
- **5.5**: Search result ranking and relevance scoring ✅
- **5.6**: Quick access to search functionality ✅

## Testing

To test the search system:

1. Visit `/test-search` to see all components in action
2. Visit `/search` for the main search interface
3. Use Cmd/Ctrl+K anywhere in the app for quick search

## Database Setup

Before using the search system, run the bookmark table migration:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/004_bookmarks_table.sql
```

The migration creates the bookmarks table with proper RLS policies and indexes for optimal performance.
