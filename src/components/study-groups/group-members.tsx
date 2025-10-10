'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import {
    useGroupMembers,
    useRemoveMember,
    useUpdateMemberRole,
} from '@/hooks/use-study-groups'
import { GroupMember, GroupRole } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import {
    Crown,
    MoreVertical,
    Shield,
    Trash2,
    User,
    UserMinus,
    Users,
} from 'lucide-react'
import { useState } from 'react'

interface GroupMembersProps {
  groupId: string
  userRole?: GroupRole | null
  className?: string
}

export function GroupMembers({
  groupId,
  userRole,
  className,
}: GroupMembersProps) {
  const { user } = useAuth()
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  const { data: membersData, isLoading } = useGroupMembers(groupId)
  const updateMemberRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const members = membersData?.data || []

  const canManageMembers = userRole === 'OWNER' || userRole === 'ADMIN'
  const isOwner = userRole === 'OWNER'

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      await updateMemberRole.mutateAsync({
        groupId,
        memberId,
        role: newRole,
      })
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      await removeMember.mutateAsync({
        groupId,
        memberId: memberToRemove.id,
      })
      setShowRemoveDialog(false)
      setMemberToRemove(null)
    } catch {
      // Error is handled by the mutation
    }
  }

  const getRoleIcon = (role: GroupRole) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: GroupRole) => {
    switch (role) {
      case 'OWNER':
        return 'default' as const
      case 'ADMIN':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  const getUserName = (member: GroupMember) => {
    // Try profile data first
    if (member.profile?.name) {
      return member.profile.name
    }
    if (member.profile?.full_name) {
      return member.profile.full_name
    }
    
    // Try user metadata
    if (member.user?.user_metadata?.name) {
      return member.user.user_metadata.name
    }
    if (member.user?.user_metadata?.full_name) {
      return member.user.user_metadata.full_name
    }
    
    // Try user direct properties
    if (member.user?.name) {
      return member.user.name
    }
    
    // Fall back to email
    if (member.user?.email) {
      return member.user.email.split('@')[0]
    }
    if (member.profile?.email) {
      return member.profile.email.split('@')[0]
    }
    
    return 'Unknown User'
  }

  const getUserAvatar = (member: GroupMember) => {
    return member.profile?.avatar_url || 
           member.user?.user_metadata?.avatar_url || 
           member.user?.avatar_url
  }

  const getUserInitials = (member: GroupMember) => {
    const name = getUserName(member)
    return name.charAt(0).toUpperCase()
  }

  const canModifyMember = (member: GroupMember) => {
    // Can't modify yourself
    if (member.user_id === user?.id) return false
    
    // Only owners can modify other owners
    if (member.role === 'OWNER') return false
    
    // Owners can modify anyone, admins can only modify regular members
    if (isOwner) return true
    if (userRole === 'ADMIN' && member.role === 'MEMBER') return true
    
    return false
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
            <div className="text-muted-foreground">Loading members...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-4xl">👥</div>
              <p className="text-muted-foreground">No members found</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getUserAvatar(member)} />
                        <AvatarFallback>
                          {getUserInitials(member)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{getUserName(member)}</p>
                          {member.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            Joined{' '}
                            {formatDistanceToNow(new Date(member.joined_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getRoleBadgeVariant(member.role)}
                        className="flex items-center gap-1"
                      >
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>

                      {canManageMembers && canModifyMember(member) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role === 'MEMBER' && isOwner && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(member.id, 'ADMIN')
                                }
                                disabled={updateMemberRole.isPending}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {member.role === 'ADMIN' && isOwner && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(member.id, 'MEMBER')
                                }
                                disabled={updateMemberRole.isPending}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Demote to Member
                              </DropdownMenuItem>
                            )}
                            {(member.role === 'MEMBER' || 
                              (member.role === 'ADMIN' && isOwner)) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setMemberToRemove(member)
                                    setShowRemoveDialog(true)
                                  }}
                                  className="text-destructive focus:text-destructive"
                                  disabled={removeMember.isPending}
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove Member
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Remove Member Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium">
                {memberToRemove ? getUserName(memberToRemove) : ''}
              </span>{' '}
              from this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false)
                setMemberToRemove(null)
              }}
              className="flex-1"
              disabled={removeMember.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              className="flex-1"
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Member
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}