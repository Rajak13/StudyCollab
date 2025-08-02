'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { useStudyGroup } from '@/hooks/use-study-groups'
import { cn } from '@/lib/utils'
import {
  Activity,
  Archive,
  Crown,
  MessageCircle,
  Share2,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { GroupActivities } from './group-activities'
import { GroupChat } from './group-chat'
import { GroupSharedResources } from './group-shared-resources'

interface GroupDetailProps {
  groupId: string
  className?: string
}

export function GroupDetail({ groupId, className }: GroupDetailProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  const { data: groupData, isLoading, error } = useStudyGroup(groupId)
  const group = groupData?.data

  const handleArchiveGroup = async () => {
    try {
      const response = await fetch(`/api/study-groups/${groupId}/archive`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to archive group')
      }

      toast({
        title: 'Success',
        description: 'Group archived successfully',
      })

      setShowArchiveDialog(false)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to archive group',
        variant: 'destructive',
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'ADMIN':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex h-96 items-center justify-center', className)}>
        <div className="text-muted-foreground">Loading group...</div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className={cn('flex h-96 items-center justify-center', className)}>
        <div className="text-muted-foreground">
          {error?.message || 'Group not found'}
        </div>
      </div>
    )
  }

  const isOwner = group.user_role === 'OWNER'

  return (
    <div className={cn('space-y-6', className)}>
      {/* Group Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{group.name}</CardTitle>
                {group.is_private && <Badge variant="outline">Private</Badge>}
                {group.is_archived && (
                  <Badge variant="destructive">Archived</Badge>
                )}
              </div>

              {group.description && (
                <p className="text-muted-foreground">{group.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {group.subject && <span>📚 {group.subject}</span>}
                {group.university && <span>🏫 {group.university}</span>}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.member_count} members
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {group.user_role && (
                <Badge
                  variant={getRoleBadgeVariant(group.user_role)}
                  className="flex items-center gap-1"
                >
                  {getRoleIcon(group.user_role)}
                  {group.user_role}
                </Badge>
              )}

              {isOwner && !group.is_archived && (
                <Dialog
                  open={showArchiveDialog}
                  onOpenChange={setShowArchiveDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Archive Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Are you sure you want to archive this group? Archived
                        groups are read-only and won&apos;t appear in active
                        group lists.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowArchiveDialog(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleArchiveGroup}
                          className="flex-1"
                        >
                          Archive Group
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Group Content Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupChat groupId={groupId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shared Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupSharedResources groupId={groupId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <GroupActivities groupId={groupId} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <div className="mb-2 text-4xl">👥</div>
                <p className="text-muted-foreground">
                  Member management functionality will be implemented in the
                  next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
