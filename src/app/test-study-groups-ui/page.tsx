'use client'

import { NotificationCenter } from '@/components/notifications/notification-center'
import { GroupMembers } from '@/components/study-groups/group-members'
import { JoinRequests } from '@/components/study-groups/join-requests'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotificationStore } from '@/lib/stores/notification-store'

export default function TestStudyGroupsUIPage() {
  const { addNotification } = useNotificationStore()

  const testGroupId = 'test-group-id'

  const handleAddTestNotification = () => {
    addNotification({
      type: 'GROUP_JOIN_REQUEST',
      title: 'New Join Request',
      message: 'John Doe wants to join your study group',
      data: {
        groupId: testGroupId,
        groupName: 'Test Study Group',
        userId: 'test-user-id',
        userName: 'John Doe',
      },
      read: false,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Study Groups UI Test</h1>
        <div className="flex items-center gap-4">
          <Button onClick={handleAddTestNotification}>
            Add Test Notification
          </Button>
          <NotificationCenter />
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Group Members</TabsTrigger>
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <GroupMembers 
            groupId={testGroupId} 
            userRole="OWNER" 
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <JoinRequests 
            groupId={testGroupId} 
            userRole="OWNER" 
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Member management UI component with role assignment and member removal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Join request management interface for group owners/admins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Notification system for group activities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Real-time notifications using Supabase Realtime</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}