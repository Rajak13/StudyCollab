'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useCreateStudyGroup, useStudyGroups } from '@/hooks/use-study-groups'
import { useState } from 'react'

function DebugStudyGroupsContent() {
    const { user } = useAuth()
    const { data: studyGroupsData, isLoading, error } = useStudyGroups()
    const createStudyGroup = useCreateStudyGroup()
    const [testGroupId, setTestGroupId] = useState<string | null>(null)

    const handleCreateTestGroup = async () => {
        try {
            const result = await createStudyGroup.mutateAsync({
                name: 'Test Study Group',
                description: 'A test group for debugging',
                subject: 'Computer Science',
                is_private: false,
            })

            if (result.data) {
                setTestGroupId(result.data.id)
            }
        } catch (error) {
            console.error('Failed to create test group:', error)
        }
    }

    const handleTestMembersAPI = async () => {
        if (!testGroupId) return

        try {
            const response = await fetch(`/api/study-groups/${testGroupId}/members`)
            const data = await response.json()
            console.log('Members API response:', data)
        } catch (error) {
            console.error('Members API error:', error)
        }
    }

    const handleTestJoinAPI = async () => {
        if (!testGroupId) return

        try {
            const response = await fetch(`/api/study-groups/${testGroupId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Test join request' }),
            })
            const data = await response.json()
            console.log('Join API response:', data)
        } catch (error) {
            console.error('Join API error:', error)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <h1 className="text-3xl font-bold">Study Groups Debug</h1>

            <Card>
                <CardHeader>
                    <CardTitle>User Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-sm bg-muted p-4 rounded">
                        {JSON.stringify({
                            id: user?.id,
                            email: user?.email,
                            name: user?.user_metadata?.name
                        }, null, 2)}
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Study Groups Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
                        </div>
                        <div>
                            <strong>Error:</strong> {error ? error.message : 'None'}
                        </div>
                        <div>
                            <strong>Groups Count:</strong> {studyGroupsData?.data?.length || 0}
                        </div>
                        <pre className="text-sm bg-muted p-4 rounded max-h-64 overflow-auto">
                            {JSON.stringify(studyGroupsData, null, 2)}
                        </pre>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Test Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button
                            onClick={handleCreateTestGroup}
                            disabled={createStudyGroup.isPending}
                        >
                            Create Test Group
                        </Button>

                        {testGroupId && (
                            <div className="space-y-2">
                                <p>Test Group ID: {testGroupId}</p>
                                <div className="space-x-2">
                                    <Button onClick={handleTestMembersAPI}>
                                        Test Members API
                                    </Button>
                                    <Button onClick={handleTestJoinAPI}>
                                        Test Join API
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function DebugStudyGroupsPage() {
    return (
        <ProtectedRoute>
            <DebugStudyGroupsContent />
        </ProtectedRoute>
    )
}