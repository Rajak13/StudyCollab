'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'

function DebugStudyGroupsFixContent() {
    const { user } = useAuth()
    const [debugData, setDebugData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const testGroupIds = [
        '1f4eeb36-9691-425f-857c-5930ef43e2d6',
        'fa645bcd-7d4c-49b3-b31b-88c69bd7149b'
    ]

    const handleTestDebugEndpoint = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/debug/study-groups')
            const data = await response.json()
            setDebugData(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const handleTestSpecificGroup = async (groupId: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/debug/study-groups?groupId=${groupId}`)
            const data = await response.json()
            setDebugData(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const handleTestRequestsAPI = async (groupId: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/study-groups/${groupId}/requests`)
            const data = await response.json()
            setDebugData({
                groupId,
                status: response.status,
                data
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <h1 className="text-3xl font-bold">Study Groups Debug Fix</h1>

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
                    <CardTitle>Debug Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button
                            onClick={handleTestDebugEndpoint}
                            disabled={loading}
                        >
                            Test Debug Endpoint
                        </Button>

                        <div className="space-y-2">
                            <h3 className="font-semibold">Test Specific Groups:</h3>
                            {testGroupIds.map((groupId) => (
                                <div key={groupId} className="space-x-2">
                                    <Button
                                        onClick={() => handleTestSpecificGroup(groupId)}
                                        disabled={loading}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Check Group: {groupId.slice(0, 8)}...
                                    </Button>
                                    <Button
                                        onClick={() => handleTestRequestsAPI(groupId)}
                                        disabled={loading}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Test Requests API
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm bg-red-100 p-4 rounded text-red-800">
                            {error}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {debugData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Debug Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm bg-muted p-4 rounded max-h-96 overflow-auto">
                            {JSON.stringify(debugData, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function DebugStudyGroupsFixPage() {
    return (
        <ProtectedRoute>
            <DebugStudyGroupsFixContent />
        </ProtectedRoute>
    )
}