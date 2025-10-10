# Real-time Infrastructure Documentation

## Overview

The StudyCollab real-time infrastructure provides WebSocket-based communication for collaborative features including presence tracking, live cursors, and real-time synchronization. Built with Socket.io and integrated with Supabase authentication.

## Architecture

### Server-Side Components

#### RealtimeServer (`src/lib/realtime/socket-server.ts`)
- Main Socket.io server implementation
- Handles WebSocket connections and authentication
- Manages user presence and group memberships
- Provides event broadcasting capabilities

#### Connection Manager (`src/lib/realtime/connection-manager.ts`)
- Handles connection lifecycle management
- Implements reconnection logic with exponential backoff
- Monitors connection health and quality
- Provides connection state management

#### Event System (`src/lib/realtime/event-system.ts`)
- Type-safe event handling system
- Event history and debugging capabilities
- Event filtering, debouncing, and throttling utilities
- Predefined event types for common operations

### Client-Side Components

#### RealtimeClient (`src/lib/realtime/socket-client.ts`)
- Client-side Socket.io connection management
- Automatic reconnection with exponential backoff
- Authentication token management
- Event handling and emission

#### React Hooks

##### useRealtime
```typescript
const {
  isConnected,
  connectionStatus,
  connect,
  disconnect,
  updatePresence,
  updateCursor,
  changeTool,
  joinGroup,
  leaveGroup,
  currentGroupId,
  on,
  off,
  emit,
  reconnect
} = useRealtime({ autoConnect: true, groupId: 'optional-group-id' })
```

##### useGroupRealtime
```typescript
const {
  groupMembers,
  userCursors,
  userTools,
  ...realtimeProps
} = useGroupRealtime('group-id')
```

##### usePresence
```typescript
const {
  isActive,
  updatePresence,
  updateCursor,
  changeTool
} = usePresence('optional-group-id')
```

#### React Components

##### ConnectionStatusIndicator
```typescript
<ConnectionStatusIndicator 
  showDetails={true}
  showReconnectButton={true}
  className="custom-class"
/>
```

##### PresenceIndicator
```typescript
<PresenceIndicator 
  groupId="group-123"
  maxVisible={5}
  showCursors={true}
  showTools={true}
/>
```

## Setup and Configuration

### 1. Server Setup

The real-time server is initialized in `server.js`:

```javascript
const { initializeRealtimeServer } = require('./dist/src/lib/realtime/socket-server.js')

// Initialize Socket.io server
const realtimeServer = initializeRealtimeServer(server)
```

### 2. Environment Variables

Required environment variables:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Build Configuration

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "npm run build:server && node server.js",
    "build": "next build && npm run build:server",
    "build:server": "tsc --project tsconfig.server.json",
    "start": "npm run build && node server.js"
  }
}
```

Create `tsconfig.server.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/lib/realtime/**/*"]
}
```

## Event Types

### Connection Events
- `connection:established` - Connection successfully established
- `connection:lost` - Connection lost
- `connection:error` - Connection error occurred

### User Presence Events
- `user:joined` - User joined a group
- `user:left` - User left a group
- `user:presence:updated` - User presence information updated
- `user:cursor:updated` - User cursor position updated
- `user:tool:changed` - User changed active tool

### Group Events
- `group:joined` - Successfully joined a group
- `group:left` - Successfully left a group
- `group:presence` - Group presence information

### System Events
- `heartbeat` - Heartbeat ping
- `heartbeat:ack` - Heartbeat acknowledgment

## Authentication

The real-time server uses Supabase JWT tokens for authentication:

1. Client obtains JWT token from Supabase auth
2. Token is sent in Socket.io handshake
3. Server validates token with Supabase
4. User information is stored in socket session

## Presence Tracking

### User Presence Data Structure
```typescript
interface UserPresence {
  userId: string
  groupId?: string
  cursor?: { x: number; y: number }
  isActive: boolean
  currentTool?: string
  lastSeen: Date
}
```

### Automatic Activity Detection
- Mouse movement, keyboard input, and touch events
- Automatic inactive status after 1 minute of inactivity
- Heartbeat system to detect disconnected users

## Error Handling and Reconnection

### Connection Management
- Automatic reconnection with exponential backoff
- Maximum reconnection attempts (default: 5)
- Connection timeout handling (default: 10 seconds)
- Graceful degradation when offline

### Error Recovery
- Connection state persistence
- Event queue for offline scenarios
- Conflict resolution for concurrent operations
- User feedback for connection issues

## Performance Considerations

### Throttling and Debouncing
- Cursor updates throttled to 20fps (50ms intervals)
- Presence updates debounced to prevent spam
- Event batching for high-frequency operations

### Memory Management
- Event history limited to 100 events
- Automatic cleanup of disconnected users
- Efficient data structures for presence tracking

### Scalability
- Room-based event broadcasting
- Selective event subscription
- Connection pooling and load balancing ready

## Testing

### Test Page
Access `/test-realtime` to test real-time functionality:
- Connection status monitoring
- Group joining/leaving
- Presence and cursor tracking
- Tool selection
- Event emission and reception

### API Testing
Use `/api/realtime/test` endpoint:
```typescript
// POST - Emit test event
{
  "event": "test:event",
  "data": { "message": "Hello" },
  "groupId": "optional-group-id"
}

// GET - Get presence information
?groupId=optional-group-id
```

## Security Considerations

### Authentication
- JWT token validation on every connection
- User session management
- Automatic disconnection on token expiry

### Authorization
- Group-based access control
- User permission validation
- Rate limiting on event emission

### Data Validation
- Input sanitization for all events
- Type checking for event payloads
- Protection against malicious events

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check authentication token validity
   - Verify environment variables
   - Check network connectivity

2. **Events Not Received**
   - Verify group membership
   - Check event handler registration
   - Monitor connection status

3. **High Latency**
   - Check network conditions
   - Monitor server performance
   - Review event throttling settings

### Debugging Tools

1. **Connection Status Component**
   - Real-time connection monitoring
   - Reconnection attempt tracking
   - Error message display

2. **Event System History**
   - Event logging and replay
   - Performance metrics
   - Error tracking

3. **Browser Developer Tools**
   - WebSocket connection monitoring
   - Network request inspection
   - Console error logging

## Future Enhancements

### Planned Features
- Voice call signaling integration
- File sharing real-time updates
- Collaborative document editing
- Screen sharing coordination

### Performance Improvements
- Redis integration for scaling
- Event compression
- Selective synchronization
- Offline-first architecture

### Monitoring and Analytics
- Connection quality metrics
- User engagement tracking
- Performance monitoring
- Error reporting integration