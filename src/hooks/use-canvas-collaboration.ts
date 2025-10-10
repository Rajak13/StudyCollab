'use client'

import { useStudyBoardStore } from '@/lib/stores/study-board-store'
import { createClient } from '@/lib/supabase'
import { CanvasElement } from '@/types/study-board'
import { useEffect, useRef, useState } from 'react'

interface CanvasChange {
  id: string
  type: 'add' | 'update' | 'delete'
  element: CanvasElement
  userId: string
  timestamp: number
}

export function useCanvasCollaboration(groupId: string, userId: string) {
  const { elements, addElement, updateElement, removeElement } = useStudyBoardStore()
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const lastChangeRef = useRef<number>(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!groupId || !userId) return

    // Create a channel for this group's canvas
    const channel = supabase.channel(`canvas-${groupId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    })

    // Listen for canvas changes from other users
    channel.on('broadcast', { event: 'canvas-change' }, (payload) => {
      const change = payload.payload as CanvasChange
      
      // Ignore our own changes
      if (change.userId === userId) return
      
      // Ignore old changes
      if (change.timestamp <= lastChangeRef.current) return
      
      console.log('Received canvas change:', change)
      
      switch (change.type) {
        case 'add':
          addElement(change.element)
          break
        case 'update':
          updateElement(change.element.id, change.element)
          break
        case 'delete':
          removeElement(change.element.id)
          break
      }
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('Canvas collaboration status:', status)
      setIsConnected(status === 'SUBSCRIBED')
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        setIsConnected(false)
      }
    }
  }, [groupId, userId, addElement, updateElement, removeElement, supabase])

  // Broadcast canvas changes to other users
  const broadcastChange = (type: 'add' | 'update' | 'delete', element: CanvasElement) => {
    if (!channelRef.current) return

    const change: CanvasChange = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      element,
      userId,
      timestamp: Date.now(),
    }

    lastChangeRef.current = change.timestamp

    channelRef.current.send({
      type: 'broadcast',
      event: 'canvas-change',
      payload: change,
    })

    console.log('Broadcasting canvas change:', change)
  }

  return {
    broadcastChange,
    isConnected,
  }
}