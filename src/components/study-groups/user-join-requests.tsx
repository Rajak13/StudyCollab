'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStudyGroups } from '@/hooks/use-study-groups'
import { GroupRole } from '@/types/database'
import { UserPlus } from 'lucide-react'
import { JoinRequests } from './join-requests'

export function UserJoinRequests() {
  const { data: studyGroupsData } = useStudyGroups({
    page: 1,
    limit: 100, // Get all groups to find ones user manages
  })

  const studyGroups = studyGroupsData?.data || []
  
  // Debug logging
  console.log('UserJoinRequests - All study groups:', studyGroups)
  console.log('UserJoinRequests - Groups with roles:', studyGroups.map(g => ({ 
    id: g.id, 
    name: g.name, 
    user_role: g.user_role,
    is_member: g.is_member 
  })))
  
  // Filter groups where user is owner or admin
  const managedGroups = studyGroups.filter(
    (group) => group.user_role === 'OWNER' || group.user_role === 'ADMIN'
  )
  
  console.log('UserJoinRequests - Managed groups:', managedGroups.map(g => ({ 
    id: g.id, 
    name: g.name, 
    user_role: g.user_role 
  })))

  if (managedGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <UserPlus className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Groups to Manage</h3>
            <p className="text-muted-foreground">
              You need to be an owner or admin of a group to manage join requests.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {managedGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {group.name} - Join Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JoinRequests 
              groupId={group.id} 
              userRole={group.user_role as GroupRole | null}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}