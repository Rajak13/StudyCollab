'use client'

import { useQuery } from '@tanstack/react-query'

export interface GroupActivity {
  id: string
  group_id: string
  user_id: string
  activity_type:
    | 'MEMBER_JOINED'
    | 'MEMBER_LEFT'
    | 'MEMBER_PROMOTED'
    | 'MEMBER_DEMOTED'
    | 'MESSAGE_SENT'
    | 'RESOURCE_SHARED'
    | 'RESOURCE_DOWNLOADED'
    | 'GROUP_CREATED'
    | 'GROUP_UPDATED'
    | 'GROUP_ARCHIVED'
  activity_data?: Record<string, unknown>
  created_at: string
  user: {
    id: string
    email: string
    user_metadata: {
      name?: string
      avatar_url?: string
    }
  }
}

export interface ActivityFilters {
  page?: number
  limit?: number
  activity_type?: string
  user_id?: string
  since?: string // ISO datetime string
}

export interface ActivitiesResponse {
  data: GroupActivity[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useGroupActivities(
  groupId: string,
  filters: ActivityFilters = {}
) {
  const queryKey = ['group-activities', groupId, filters]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ActivitiesResponse> => {
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.activity_type)
        params.append('activity_type', filters.activity_type)
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.since) params.append('since', filters.since)

      const response = await fetch(
        `/api/study-groups/${groupId}/activities?${params}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch group activities')
      }

      return response.json()
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useRecentGroupActivities(groupId: string, limit: number = 10) {
  return useGroupActivities(groupId, {
    limit,
    page: 1,
  })
}

// Helper function to format activity messages
export function formatActivityMessage(activity: GroupActivity): string {
  const userName =
    activity.user?.user_metadata?.name || activity.user?.email || 'Unknown User'

  switch (activity.activity_type) {
    case 'MEMBER_JOINED':
      return `${userName} joined the group`

    case 'MEMBER_LEFT':
      return `${userName} left the group`

    case 'MEMBER_PROMOTED': {
      const newRole = activity.activity_data?.new_role as string
      return `${userName} was promoted to ${newRole.toLowerCase()}`
    }

    case 'MEMBER_DEMOTED': {
      const oldRole = activity.activity_data?.old_role as string
      return `${userName} was demoted from ${oldRole.toLowerCase()}`
    }

    case 'MESSAGE_SENT':
      const hasFile = activity.activity_data?.has_file
      return hasFile
        ? `${userName} shared a file`
        : `${userName} sent a message`

    case 'RESOURCE_SHARED':
      const title = activity.activity_data?.title
      return `${userName} shared "${title}"`

    case 'RESOURCE_DOWNLOADED':
      const resourceTitle = activity.activity_data?.title
      return `${userName} downloaded "${resourceTitle}"`

    case 'GROUP_CREATED':
      return `${userName} created the group`

    case 'GROUP_UPDATED':
      const action = activity.activity_data?.action
      if (action === 'unarchived') {
        return `${userName} unarchived the group`
      }
      return `${userName} updated the group`

    case 'GROUP_ARCHIVED':
      const reason = activity.activity_data?.reason
      if (reason === 'inactivity') {
        return 'Group was archived due to inactivity'
      }
      return `${userName} archived the group`

    default:
      return `${userName} performed an action`
  }
}

// Helper function to get activity icon
export function getActivityIcon(
  activityType: GroupActivity['activity_type']
): string {
  switch (activityType) {
    case 'MEMBER_JOINED':
      return '👋'
    case 'MEMBER_LEFT':
      return '👋'
    case 'MEMBER_PROMOTED':
      return '⬆️'
    case 'MEMBER_DEMOTED':
      return '⬇️'
    case 'MESSAGE_SENT':
      return '💬'
    case 'RESOURCE_SHARED':
      return '📎'
    case 'RESOURCE_DOWNLOADED':
      return '⬇️'
    case 'GROUP_CREATED':
      return '🎉'
    case 'GROUP_UPDATED':
      return '✏️'
    case 'GROUP_ARCHIVED':
      return '📦'
    default:
      return '📝'
  }
}
