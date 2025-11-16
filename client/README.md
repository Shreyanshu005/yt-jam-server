# YouTube Sync - Client

Real-time synchronized YouTube playback client built with Next.js.

## Features

- 🎵 Perfect synchronization with drift correction
- ⚡ Real-time WebSocket communication
- 🎬 YouTube IFrame Player API integration
- 👥 Multi-user room support
- 🎨 Beautiful Tailwind CSS UI
- 📱 Responsive design

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **WebSocket:** Socket.io-client
- **Video Player:** YouTube IFrame API

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Backend server running (see `/server` directory)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your backend URL:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Project Structure

```
client/
├── components/
│   └── YouTubePlayer.tsx      # YouTube IFrame Player component
├── lib/
│   ├── socket.ts              # Socket.io client setup
│   └── youtube.ts             # YouTube utility functions
├── pages/
│   ├── _app.tsx               # Next.js app wrapper
│   ├── _document.tsx          # Custom document with YT API
│   ├── index.tsx              # Home page (create/join room)
│   └── room/
│       └── [roomId].tsx       # Room page with sync logic
├── public/                    # Static assets
├── styles/
│   └── globals.css            # Global styles with Tailwind
└── package.json
```

## How It Works

### Room System

1. **Create Room:** Generates a unique room ID and redirects to room page
2. **Join Room:** Enter room ID to join existing room
3. **Host Assignment:** First user becomes host, can change videos
4. **Auto Host Transfer:** If host leaves, next user becomes host

### Synchronization Logic

#### Play/Pause/Seek Events
- When host performs any action, event is emitted to server
- Server broadcasts event to all clients in the room
- Clients receive event and update their player state

#### Drift Correction
- Host emits current time every 2 seconds
- Clients compare their time with host's time
- If drift > 0.3 seconds, client seeks to correct position
- Ensures perfect synchronization even with network latency

### Code Flow

```typescript
// Host actions
onStateChange (play/pause/seek)
  → emit to server
  → server broadcasts to room
  → clients update player

// Drift correction (every 2s)
Host: getCurrentTime()
  → emit sync-time
  → server broadcasts time-update
  → Clients: check drift
  → if drift > 0.3s: seekTo(hostTime)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOCKET_URL` | Backend WebSocket URL | `http://localhost:4000` |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub

2. Import project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Root directory: `client`

3. Add environment variable:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
   ```

4. Deploy!

### Manual Deployment

Build and export:
```bash
npm run build
npm start
```

Or use any Node.js hosting platform (Netlify, Railway, etc.)

## Troubleshooting

### Player not loading
- Check browser console for errors
- Ensure YouTube IFrame API is loaded
- Check video ID is valid

### Sync not working
- Verify Socket.io connection (check connection indicator)
- Ensure backend server is running
- Check CORS settings on backend

### Drift correction too aggressive
- Adjust `DRIFT_THRESHOLD` in `room/[roomId].tsx`
- Increase `SYNC_INTERVAL` for less frequent checks

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## License

MIT
