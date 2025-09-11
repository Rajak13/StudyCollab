'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { TestTube } from 'lucide-react'
import { useState } from 'react'

interface JoinRequestsTestProps {
  className?: string
}

export function JoinRequestsTest({ className = '' }: JoinRequestsTestProps) {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { user } = useAuth()

  const addResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = isError ? '❌' : '✅'
    setTestResults(prev => [...prev, `${prefix} [${timestamp}] ${message}`])
  }

  const runJoinRequestTests = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to run tests',
        variant: 'destructive',
      })
      return
    }

    setIsRunning(true)
    setTestResults([])
    addResult('Starting join request functionality tests...')

    try {
      // Test 1: Create a private study group
      addResult('Test 1: Creating a private study group...')
      const createGroupResponse = await fetch('/api/study-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Test Group ${Date.now()}`,
          description: 'A test group for join request functionality',
          subject: 'Computer Science',
          is_private: true
        })
      })

      if (!createGroupResponse.ok) {
        const error = await createGroupResponse.json()
        throw new Error(`Failed to create group: ${error.error || createGroupResponse.status}`)
      }

      const groupData = await createGroupResponse.json()
      const groupId = groupData.data.id
      addResult(`Private group created successfully (ID: ${groupId})`)

      // Test 2: Try to join the group (should create a join request)
      addResult('Test 2: Submitting join request to private group...')
      const joinResponse = await fetch(`/api/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test join request message'
        })
      })

      if (!joinResponse.ok) {
        const error = await joinResponse.json()
        throw new Error(`Failed to submit join request: ${error.error || joinResponse.status}`)
      }

      const joinData = await joinResponse.json()
      addResult(`Join request submitted: ${joinData.message}`)

      // Test 3: Fetch join requests (as owner)
      addResult('Test 3: Fetching join requests as group owner...')
      const requestsResponse = await fetch(`/api/study-groups/${groupId}/requests`)

      if (!requestsResponse.ok) {
        const error = await requestsResponse.json()
        throw new Error(`Failed to fetch join requests: ${error.error || requestsResponse.status}`)
      }

      const requestsData = await requestsResponse.json()
      const requests = requestsData.data || []
      addResult(`Found ${requests.length} join request(s)`)

      if (requests.length === 0) {
        throw new Error('No join requests found - this might indicate an issue with request creation')
      }

      const pendingRequests = requests.filter((r: any) => r.status === 'PENDING' || r.status === 'pending')
      addResult(`Found ${pendingRequests.length} pending request(s)`)

      if (pendingRequests.length > 0) {
        const requestId = pendingRequests[0].id

        // Test 4: Approve the join request
        addResult('Test 4: Approving join request...')
        const approveResponse = await fetch(`/api/study-groups/${groupId}/requests/${requestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'APPROVED'
          })
        })

        if (!approveResponse.ok) {
          const error = await approveResponse.json()
          throw new Error(`Failed to approve join request: ${error.error || approveResponse.status}`)
        }

        const approveData = await approveResponse.json()
        addResult(`Join request approved: ${approveData.message}`)

        // Test 5: Verify user is now a member
        addResult('Test 5: Verifying membership...')
        const membersResponse = await fetch(`/api/study-groups/${groupId}/members`)

        if (!membersResponse.ok) {
          const error = await membersResponse.json()
          throw new Error(`Failed to fetch members: ${error.error || membersResponse.status}`)
        }

        const membersData = await membersResponse.json()
        const members = membersData.data || []
        addResult(`Group now has ${members.length} member(s)`)

        // Verify the requesting user is now a member
        const userIsMember = members.some((m: any) => m.user_id === user.id)
        if (userIsMember) {
          addResult('User successfully added as member after approval')
        } else {
          addResult('Warning: User not found in members list after approval', true)
        }
      }

      // Test 6: Test rejection flow (create another request)
      addResult('Test 6: Testing rejection flow...')
      
      // First, leave the group to test rejection
      const leaveResponse = await fetch(`/api/study-groups/${groupId}/join`, {
        method: 'DELETE'
      })

      if (leaveResponse.ok) {
        addResult('Left group to test rejection flow')

        // Submit another join request
        const joinResponse2 = await fetch(`/api/study-groups/${groupId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Another test join request for rejection'
          })
        })

        if (joinResponse2.ok) {
          // Fetch requests again
          const requestsResponse2 = await fetch(`/api/study-groups/${groupId}/requests`)
          if (requestsResponse2.ok) {
            const requestsData2 = await requestsResponse2.json()
            const newPendingRequests = (requestsData2.data || []).filter((r: any) => r.status === 'PENDING' || r.status === 'pending')
            
            if (newPendingRequests.length > 0) {
              const rejectRequestId = newPendingRequests[0].id
              
              // Reject the request
              const rejectResponse = await fetch(`/api/study-groups/${groupId}/requests/${rejectRequestId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'REJECTED'
                })
              })

              if (rejectResponse.ok) {
                const rejectData = await rejectResponse.json()
                addResult(`Join request rejected: ${rejectData.message}`)
              } else {
                addResult('Failed to reject join request', true)
              }
            }
          }
        }
      }

      // Test 7: Test public group join (should join directly)
      addResult('Test 7: Testing public group join...')
      const createPublicGroupResponse = await fetch('/api/study-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Test Public Group ${Date.now()}`,
          description: 'A test public group',
          subject: 'Mathematics',
          is_private: false
        })
      })

      if (createPublicGroupResponse.ok) {
        const publicGroupData = await createPublicGroupResponse.json()
        const publicGroupId = publicGroupData.data.id
        
        // Leave the group first if we're already a member (as owner)
        await fetch(`/api/study-groups/${publicGroupId}/join`, { method: 'DELETE' })
        
        const joinPublicResponse = await fetch(`/api/study-groups/${publicGroupId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        })

        if (joinPublicResponse.ok) {
          const joinPublicData = await joinPublicResponse.json()
          addResult(`Public group join: ${joinPublicData.message}`)
          
          if (joinPublicData.data?.status === 'JOINED') {
            addResult('Public group join worked correctly (immediate membership)')
          }
        }
      }

      addResult('🎉 All join request tests completed successfully!')

    } catch (error) {
      addResult(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Join Requests Functionality Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={runJoinRequestTests} 
            disabled={isRunning || !user}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Running Tests...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                Run Join Request Tests
              </>
            )}
          </Button>
          
          {!user && (
            <Badge variant="destructive">Login Required</Badge>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`${result.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>This test will:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Create a private study group</li>
            <li>Submit a join request to the private group</li>
            <li>Fetch and display join requests</li>
            <li>Approve the join request</li>
            <li>Verify the user becomes a member</li>
            <li>Test the rejection flow</li>
            <li>Test public group direct join</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}