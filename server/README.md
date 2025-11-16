# YouTube Sync Server

Real-time synchronized YouTube playback server using Socket.io.

## Features

- Room-based synchronization
- Real-time play/pause/seek events
- Automatic drift correction
- Host management
- User count tracking

## Setup Instructions

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:4000`

## API Endpoints

### REST Endpoints

- `GET /health` - Health check
- `GET /api/room/:roomId` - Get room information

### Socket.io Events

#### Client → Server

- `join-room` - Join or create a room
  ```js
  { roomId: string, videoId?: string }
  ```

- `play` - Play video
  ```js
  { roomId: string, time: number }
  ```

- `pause` - Pause video
  ```js
  { roomId: string, time: number }
  ```

- `seek` - Seek to timestamp
  ```js
  { roomId: string, time: number }
  ```

- `change-video` - Change video (host only)
  ```js
  { roomId: string, videoId: string }
  ```

- `sync-time` - Sync current time (host only)
  ```js
  { roomId: string, time: number, isPlaying: boolean }
  ```

- `leave-room` - Leave room
  ```js
  { roomId: string }
  ```

#### Server → Client

- `room-state` - Initial room state on join
- `user-count` - Updated user count
- `play` - Play command from host
- `pause` - Pause command from host
- `seek` - Seek command from host
- `video-changed` - Video changed by host
- `time-update` - Time sync update
- `host-assigned` - You are now the host
- `error` - Error message

## Deployment

### Render.com

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable:
   - `CLIENT_URL` = Your frontend URL (e.g., `https://your-app.vercel.app`)

### Railway.app

1. Create a new project
2. Deploy from GitHub
3. Add environment variable:
   - `CLIENT_URL` = Your frontend URL

The `PORT` environment variable is automatically set by the platform.

## Environment Variables

- `PORT` - Server port (default: 4000)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `NODE_ENV` - Environment (development/production)

## Testing

Test the server is running:
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "2025-01-16T12:00:00.000Z"
}
```
