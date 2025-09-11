'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { GroupRole } from '@/types/database'
import { Check, Clock, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface JoinRequest {
  id: string
  user_id: string
  group_id: string
  status: 'pending' | 'approved' | 'rejected'
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

interface JoinRequestsProps {
  groupId: string
  userRole: GroupRole | null
  className?: string
}

export function JoinRequests({ groupId, userRole, className = '' }: JoinRequestsProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set())

  const canManageRequests = userRole === 'OWNER' || userRole === 'ADMIN'

  useEffect(() => {
    if (canManageRequests) {
      fetchJoinRequests()
    } else {
      setLoading(false)
    }
  }, [groupId, canManageRequests])

  const fetchJoinRequests = async () => {
    try {
      const response = await fetch(`/api/study-groups/${groupId}/requests`)
      if (!response.ok) {
        throw new Error('Failed to fetch join requests')
      }
      const data = await response.json()
      setRequests(data.data || [])
    } catch (error) {
      console.error('Error fetching join requests:', error)
      toast({
        title: 'Error',
        description: 'Failed to load join requests',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (processingRequests.has(requestId)) return

    setProcessingRequests(prev => new Set(prev).add(requestId))

    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
      const response = await fetch(`/api/study-groups/${groupId}/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${action} request`)
      }

      toast({
        title: 'Success',
        description: `Request ${action}d successfully`,
      })

      // Refresh the requests list
      await fetchJoinRequests()
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} request`,
        variant: 'destructive',
      })
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  if (!canManageRequests) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>You don't have permission to view join requests.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading join requests...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingRequests = requests.filter(req => req.status === 'pending')
  const processedRequests = requests.filter(req => req.status !== 'pending')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No pending join requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {request.user.user_metadata?.avatar_url ? (
                        <img
                          src={request.user.user_metadata.avatar_url}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.user.user_metadata?.name || request.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, 'approve')}
                      disabled={processingRequests.has(request.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {processingRequests.has(request.id) ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="ml-1">Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, 'reject')}
                      disabled={processingRequests.has(request.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {processingRequests.has(request.id) ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span className="ml-1">Reject</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.slice(0, 10).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {request.user.user_metadata?.avatar_url ? (
                        <img
                          src={request.user.user_metadata.avatar_url}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {request.user.user_metadata?.name || request.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={request.status === 'approved' ? 'default' : 'destructive'}
                  >
                    {request.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}