// Server-side exports
export { RealtimeServer, getRealtimeServer, initializeRealtimeServer } from './socket-server'

// Client-side exports
export {
    RealtimeClient,
    getRealtimeClient,
    initializeRealtimeClient, type ConnectionStatus,
    type SocketEventHandler, type SocketUser,
    type UserPresence
} from './socket-client'

// Connection management
export {
    ConnectionHealthMonitor, ConnectionManager, type ConnectionConfig,
    type ConnectionState
} from './connection-manager'

// Event system
export {
    RealtimeEventSystem,
    RealtimeEventTypes, createEventDebouncer, createEventFilter, createEventThrottler, getGlobalEventSystem,
    useRealtimeEvents, type BoardElementEvent,
    type ChatMessageEvent, type ConnectionEvent, type EventHandler, type GroupEvent, type RealtimeEvent, type UserPresenceEvent, type VoiceCallEvent
} from './event-system'

// React hooks
export {
    useGroupRealtime,
    usePresence, useRealtime, type UseRealtimeOptions,
    type UseRealtimeReturn
} from '../../hooks/use-realtime'

// React components
export {
    ConnectionStatusBadge, ConnectionStatusIndicator, useConnectionNotifications
} from '../../components/realtime/connection-status'

export {
    PresenceCount, PresenceIndicator, useUserPresence
} from '../../components/realtime/presence-indicator'
