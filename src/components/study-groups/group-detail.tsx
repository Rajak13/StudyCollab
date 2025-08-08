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
import { useAuth } from '@/hooks/use-auth'
import { useDeleteStudyGroup, useStudyGroup } from '@/hooks/use-study-groups'
import { cn } from '@/lib/utils'
import { GroupRole } from '@/types/database'
import {
  Activity,
  Archive,
  Crown,
  MessageCircle,
  PenTool,
  Share2,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users
} from 'lucide-react'
import { useState } from 'react'
import { StudyBoard } from '../study-board'
import { GroupActivities } from './group-activities'
import { GroupChat } from './group-chat'
import { GroupEditDialog } from './group-edit-dialog'
import { GroupMembers } from './group-members'
import { GroupSharedResources } from './group-shared-resources'
import { JoinRequests } from './join-requests'

interface GroupDetailProps {
  groupId: string
  className?: string
}

export function GroupDetail({ groupId, className }: GroupDetailProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: groupData, isLoading, error } = useStudyGroup(groupId)
  const deleteStudyGroup = useDeleteStudyGroup()
  const { user } = useAuth()
  const group = groupData?.data

  // Get user info for the study board
  const userId = user?.id || ''
  const userName = user?.user_metadata?.name || user?.email || 'Anonymous'

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
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to archive group',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteGroup = async () => {
    try {
      await deleteStudyGroup.mutateAsync(groupId)
      setShowDeleteDialog(false)
      // Navigate back to study groups page
      window.location.href = '/study-groups'
    } catch {
      // Error is handled by the mutation
      setShowDeleteDialog(false)
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
                <>
                  <GroupEditDialog
                    group={group}
                    onUpdate={() => window.location.reload()}
                  />

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

                  <Dialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Group</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Are you sure you want to permanently delete this group?
                          This action cannot be undone and will remove all group data,
                          including messages, shared resources, and member information.
                        </p>
                        <div className="rounded-lg bg-destructive/10 p-3">
                          <p className="text-sm font-medium text-destructive">
                            ⚠️ This is a permanent action
                          </p>
                          <p className="text-sm text-destructive/80">
                            All group content will be permanently lost.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            className="flex-1"
                            disabled={deleteStudyGroup.isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteGroup}
                            className="flex-1"
                            disabled={deleteStudyGroup.isPending}
                          >
                            {deleteStudyGroup.isPending ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Group
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Group Content Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Study Board
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          {(group.user_role === 'OWNER' || group.user_role === 'ADMIN') && (
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Requests
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
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

        <TabsContent value="board" className="mt-6">
          <StudyBoard
            groupId={groupId}
            userId={userId}
            userName={userName}
          />
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
          <GroupMembers groupId={groupId} userRole={group.user_role as GroupRole | null} />
        </TabsContent>

        {(group.user_role === 'OWNER' || group.user_role === 'ADMIN') && (
          <TabsContent value="requests" className="mt-6">
            <JoinRequests groupId={groupId} userRole={group.user_role as GroupRole | null} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
