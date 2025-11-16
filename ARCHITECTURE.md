# 🏗️ Architecture & Technical Details

Deep dive into how YouTube Sync works under the hood.

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐     ┌───────────┐  │
│  │   Next.js    │◄─────│  Socket.io   │────►│  YouTube  │  │
│  │   Pages      │      │   Client     │     │   IFrame  │  │
│  └──────────────┘      └──────────────┘     │    API    │  │
│         │                     │             └───────────┘  │
│         │                     │                   │        │
│         ▼                     ▼                   ▼        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React State Management                  │  │
│  │  - videoId, isHost, userCount, isConnected          │  │
│  │  - playerRef, socketRef, syncInterval               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              │
┌─────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐     ┌───────────┐  │
│  │   Express    │      │  Socket.io   │     │  In-Memory│  │
│  │   Server     │      │   Server     │────►│   Room    │  │
│  │  (REST API)  │      │              │     │  Storage  │  │
│  └──────────────┘      └──────────────┘     └───────────┘  │
│         │                     │                             │
│         ▼                     ▼                             │
│   /health, /api/room    Event Handlers                     │
│                         - join-room                         │
│                         - play/pause/seek                   │
│                         - change-video                      │
│                         - sync-time                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Room Creation Flow

```
User clicks "Create Room"
    ↓
Generate random roomId
    ↓
Navigate to /room/[roomId]
    ↓
Socket.io connects to server
    ↓
Emit "join-room" event
    ↓
Server creates room in memory
    ↓
Server sends back "room-state"
    ↓
Client initializes YouTube player
    ↓
Host can control playback
```

### 2. Join Room Flow

```
User opens room URL
    ↓
Extract roomId from URL
    ↓
Socket.io connects to server
    ↓
Emit "join-room" event
    ↓
Server adds user to existing room
    ↓
Server sends current room state
    ↓
Client syncs to host's timestamp
    ↓
Client receives events from host
```

### 3. Synchronization Flow

```
Host clicks Play
    ↓
YouTube IFrame fires onStateChange
    ↓
Client detects PLAYING state
    ↓
Emit "play" event to server
    ↓
Server broadcasts to all room members
    ↓
Clients receive "play" event
    ↓
Clients call player.playVideo()
    ↓
All players play in sync
```

### 4. Drift Correction Flow

```
Every 2 seconds (on host):
    ↓
Get current playback time
    ↓
Emit "sync-time" to server
    ↓
Server broadcasts "time-update"
    ↓
Clients receive host's time
    ↓
Calculate drift: |myTime - hostTime|
    ↓
If drift > 0.3 seconds:
    ↓
Seek to host's time
```

---

## 🧩 Key Components

### Backend Components

#### 1. Express Server
**File:** `server/index.js`

**Responsibilities:**
- HTTP server for REST endpoints
- CORS configuration
- Health check endpoint
- Room info API

**Key Code:**
```javascript
const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

#### 2. Socket.io Server
**File:** `server/index.js`

**Responsibilities:**
- WebSocket connection management
- Room management
- Event broadcasting
- User tracking

**Key Code:**
```javascript
io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, videoId }) => {
    socket.join(roomId);
    // Initialize or update room
  });

  socket.on('play', ({ roomId, time }) => {
    socket.to(roomId).emit('play', { time });
  });
});
```

#### 3. Room Storage
**Structure:**
```javascript
const rooms = new Map();

// Room structure:
{
  videoId: string,
  isPlaying: boolean,
  currentTime: number,
  host: string,
  users: Set<string>,
  lastUpdate: number
}
```

### Frontend Components

#### 1. YouTubePlayer Component
**File:** `client/components/YouTubePlayer.tsx`

**Responsibilities:**
- Load YouTube IFrame API
- Initialize player
- Handle player events
- Expose player controls

**Key Code:**
```typescript
const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onReady,
  onStateChange,
  onError
}) => {
  // Initialize player
  playerRef.current = new window.YT.Player(containerRef.current, {
    videoId,
    events: { onReady, onStateChange, onError }
  });
};
```

#### 2. Socket Client
**File:** `client/lib/socket.ts`

**Responsibilities:**
- Establish WebSocket connection
- Handle reconnection
- Export socket instance

**Key Code:**
```typescript
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
  }
  return socket;
};
```

#### 3. Room Page
**File:** `client/pages/room/[roomId].tsx`

**Responsibilities:**
- Manage room state
- Handle sync logic
- Drift correction
- UI rendering

**Key Features:**
- State management with hooks
- Event listeners for Socket.io
- YouTube player integration
- Drift correction interval

---

## 🎯 Core Algorithms

### 1. Drift Correction Algorithm

**Problem:** Network latency causes playback to drift over time

**Solution:**
```typescript
// Host sends time every 2 seconds
setInterval(() => {
  const currentTime = player.getCurrentTime();
  const isPlaying = player.getPlayerState() === YT_STATES.PLAYING;

  socket.emit('sync-time', {
    roomId,
    time: currentTime,
    isPlaying
  });
}, 2000);

// Clients correct drift
socket.on('time-update', ({ time, isPlaying }) => {
  const currentTime = player.getCurrentTime();
  const drift = Math.abs(currentTime - time);

  // Only correct if significant drift
  if (drift > 0.3) {
    player.seekTo(time, true);

    // Sync play state
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }
});
```

**Why 0.3 seconds?**
- Below human perception threshold (~300ms)
- Prevents over-correction
- Accounts for network jitter

**Why 2 second interval?**
- Balance between accuracy and bandwidth
- Prevents server overload
- Gives network time to stabilize

### 2. Event Deduplication

**Problem:** Rapid state changes cause event spam

**Solution:**
```typescript
const lastSyncTime = useRef<number>(0);

const handleStateChange = (event) => {
  const now = Date.now();

  // Throttle: minimum 500ms between events
  if (now - lastSyncTime.current < 500) {
    return;
  }

  lastSyncTime.current = now;
  socket.emit('play', { roomId, time });
};
```

### 3. Host Migration

**Problem:** What happens when host disconnects?

**Solution:**
```javascript
socket.on('disconnect', () => {
  rooms.forEach((room, roomId) => {
    if (room.host === socket.id && room.users.size > 0) {
      // Assign new host (first remaining user)
      const newHost = Array.from(room.users)[0];
      room.host = newHost;

      // Notify new host
      io.to(newHost).emit('host-assigned');
    }
  });
});
```

---

## 🔐 Security Considerations

### Current Implementation

✅ **Implemented:**
- CORS restricted to frontend domain
- Environment variables for sensitive config
- Input validation on room IDs
- No authentication required (by design)

⚠️ **Not Implemented (for MVP):**
- Rate limiting
- Room passwords
- User authentication
- Persistent storage

### Production Recommendations

**Add Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit per IP
});

app.use('/api/', limiter);
```

**Add Room Validation:**
```javascript
const validateRoomId = (roomId) => {
  return /^[a-z0-9]{6,12}$/i.test(roomId);
};
```

---

## 📈 Performance Optimizations

### 1. YouTube Player Loading

**Strategy:** Lazy load IFrame API
```typescript
// Only load when needed
useEffect(() => {
  if (!window.YT) {
    // Wait for API to load
    const checkAPIReady = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsAPIReady(true);
        clearInterval(checkAPIReady);
      }
    }, 100);
  }
}, []);
```

### 2. Socket.io Reconnection

**Strategy:** Exponential backoff
```typescript
const socket = io(serverUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

### 3. Room Cleanup

**Strategy:** Delete empty rooms immediately
```javascript
if (room.users.size === 0) {
  rooms.delete(roomId);
  console.log(`Room ${roomId} deleted (empty)`);
}
```

### 4. Event Throttling

**Strategy:** Debounce rapid events
```typescript
const ignoreNextStateChange = useRef<boolean>(false);

// Ignore self-triggered events
socket.on('play', () => {
  ignoreNextStateChange.current = true;
  player.playVideo();
});
```

---

## 🧪 State Management

### Client State

```typescript
// Room state
const [videoId, setVideoId] = useState<string>('dQw4w9WgXcQ');
const [isHost, setIsHost] = useState<boolean>(false);
const [userCount, setUserCount] = useState<number>(1);
const [isConnected, setIsConnected] = useState<boolean>(false);

// Refs (don't trigger re-renders)
const playerRef = useRef<any>(null);
const socketRef = useRef<any>(null);
const syncIntervalRef = useRef<any>(null);
const ignoreNextStateChange = useRef<boolean>(false);
```

**Why refs?**
- Don't cause re-renders
- Persist across renders
- Direct access to instances

### Server State

```javascript
// In-memory Map
const rooms = new Map();

// Why Map over Object?
// - O(1) get/set/delete
// - Any key type
// - Iterable
// - Size property
```

---

## 🌐 Network Protocol

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId, videoId }` | Create/join room |
| `play` | `{ roomId, time }` | Play video |
| `pause` | `{ roomId, time }` | Pause video |
| `seek` | `{ roomId, time }` | Seek to time |
| `change-video` | `{ roomId, videoId }` | Change video (host) |
| `sync-time` | `{ roomId, time, isPlaying }` | Sync time (host) |
| `leave-room` | `{ roomId }` | Leave room |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-state` | `{ videoId, isPlaying, currentTime, isHost, userCount }` | Initial state |
| `user-count` | `{ count }` | User count update |
| `play` | `{ time }` | Play command |
| `pause` | `{ time }` | Pause command |
| `seek` | `{ time }` | Seek command |
| `video-changed` | `{ videoId }` | Video changed |
| `time-update` | `{ time, isPlaying, timestamp }` | Time sync |
| `host-assigned` | - | You're now host |
| `error` | `{ message }` | Error message |

### REST Endpoints

| Endpoint | Method | Response |
|----------|--------|----------|
| `/health` | GET | `{ status, rooms, timestamp }` |
| `/api/room/:roomId` | GET | `{ roomId, videoId, isPlaying, currentTime, userCount }` |

---

## 🎨 UI/UX Design Decisions

### 1. Color Scheme

**Primary:** Red (#ff0000) - YouTube brand color
**Background:** Dark gradient - Cinema-like experience
**Accents:** Blue for secondary actions

### 2. Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Video player:** Always 16:9 aspect ratio

### 3. User Feedback

**Connection status:** Green/red indicator
**Host badge:** Visual distinction
**User count:** Real-time updates
**Loading states:** Spinner during transitions

---

## 🔮 Future Enhancements

### Potential Features

**Chat System:**
```javascript
socket.on('chat-message', ({ roomId, message, user }) => {
  io.to(roomId).emit('new-message', { message, user, timestamp });
});
```

**Queue System:**
```javascript
const room = {
  queue: ['videoId1', 'videoId2'],
  currentIndex: 0
};
```

**Room Persistence:**
```javascript
// Use Redis instead of Map
const redis = require('redis');
const client = redis.createClient();

await client.set(`room:${roomId}`, JSON.stringify(roomData));
```

**User Authentication:**
```javascript
// JWT tokens
const token = jwt.sign({ userId }, secret);
socket.emit('authenticate', { token });
```

---

## 📊 Scalability

### Current Limits

**In-memory storage:**
- Limited by RAM
- Lost on server restart
- Single server only

**Scaling to 1000+ concurrent rooms:**

**Solution 1: Redis**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Persistent room storage
await client.hSet(`room:${roomId}`, 'videoId', videoId);
```

**Solution 2: Socket.io Adapter**
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');

io.adapter(createAdapter(pubClient, subClient));
```

**Solution 3: Load Balancer**
```
Client → Load Balancer → Server 1
                      → Server 2
                      → Server 3
```

---

## 🧮 Complexity Analysis

### Time Complexity

| Operation | Complexity | Note |
|-----------|-----------|------|
| Join room | O(1) | Map lookup |
| Leave room | O(1) | Set delete |
| Broadcast event | O(n) | n = users in room |
| Find room | O(1) | Map get |

### Space Complexity

| Data | Space | Note |
|------|-------|------|
| Room storage | O(r) | r = number of rooms |
| User tracking | O(u) | u = total users |
| Event queues | O(1) | Socket.io handles |

---

## 🎓 Design Patterns Used

**1. Singleton Pattern**
- Socket.io client instance

**2. Observer Pattern**
- Socket.io event listeners

**3. Factory Pattern**
- YouTube player creation

**4. Publish-Subscribe Pattern**
- Room event broadcasting

---

**📚 This architecture supports:**
- ✅ Real-time synchronization
- ✅ Scalable design
- ✅ Clean separation of concerns
- ✅ Easy maintenance
- ✅ Future extensibility
