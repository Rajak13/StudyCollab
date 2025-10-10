import { useAuth } from '@/hooks/use-auth'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { createClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useRef } from 'react'

export function useRealtimeNotifications() {
  const { user } = useAuth()
  const { addNotification, setSubscribed } = useNotificationStore()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      // Clean up subscription if user logs out
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
        setSubscribed(false)
      }
      return
    }

    // Create a channel for the current user
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_join_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // User's join request was created (shouldn't happen via realtime, but just in case)
          console.log('Join request created:', payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_join_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // User's join request was approved/rejected
          const newRecord = payload.new as Record<string, unknown>
          if (newRecord.status === 'APPROVED') {
            addNotification({
              type: 'GROUP_JOIN_APPROVED',
              title: 'Join Request Approved',
              message: 'Your request to join the group has been approved!',
              data: {
                groupId: newRecord.group_id as string,
              },
              read: false,
              created_at: new Date().toISOString(),
            })
          } else if (newRecord.status === 'REJECTED') {
            addNotification({
              type: 'GROUP_JOIN_REJECTED',
              title: 'Join Request Rejected',
              message: 'Your request to join the group has been rejected.',
              data: {
                groupId: newRecord.group_id as string,
              },
              read: false,
              created_at: new Date().toISOString(),
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // User was added to a group
          const newRecord = payload.new as Record<string, unknown>
          if (newRecord.role !== 'OWNER') {
            // Don't notify when user creates their own group
            addNotification({
              type: 'GROUP_MEMBER_JOINED',
              title: 'Added to Group',
              message: 'You have been added to a study group!',
              data: {
                groupId: newRecord.group_id as string,
              },
              read: false,
              created_at: new Date().toISOString(),
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // User's role was updated
          const oldRecord = payload.old as Record<string, unknown>
          const newRecord = payload.new as Record<string, unknown>
          
          if (oldRecord.role !== newRecord.role) {
            const isPromotion = 
              (oldRecord.role === 'MEMBER' && newRecord.role === 'ADMIN') ||
              (oldRecord.role === 'ADMIN' && newRecord.role === 'OWNER')
            
            addNotification({
              type: 'GROUP_MEMBER_PROMOTED',
              title: isPromotion ? 'Role Promoted' : 'Role Changed',
              message: `Your role has been changed from ${oldRecord.role as string} to ${newRecord.role as string}`,
              data: {
                groupId: newRecord.group_id as string,
                oldRole: oldRecord.role as string,
                newRole: newRecord.role as string,
              },
              read: false,
              created_at: new Date().toISOString(),
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // User was removed from a group
          const oldRecord = payload.old as Record<string, unknown>
          addNotification({
            type: 'GROUP_MEMBER_REMOVED',
            title: 'Removed from Group',
            message: 'You have been removed from a study group.',
            data: {
              groupId: oldRecord.group_id as string,
            },
            read: false,
            created_at: new Date().toISOString(),
          })
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        setSubscribed(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    // Subscribe to group-specific events for groups the user is a member of
    const subscribeToGroupEvents = async () => {
    if (!user) return

    try {
      // Get user's groups to subscribe to group-specific events
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id)

      if (!memberships) return

      // Subscribe to join requests for groups where user is owner/admin
      const adminGroups = memberships
        .filter((m) => m.role === 'OWNER' || m.role === 'ADMIN')
        .map((m) => m.group_id)

      if (adminGroups.length > 0) {
        supabase
          .channel(`join-requests:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'group_join_requests',
            },
            async (payload) => {
              const newRecord = payload.new as Record<string, unknown>
              
              // Check if this is for a group the user manages
              if (adminGroups.includes(newRecord.group_id as string)) {
                // Get group name and user name for the notification
                const { data: group } = await supabase
                  .from('study_groups')
                  .select('name')
                  .eq('id', newRecord.group_id as string)
                  .single()

                const { data: requestUser } = await supabase.auth.admin.getUserById(
                  newRecord.user_id as string
                )

                addNotification({
                  type: 'GROUP_JOIN_REQUEST',
                  title: 'New Join Request',
                  message: `${requestUser.user?.user_metadata?.name || requestUser.user?.email || 'Someone'} wants to join ${group?.name || 'your group'}`,
                  data: {
                    groupId: newRecord.group_id as string,
                    groupName: group?.name,
                    userId: newRecord.user_id as string,
                    userName: requestUser.user?.user_metadata?.name || requestUser.user?.email,
                  },
                  read: false,
                  created_at: new Date().toISOString(),
                })
              }
            }
          )
          .subscribe()

        // Store reference to clean up later
        // Note: In a real implementation, you'd want to manage multiple channels
      }

      // Subscribe to new messages in groups
      supabase
        .channel(`messages:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
          },
          async (payload) => {
            const newRecord = payload.new as Record<string, unknown>
            
            // Don't notify for own messages
            if (newRecord.user_id === user.id) return

            // Check if user is member of this group
            const userGroups = memberships.map((m) => m.group_id)
            if (userGroups.includes(newRecord.group_id as string)) {
              const { data: group } = await supabase
                .from('study_groups')
                .select('name')
                .eq('id', newRecord.group_id as string)
                .single()

              const { data: messageUser } = await supabase.auth.admin.getUserById(
                newRecord.user_id as string
              )

              addNotification({
                type: 'GROUP_MESSAGE',
                title: 'New Message',
                message: `${messageUser.user?.user_metadata?.name || messageUser.user?.email || 'Someone'} sent a message in ${group?.name || 'a group'}`,
                data: {
                  groupId: newRecord.group_id as string,
                  groupName: group?.name,
                  userId: newRecord.user_id as string,
                  userName: messageUser.user?.user_metadata?.name || messageUser.user?.email,
                  messageId: newRecord.id as string,
                },
                read: false,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expire after 24 hours
              })
            }
          }
        )
        .subscribe()

    } catch (error) {
      console.error('Error subscribing to group events:', error)
    }
  }

    subscribeToGroupEvents()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
        setSubscribed(false)
      }
    }
  }, [user, addNotification, setSubscribed, supabase])

  return {
    isSubscribed: useNotificationStore((state) => state.isSubscribed),
  }
}