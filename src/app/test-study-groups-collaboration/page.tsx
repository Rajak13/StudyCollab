'use client'

import { GroupActivities } from '@/components/study-groups/group-activities'
import { GroupChat } from '@/components/study-groups/group-chat'
import { GroupDetail } from '@/components/study-groups/group-detail'
import { GroupSharedResources } from '@/components/study-groups/group-shared-resources'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

export default function TestStudyGroupsCollaborationPage() {
  const [testGroupId] = useState('test-group-id-123') // In a real app, this would come from the URL or props

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          Study Groups Collaboration Features
        </h1>
        <p className="text-muted-foreground">
          Test the new collaboration features: chat, shared resources, activity
          tracking, and archival.
        </p>
      </div>

      {/* Full Group Detail View */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Group Detail View</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupDetail groupId={testGroupId} />
        </CardContent>
      </Card>

      {/* Individual Components Testing */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Group Chat</TabsTrigger>
          <TabsTrigger value="resources">Shared Resources</TabsTrigger>
          <TabsTrigger value="activities">Group Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Chat Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time chat with reply functionality and file sharing
                support.
              </p>
            </CardHeader>
            <CardContent>
              <GroupChat groupId={testGroupId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shared Resources Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload, organize, and download shared files and documents.
              </p>
            </CardHeader>
            <CardContent>
              <GroupSharedResources groupId={testGroupId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Activities Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track member activities, resource sharing, and group events.
              </p>
            </CardHeader>
            <CardContent>
              <GroupActivities groupId={testGroupId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Testing</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the new API endpoints for collaboration features.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/study-groups/${testGroupId}/messages`
                  )
                  const data = await response.json()
                  console.log('Messages:', data)
                } catch (error) {
                  console.error('Error fetching messages:', error)
                }
              }}
            >
              Test Messages API
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/study-groups/${testGroupId}/resources`
                  )
                  const data = await response.json()
                  console.log('Resources:', data)
                } catch (error) {
                  console.error('Error fetching resources:', error)
                }
              }}
            >
              Test Resources API
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/study-groups/${testGroupId}/activities`
                  )
                  const data = await response.json()
                  console.log('Activities:', data)
                } catch (error) {
                  console.error('Error fetching activities:', error)
                }
              }}
            >
              Test Activities API
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/study-groups/${testGroupId}/archive`,
                    {
                      method: 'POST',
                    }
                  )
                  const data = await response.json()
                  console.log('Archive result:', data)
                } catch (error) {
                  console.error('Error archiving group:', error)
                }
              }}
            >
              Test Archive API
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(
                    '/api/admin/archive-inactive-groups',
                    {
                      method: 'GET',
                    }
                  )
                  const data = await response.json()
                  console.log('Archive health check:', data)
                } catch (error) {
                  console.error('Error checking archive endpoint:', error)
                }
              }}
            >
              Test Archive Health
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Check the browser console for API response data.</p>
            <p>
              Note: Some APIs may return errors if the test group doesn&rsquo;t
              exist in the database.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Implemented Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Completed</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Real-time group chat with Supabase Realtime</li>
                <li>• Message threading and replies</li>
                <li>• File attachment support in messages</li>
                <li>• Shared resource upload and management</li>
                <li>• Resource download tracking</li>
                <li>• Comprehensive activity logging</li>
                <li>• Group archival system</li>
                <li>• Automatic inactive group archival</li>
                <li>• Activity feed with formatted messages</li>
                <li>• Permission-based resource management</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">
                🔄 Database Features
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Row Level Security policies</li>
                <li>• Activity tracking triggers</li>
                <li>• Last activity timestamp updates</li>
                <li>• Automatic owner membership creation</li>
                <li>• Comprehensive indexing for performance</li>
                <li>• Data integrity constraints</li>
                <li>• Soft delete with recovery options</li>
                <li>• Audit trail for all activities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
