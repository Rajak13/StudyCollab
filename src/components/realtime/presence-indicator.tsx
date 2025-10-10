'use client'

import { Eye, MousePointer, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGroupRealtime } from '../../hooks/use-realtime'
import { UserPresence } from '../../lib/realtime/socket-client'
import { cn } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface PresenceIndicatorProps {
  groupId: string
  className?: string
  maxVisible?: number
  showCursors?: boolean
  showTools?: boolean
}

interface UserCursor {
  userId: string
  user: any
  cursor: { x: number; y: number }
  tool?: string
}

export function PresenceIndicator({
  groupId,
  className,
  maxVisible = 5,
  showCursors = false,
  showTools = false
}: PresenceIndicatorProps) {
  const realtimeData = useGroupRealtime(groupId)
  const { groupMembers = [], isConnected = false } = realtimeData
  const userCursors = realtimeData.userCursors || new Map()
  const userTools = new Map() // Temporarily disable user tools
  const [cursors, setCursors] = useState<UserCursor[]>([])

  // Update cursors when data changes
  useEffect(() => {
    if (!showCursors) return

    const activeCursors: UserCursor[] = []
    userCursors.forEach((cursor, userId) => {
      const member = groupMembers.find(m => m.userId === userId)
      if (member && member.isActive) {
        activeCursors.push({
          userId,
          user: member,
          cursor: cursor,
          tool: userTools.get(userId),
        })
      }
    })
    setCursors(activeCursors)
  }, [userCursors, userTools, groupMembers, showCursors])

  const activeMembers = groupMembers.filter(member => member.isActive)
  const visibleMembers = activeMembers.slice(0, maxVisible)
  const hiddenCount = Math.max(0, activeMembers.length - maxVisible)

  if (!isConnected || activeMembers.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn('relative', className)}>
        {/* Member avatars */}
        <div className="flex items-center -space-x-2">
          {visibleMembers.map((member) => (
            <MemberAvatar
              key={member.userId}
              member={member}
              showTool={showTools}
              currentTool={userTools.get(member.userId)}
            />
          ))}

          {hiddenCount > 0 && (
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 border-2 border-white rounded-full text-xs font-medium text-gray-600">
              +{hiddenCount}
            </div>
          )}
        </div>

        {/* Live cursors overlay */}
        {showCursors && cursors.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {cursors.map((cursor) => (
              <LiveCursor
                key={cursor.userId}
                cursor={cursor}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

interface MemberAvatarProps {
  member: UserPresence & { user: any }
  showTool?: boolean
  currentTool?: string
}

function MemberAvatar({ member, showTool, currentTool }: MemberAvatarProps) {
  const getStatusColor = () => {
    if (!member.isActive) return 'bg-gray-400'
    return 'bg-green-400'
  }

  const getToolIcon = () => {
    if (!showTool || !currentTool) return null

    switch (currentTool) {
      case 'pen':
      case 'pencil':
        return <Palette className="h-3 w-3" />
      case 'cursor':
      case 'select':
        return <MousePointer className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          <Avatar className="w-8 h-8 border-2 border-white">
            <AvatarImage
              src={member.user.avatar_url}
              alt={member.user.name}
            />
            <AvatarFallback className="text-xs">
              {member.user.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Status indicator */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            getStatusColor()
          )} />

          {/* Tool indicator */}
          {showTool && currentTool && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white">
              {getToolIcon()}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <div className="font-medium">{member.user.name}</div>
          <div className="text-xs text-gray-500">
            {member.isActive ? 'Active' : 'Away'}
            {currentTool && ` • Using ${currentTool}`}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

interface LiveCursorProps {
  cursor: UserCursor
}

function LiveCursor({ cursor }: LiveCursorProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Hide cursor after inactivity
  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [cursor.cursor.x, cursor.cursor.y])

  if (!isVisible) return null

  const cursorColor = `hsl(${(cursor.userId.charCodeAt(0) * 137.508) % 360}, 70%, 50%)`

  return (
    <div
      className="absolute transition-all duration-100 ease-out pointer-events-none"
      style={{
        left: cursor.cursor.x,
        top: cursor.cursor.y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-sm"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={cursorColor}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: cursorColor }}
      >
        {cursor.user.name}
        {cursor.tool && (
          <span className="ml-1 opacity-75">• {cursor.tool}</span>
        )}
      </div>
    </div>
  )
}

// Simplified presence count component
export function PresenceCount({ groupId, className }: { groupId: string; className?: string }) {
  const { groupMembers, isConnected } = useGroupRealtime(groupId)

  if (!isConnected) return null

  const activeCount = groupMembers.filter(m => m.isActive).length

  if (activeCount === 0) return null

  return (
    <Badge variant="secondary" className={cn('text-xs', className)}>
      <Eye className="h-3 w-3 mr-1" />
      {activeCount} viewing
    </Badge>
  )
}

// Hook for tracking user's own presence
export function useUserPresence(groupId: string) {
  const { updatePresence, updateCursor, changeTool, isConnected } = useGroupRealtime(groupId)
  const [currentTool, setCurrentTool] = useState<string>('cursor')

  // Track mouse movement for cursor updates
  useEffect(() => {
    if (!isConnected) return

    let throttleTimer: NodeJS.Timeout | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (throttleTimer) return

      throttleTimer = setTimeout(() => {
        updateCursor(groupId, { x: e.clientX, y: e.clientY })
        throttleTimer = null
      }, 50) // Throttle to 20fps
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [isConnected, updateCursor])

  const setTool = (tool: string) => {
    setCurrentTool(tool)
    changeTool(groupId, tool)
  }

  return {
    currentTool,
    setTool,
    updatePresence,
    isConnected,
  }
}