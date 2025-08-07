'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    useJoinRequests,
    useUpdateJoinRequest,
} from '@/hooks/use-study-groups'
import { GroupJoinRequest, GroupRole } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { Check, Clock, UserPlus, X } from 'lucide-react'

interface JoinRequestsProps {
  groupId: string
  userRole?: GroupRole | null
  className?: string
}

export function JoinRequests({
  groupId,
  userRole,
  className,
}: JoinRequestsProps) {
  const { data: requestsData, isLoading, error } = useJoinRequests(groupId, userRole)
  const updateJoinRequest = useUpdateJoinRequest()

  // Debug logging
  console.log('JoinRequests component:', {
    groupId,
    userRole,
    isLoading,
    error: error?.message,
    requestsData
  })

  const requests = requestsData?.data || []
  const pendingRequests = requests.filter((req) => req.status === 'PENDING')

  const canManageRequests = userRole === 'OWNER' || userRole === 'ADMIN'

  const handleApproveRequest = async (request: GroupJoinRequest) => {
    try {
      await updateJoinRequest.mutateAsync({
        groupId,
        requestId: request.id,
        data: { status: 'APPROVED' },
      })
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleRejectRequest = async (request: GroupJoinRequest) => {
    try {
      await updateJoinRequest.mutateAsync({
        groupId,
        requestId: request.id,
        data: { status: 'REJECTED' },
      })
    } catch {
      // Error is handled by the mutation
    }
  }

  const getUserName = (request: GroupJoinRequest) => {
    // Try profile data first
    if (request.profile?.name) {
      return request.profile.name
    }
    if (request.profile?.full_name) {
      return request.profile.full_name
    }
    
    // Try user metadata
    if (request.user?.user_metadata?.name) {
      return request.user.user_metadata.name
    }
    if (request.user?.user_metadata?.full_name) {
      return request.user.user_metadata.full_name
    }
    
    // Try user direct properties
    if (request.user?.name) {
      return request.user.name
    }
    
    // Fall back to email
    if (request.user?.email) {
      return request.user.email.split('@')[0]
    }
    if (request.profile?.email) {
      return request.profile.email.split('@')[0]
    }
    
    return 'Unknown User'
  }

  const getUserAvatar = (request: GroupJoinRequest) => {
    return request.profile?.avatar_url || 
           request.user?.user_metadata?.avatar_url || 
           request.user?.avatar_url
  }

  const getUserInitials = (request: GroupJoinRequest) => {
    const name = getUserName(request)
    return name.charAt(0).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <Check className="h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
            <div className="text-muted-foreground">Loading requests...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">⚠️</div>
            <h3 className="mb-2 text-lg font-semibold">Unable to Load Requests</h3>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Failed to load join requests'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!canManageRequests) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">🔒</div>
            <p className="text-muted-foreground">
              Only group owners and admins can manage join requests
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Join Requests
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingRequests.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">📝</div>
            <p className="text-muted-foreground">No join requests yet</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {/* Pending Requests First */}
              {pendingRequests.length > 0 && (
                <>
                  <div className="text-sm font-medium text-muted-foreground">
                    Pending Requests ({pendingRequests.length})
                  </div>
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getUserAvatar(request)} />
                            <AvatarFallback>
                              {getUserInitials(request)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {getUserName(request)}
                              </p>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Requested{' '}
                              {formatDistanceToNow(
                                new Date(request.created_at),
                                { addSuffix: true }
                              )}
                            </p>
                            {request.message && (
                              <div className="mt-2 rounded bg-background p-2 text-sm">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Message:
                                </p>
                                <p>{request.message}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request)}
                            disabled={updateJoinRequest.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectRequest(request)}
                            disabled={updateJoinRequest.isPending}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Processed Requests */}
              {requests.filter((req) => req.status !== 'PENDING').length > 0 && (
                <>
                  {pendingRequests.length > 0 && (
                    <>
                      <Separator />
                      <div className="text-sm font-medium text-muted-foreground">
                        Processed Requests
                      </div>
                    </>
                  )}
                  {requests
                    .filter((req) => req.status !== 'PENDING')
                    .map((request) => (
                      <div
                        key={request.id}
                        className="flex items-start justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getUserAvatar(request)} />
                            <AvatarFallback>
                              {getUserInitials(request)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {getUserName(request)}
                              </p>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.status === 'APPROVED'
                                ? 'Approved'
                                : 'Rejected'}{' '}
                              {formatDistanceToNow(
                                new Date(request.updated_at),
                                { addSuffix: true }
                              )}
                            </p>
                            {request.message && (
                              <div className="mt-2 rounded bg-muted p-2 text-sm">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Message:
                                </p>
                                <p>{request.message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}