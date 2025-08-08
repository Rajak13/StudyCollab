'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useCreateStudyBoard, useStudyBoard, useStudyBoards } from '@/hooks/use-study-boards'
import { useState } from 'react'

export default function TestStudyBoardsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [newBoardName, setNewBoardName] = useState('Test Study Board')

  // Hooks
  const { data: boardsData, isLoading: boardsLoading, error: boardsError } = useStudyBoards({
    group_id: selectedGroupId || undefined
  })
  
  const { data: boardData, isLoading: boardLoading, error: boardError } = useStudyBoard(selectedBoardId || null)
  
  const createBoardMutation = useCreateStudyBoard()

  const handleCreateBoard = async () => {
    if (!selectedGroupId) {
      alert('Please enter a group ID first')
      return
    }

    try {
      const result = await createBoardMutation.mutateAsync({
        group_id: selectedGroupId,
        name: newBoardName,
        description: 'Test board created from test page'
      })
      
      if (result.data) {
        setSelectedBoardId(result.data.id)
        alert('Board created successfully!')
      }
    } catch (error) {
      console.error('Error creating board:', error)
      alert('Failed to create board')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Study Boards API Test</h1>
      
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Group ID (required for testing)
            </label>
            <Input
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              placeholder="Enter a study group ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Board Name
            </label>
            <Input
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Enter board name"
            />
          </div>
          
          <Button 
            onClick={handleCreateBoard}
            disabled={!selectedGroupId || createBoardMutation.isPending}
          >
            {createBoardMutation.isPending ? <Spinner className="mr-2" /> : null}
            Create Test Board
          </Button>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Board ID (for detailed view)
            </label>
            <Input
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              placeholder="Enter a board ID or create one above"
            />
          </div>
        </CardContent>
      </Card>

      {/* Study Boards List */}
      <Card>
        <CardHeader>
          <CardTitle>Study Boards</CardTitle>
        </CardHeader>
        <CardContent>
          {boardsLoading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner />
              <span className="ml-2">Loading boards...</span>
            </div>
          ) : boardsError ? (
            <div className="text-red-600 p-4">
              Error loading boards: {boardsError.message}
            </div>
          ) : boardsData?.data ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Found {boardsData.data.length} boards
              </p>
              {boardsData.data.map((board) => (
                <div 
                  key={board.id} 
                  className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedBoardId(board.id)}
                >
                  <div className="font-medium">{board.name}</div>
                  <div className="text-sm text-gray-600">
                    ID: {board.id}
                  </div>
                  <div className="text-sm text-gray-600">
                    Group: {board.group_id}
                  </div>
                  <div className="text-sm text-gray-600">
                    Version: {board.version}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No boards found</p>
          )}
        </CardContent>
      </Card>

      {/* Selected Board Details */}
      {selectedBoardId && (
        <Card>
          <CardHeader>
            <CardTitle>Board Details</CardTitle>
          </CardHeader>
          <CardContent>
            {boardLoading ? (
              <div className="flex items-center justify-center p-4">
                <Spinner />
                <span className="ml-2">Loading board details...</span>
              </div>
            ) : boardError ? (
              <div className="text-red-600 p-4">
                Error loading board: {boardError.message}
              </div>
            ) : boardData?.data ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Board Information</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(boardData.data.board, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium">Canvas Elements ({boardData.data.elements.length})</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(boardData.data.elements, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium">User Permission</h3>
                  <p className="text-sm">{boardData.data.user_permission}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Active Presence ({boardData.data.active_presence.length})</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(boardData.data.active_presence, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No board data</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Boards Query:</span>{' '}
              <span className={boardsLoading ? 'text-yellow-600' : boardsError ? 'text-red-600' : 'text-green-600'}>
                {boardsLoading ? 'Loading' : boardsError ? 'Error' : 'Success'}
              </span>
            </div>
            <div>
              <span className="font-medium">Board Detail Query:</span>{' '}
              <span className={boardLoading ? 'text-yellow-600' : boardError ? 'text-red-600' : selectedBoardId ? 'text-green-600' : 'text-gray-600'}>
                {boardLoading ? 'Loading' : boardError ? 'Error' : selectedBoardId ? 'Success' : 'Not queried'}
              </span>
            </div>
            <div>
              <span className="font-medium">Create Board Mutation:</span>{' '}
              <span className={createBoardMutation.isPending ? 'text-yellow-600' : createBoardMutation.error ? 'text-red-600' : 'text-gray-600'}>
                {createBoardMutation.isPending ? 'Pending' : createBoardMutation.error ? 'Error' : 'Ready'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}