'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useStudyGroups } from '@/hooks/use-study-groups'
import { useState } from 'react'

export default function DebugJoinRequestsPage() {
  const { user } = useAuth()
  const { data: studyGroupsData } = useStudyGroups({
    page: 1,
    limit: 100,
  })
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)

  const studyGroups = studyGroupsData?.data || []
  const managedGroups = studyGroups.filter(
    (group) => group.user_role === 'OWNER' || group.user_role === 'ADMIN'
  )

  const debugGroupMembership = async (groupId: string) => {
    try {
      const response = await fetch(`/api/debug/group-membership/${groupId}`)
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Debug error:', error)
      setDebugInfo({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  const testJoinRequestsAPI = async (groupId: string) => {
    try {
      const response = await fetch(`/api/study-groups/${groupId}/requests`)
      const data = await response.json()
      console.log('Join requests API response:', { status: response.status, data })
      setDebugInfo({
        apiTest: true,
        status: response.status,
        data,
        ok: response.ok
      })
    } catch (error) {
      console.error('API test error:', error)
      setDebugInfo({ apiTest: true, error: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Join Requests Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current User:</h3>
            <pre className="bg-muted p-2 rounded text-sm">
              {JSON.stringify({ id: user?.id, email: user?.email }, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">All Study Groups ({studyGroups.length}):</h3>
            <pre className="bg-muted p-2 rounded text-sm max-h-40 overflow-y-auto">
              {JSON.stringify(
                studyGroups.map(g => ({
                  id: g.id,
                  name: g.name,
                  user_role: g.user_role,
                  is_member: g.is_member,
                  owner_id: g.owner_id
                })),
                null,
                2
              )}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Managed Groups ({managedGroups.length}):</h3>
            <pre className="bg-muted p-2 rounded text-sm">
              {JSON.stringify(
                managedGroups.map(g => ({
                  id: g.id,
                  name: g.name,
                  user_role: g.user_role
                })),
                null,
                2
              )}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Debug Actions:</h3>
            <div className="space-y-2">
              {managedGroups.map(group => (
                <div key={group.id} className="flex gap-2 items-center">
                  <span className="text-sm">{group.name}</span>
                  <Button
                    size="sm"
                    onClick={() => debugGroupMembership(group.id)}
                  >
                    Debug Membership
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testJoinRequestsAPI(group.id)}
                  >
                    Test API
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {debugInfo && (
            <div>
              <h3 className="font-semibold mb-2">Debug Results:</h3>
              <pre className="bg-muted p-2 rounded text-sm max-h-60 overflow-y-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}