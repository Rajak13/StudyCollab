'use client'

import { StudyBoard } from '@/components/study-board/study-board'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'

export default function TestStudyBoardPage() {
  const { user, loading } = useAuth()
  const [testGroupId] = useState('test-group-123')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to test the study board.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Study Board Test
            </h1>
            <p className="text-gray-600 mt-1">
              Testing real-time collaborative canvas with Yjs
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <div>User: {user.email}</div>
            <div>Group: {testGroupId}</div>
          </div>
        </div>
      </div>

      {/* Study Board */}
      <div className="h-[calc(100vh-80px)]">
        <StudyBoard
          groupId={testGroupId}
          userId={user.id}
          userName={user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User'}
        />
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 left-4 max-w-sm">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-1">
            <p>• Open this page in multiple tabs/browsers to test collaboration</p>
            <p>• Use the toolbar to switch between tools</p>
            <p>• Draw, add text, or create shapes</p>
            <p>• Watch for real-time cursor tracking</p>
            <p>• Check the presence list to see connected users</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}