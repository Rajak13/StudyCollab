'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useJoinGroup, useLeaveGroup } from '@/hooks/use-study-groups'
import { PaginatedResponse, StudyGroup } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import {
  BookOpen,
  Calendar,
  Globe,
  GraduationCap,
  Lock,
  Users,
} from 'lucide-react'
import Link from 'next/link'

interface StudyGroupsListProps {
  data?: PaginatedResponse<
    StudyGroup & {
      member_count: number
      is_member: boolean
      user_role: string | null
    }
  >
  isLoading: boolean
  error: Error | null
  onPageChange: (page: number) => void
  showJoinActions?: boolean
  filterMyGroups?: boolean
}

export function StudyGroupsList({
  data,
  isLoading,
  error,
  onPageChange,
  showJoinActions = true,
  filterMyGroups = false,
}: StudyGroupsListProps) {
  const joinGroupMutation = useJoinGroup()
  const leaveGroupMutation = useLeaveGroup()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading study groups"
        description={error.message}
        action={{
          label: 'Try Again',
          onClick: () => window.location.reload(),
        }}
      />
    )
  }

  const groups = data?.data || []
  const filteredGroups = filterMyGroups
    ? groups.filter((group) => group.is_member)
    : groups

  if (filteredGroups.length === 0) {
    return (
      <EmptyState
        title={
          filterMyGroups ? 'No groups joined yet' : 'No study groups found'
        }
        description={
          filterMyGroups
            ? 'Join some study groups to see them here.'
            : 'Try adjusting your search or filters to find study groups.'
        }
        icon={<Users className="h-12 w-12" />}
      />
    )
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroupMutation.mutateAsync({
        id: groupId,
        data: { group_id: groupId },
      })
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await leaveGroupMutation.mutateAsync(groupId)
    } catch {
      // Error is handled by the mutation
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {group.is_private ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    )}
                    {group.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {group.description || 'No description provided'}
                  </CardDescription>
                </div>
                {group.user_role && (
                  <Badge
                    variant={
                      group.user_role === 'OWNER' ? 'default' : 'secondary'
                    }
                  >
                    {group.user_role}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Group Info */}
              <div className="space-y-2 text-sm text-muted-foreground">
                {group.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{group.subject}</span>
                  </div>
                )}
                {group.university && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{group.university}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {group.member_count} member
                    {group.member_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Created {formatDistanceToNow(new Date(group.created_at))}{' '}
                    ago
                  </span>
                </div>
              </div>

              {/* Owner Info */}
              {group.owner && (
                <div className="flex items-center gap-2 border-t pt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={group.owner.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {group.owner.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    Created by {group.owner.name}
                  </span>
                </div>
              )}

              {/* Actions */}
              {showJoinActions && (
                <div className="pt-2">
                  {group.is_member ? (
                    <div className="flex gap-2">
                      <Link
                        href={`/study-groups/${group.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          View Group
                        </Button>
                      </Link>
                      {group.user_role !== 'OWNER' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleLeaveGroup(group.id)}
                          disabled={leaveGroupMutation.isPending}
                        >
                          Leave
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={joinGroupMutation.isPending}
                    >
                      {group.is_private ? 'Request to Join' : 'Join Group'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.pagination.page - 1)}
            disabled={data.pagination.page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.pagination.page + 1)}
            disabled={data.pagination.page >= data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
