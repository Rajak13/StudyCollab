'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    formatActivityMessage,
    getActivityIcon,
    useGroupActivities,
} from '@/hooks/use-group-activities'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Activity } from 'lucide-react'

interface GroupActivitiesProps {
  groupId: string
  className?: string
  limit?: number
  showHeader?: boolean
}

export function GroupActivities({
  groupId,
  className,
  limit = 20,
  showHeader = true,
}: GroupActivitiesProps) {
  const { data: activitiesData, isLoading } = useGroupActivities(groupId, {
    limit,
    page: 1,
  })

  const activities = activitiesData?.data || []

  const getUserName = (
    user: {
      id: string
      name?: string
      email?: string
      user_metadata?: { name?: string }
    } | null
  ) => {
    if (user?.name) {
      return user.name
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Unknown User'
  }

  const getUserAvatar = (
    user: {
      avatar_url?: string
      user_metadata?: { avatar_url?: string }
    } | null
  ) => {
    return user?.avatar_url || user?.user_metadata?.avatar_url
  }

  const getUserInitials = (
    user: {
      id: string
      name?: string
      email?: string
      user_metadata?: { name?: string }
    } | null
  ) => {
    const name = getUserName(user)
    return name.charAt(0).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className={cn('flex h-48 items-center justify-center', className)}>
        <div className="text-muted-foreground">Loading activities...</div>
      </div>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={showHeader ? '' : 'p-0'}>
        {activities.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">📝</div>
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                    {getActivityIcon(activity.activity_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={getUserAvatar(activity.user)} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(activity.user)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {getUserName(activity.user)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {formatActivityMessage(activity)}
                    </p>

                    {/* Additional activity data */}
                    {activity.activity_data && (
                      <div className="mt-1">
                        {activity.activity_type === 'RESOURCE_SHARED' &&
                          typeof activity.activity_data === 'object' &&
                          activity.activity_data !== null &&
                          'title' in activity.activity_data && (
                            <div className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                              📎 {String(activity.activity_data.title)}
                            </div>
                          )}

                        {activity.activity_type === 'MEMBER_PROMOTED' &&
                          typeof activity.activity_data === 'object' &&
                          activity.activity_data !== null &&
                          'old_role' in activity.activity_data &&
                          'new_role' in activity.activity_data && (
                            <div className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                              {String(activity.activity_data.old_role)} →{' '}
                              {String(activity.activity_data.new_role)}
                            </div>
                          )}

                        {activity.activity_type === 'GROUP_ARCHIVED' &&
                          typeof activity.activity_data === 'object' &&
                          activity.activity_data !== null &&
                          'reason' in activity.activity_data && (
                            <div className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                              Reason: {String(activity.activity_data.reason)}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for dashboard widgets
export function GroupActivitiesWidget({
  groupId,
  className,
}: {
  groupId: string
  className?: string
}) {
  return (
    <GroupActivities
      groupId={groupId}
      className={className}
      limit={5}
      showHeader={false}
    />
  )
}
