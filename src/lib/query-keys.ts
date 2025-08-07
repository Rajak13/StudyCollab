/**
 * Query keys factory for consistent caching and invalidation
 * This ensures all queries use the same key structure
 */

export const queryKeys = {
  // Auth queries
  auth: {
    user: () => ['auth', 'user'] as const,
    profile: () => ['auth', 'profile'] as const,
  },

  // Task queries
  tasks: {
    all: () => ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all(), 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    categories: () => ['task-categories'] as const,
    statistics: () => [...queryKeys.tasks.all(), 'statistics'] as const,
  },

  // Note queries
  notes: {
    all: () => ['notes'] as const,
    lists: () => [...queryKeys.notes.all(), 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.notes.lists(), filters] as const,
    details: () => [...queryKeys.notes.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
    folders: () => ['note-folders'] as const,
    search: (query: string) => [...queryKeys.notes.all(), 'search', query] as const,
  },

  // Study group queries
  studyGroups: {
    all: () => ['study-groups'] as const,
    lists: () => [...queryKeys.studyGroups.all(), 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.studyGroups.lists(), filters] as const,
    details: () => [...queryKeys.studyGroups.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.studyGroups.details(), id] as const,
    members: (id: string) => [...queryKeys.studyGroups.detail(id), 'members'] as const,
    messages: (id: string) => [...queryKeys.studyGroups.detail(id), 'messages'] as const,
    resources: (id: string) => [...queryKeys.studyGroups.detail(id), 'resources'] as const,
    activities: (id: string) => [...queryKeys.studyGroups.detail(id), 'activities'] as const,
    joinRequests: (id: string) => [...queryKeys.studyGroups.detail(id), 'join-requests'] as const,
  },

  // Resource queries
  resources: {
    all: () => ['resources'] as const,
    lists: () => [...queryKeys.resources.all(), 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.resources.lists(), filters] as const,
    details: () => [...queryKeys.resources.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.resources.details(), id] as const,
    comments: (id: string) => [...queryKeys.resources.detail(id), 'comments'] as const,
  },

  // File queries
  files: {
    all: () => ['files'] as const,
    lists: () => [...queryKeys.files.all(), 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.files.lists(), filters] as const,
    details: () => [...queryKeys.files.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.files.details(), id] as const,
    folders: () => ['file-folders'] as const,
  },

  // Search queries
  search: {
    all: () => ['search'] as const,
    global: (query: string, filters?: Record<string, unknown>) => 
      [...queryKeys.search.all(), 'global', query, filters] as const,
  },

  // Notification queries
  notifications: {
    all: () => ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all(), 'unread'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.notifications.all(), 'list', filters] as const,
  },
} as const