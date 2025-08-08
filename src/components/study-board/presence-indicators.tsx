'use client'

import { UserCursor } from '@/lib/collaboration/yjs-canvas-provider'
import { Point } from '@/types/study-board'

interface PresenceIndicatorsProps {
  cursors: Map<string, UserCursor>
  className?: string
}

interface CursorIndicatorProps {
  cursor: UserCursor
  position: Point
}

function CursorIndicator({ cursor, position }: CursorIndicatorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor dot */}
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
        style={{ backgroundColor: cursor.color }}
      />
      
      {/* User name and tool indicator */}
      <div
        className="absolute top-5 left-0 px-2 py-1 rounded text-xs text-white font-medium shadow-lg whitespace-nowrap"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.userName}
        {cursor.currentTool !== 'select' && (
          <span className="ml-1 opacity-75">({cursor.currentTool})</span>
        )}
      </div>
    </div>
  )
}

export function PresenceIndicators({ cursors, className = '' }: PresenceIndicatorsProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {Array.from(cursors.values()).map(cursor => {
        if (!cursor.cursor) return null
        
        return (
          <CursorIndicator
            key={cursor.userId}
            cursor={cursor}
            position={cursor.cursor}
          />
        )
      })}
    </div>
  )
}

interface PresenceListProps {
  cursors: Map<string, UserCursor>
  currentUserId: string
  currentUserName: string
  className?: string
}

export function PresenceList({ 
  cursors, 
  currentUserId, 
  currentUserName, 
  className = '' 
}: PresenceListProps) {
  const allUsers = [
    {
      userId: currentUserId,
      userName: currentUserName,
      color: '#22c55e', // Green for current user
      currentTool: 'select',
      isCurrentUser: true,
    },
    ...Array.from(cursors.values()).map(cursor => ({
      ...cursor,
      isCurrentUser: false,
    }))
  ]

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-2">
        Online ({allUsers.length})
      </h3>
      
      <div className="space-y-2">
        {allUsers.map(user => (
          <div key={user.userId} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-sm text-gray-700">
              {user.userName}
              {user.isCurrentUser && (
                <span className="text-xs text-gray-500 ml-1">(you)</span>
              )}
            </span>
            {user.currentTool !== 'select' && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                {user.currentTool}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CollaborationStatusProps {
  isConnected: boolean
  userCount: number
  className?: string
}

export function CollaborationStatus({ 
  isConnected, 
  userCount, 
  className = '' 
}: CollaborationStatusProps) {
  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className="text-gray-600">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      {isConnected && (
        <span className="text-gray-500">
          • {userCount} user{userCount !== 1 ? 's' : ''} online
        </span>
      )}
    </div>
  )
}