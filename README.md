# 🎵 YouTube Sync - Watch Together

A full-stack web application that allows multiple users to watch YouTube videos together in perfect synchronization. Built with Next.js, Node.js, Express, and Socket.io.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/next.js-14.1.0-black.svg)

## ✨ Features

- 🎬 **Real-time Synchronization** - Play, pause, and seek actions sync instantly across all viewers
- 🎯 **Drift Correction** - Advanced algorithm keeps everyone within 0.3 seconds of sync
- 👥 **Multi-user Rooms** - Unlimited users can join the same room
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔗 **Easy Sharing** - Share room links to invite friends
- 🎭 **Host Controls** - Room creator can change videos
- 🆓 **Completely Free** - No ads, no subscriptions, no API costs

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Socket.io-client
- YouTube IFrame Player API

**Backend:**
- Node.js
- Express
- Socket.io
- CORS enabled

### How It Works

```
┌─────────────┐         WebSocket         ┌─────────────┐
│   Client 1  │◄──────────────────────────►│             │
│   (Host)    │    play/pause/seek/sync    │   Server    │
└─────────────┘                            │  (Node.js)  │
                                           │  Socket.io  │
┌─────────────┐         WebSocket         │             │
│   Client 2  │◄──────────────────────────►│             │
└─────────────┘      receive events        └─────────────┘

┌─────────────┐         WebSocket
│   Client N  │◄──────────────────────────►
└─────────────┘
```

**Synchronization Flow:**

1. **User Actions:** Host plays/pauses/seeks video
2. **Event Emission:** Action emitted to server via WebSocket
3. **Broadcasting:** Server broadcasts to all room members
4. **Player Update:** All clients update their YouTube player
5. **Drift Correction:** Host sends time updates every 2 seconds
6. **Sync Check:** Clients check drift and auto-correct if needed

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd youtube-jam
```

2. **Setup Backend:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

Backend runs on `http://localhost:4000`

3. **Setup Frontend (in new terminal):**
```bash
cd client
npm install
cp .env.local.example .env.local
# Edit .env.local to point to your backend
npm run dev
```

Frontend runs on `http://localhost:3000`

4. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - Create a room
   - Share the room URL with friends!

## 📁 Project Structure

```
youtube-jam/
├── server/                 # Backend (Node.js + Socket.io)
│   ├── index.js           # Main server file
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── client/                # Frontend (Next.js)
│   ├── components/
│   │   └── YouTubePlayer.tsx
│   ├── lib/
│   │   ├── socket.ts      # Socket.io client
│   │   └── youtube.ts     # YouTube utilities
│   ├── pages/
│   │   ├── index.tsx      # Home page
│   │   └── room/
│   │       └── [roomId].tsx  # Room page
│   ├── styles/
│   ├── package.json
│   └── README.md
│
└── README.md              # This file
```

## 🎮 Usage

### Creating a Room

1. Go to the home page
2. (Optional) Paste a YouTube URL
3. Click "Create Room"
4. You'll be redirected to your room as the host

### Joining a Room

1. Get the room URL from your friend
2. Open the URL in your browser
3. You'll automatically join the room

### Room Controls

**As Host:**
- Control playback (play/pause/seek)
- Change videos
- All actions sync to viewers

**As Viewer:**
- Playback controlled by host
- Automatic sync correction
- See user count in real-time

## 🌐 Deployment

### Deploy Backend

#### Option 1: Render.com

1. Create a new Web Service
2. Connect your repository
3. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `CLIENT_URL`: Your frontend URL (e.g., `https://your-app.vercel.app`)

#### Option 2: Railway.app

1. Create new project from GitHub
2. Add environment variable:
   - `CLIENT_URL`: Your frontend URL
3. Deploy

### Deploy Frontend

#### Vercel (Recommended)

1. Import your repository
2. Root directory: `client`
3. Environment Variables:
   - `NEXT_PUBLIC_SOCKET_URL`: Your backend URL
4. Deploy

#### Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add environment variable same as above

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=4000                              # Server port
CLIENT_URL=http://localhost:3000       # Frontend URL for CORS
NODE_ENV=development                   # Environment
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000  # Backend WebSocket URL
```

## 🎯 Key Features Explained

### 1. Perfect Synchronization

The app uses a dual-sync approach:
- **Immediate sync:** Play/pause/seek events broadcast instantly
- **Drift correction:** Background sync every 2 seconds corrects any drift

### 2. Host System

- First user to join becomes host
- Host can change videos
- If host leaves, next user becomes host automatically
- Host controls are clearly marked in UI

### 3. Drift Correction Algorithm

```typescript
// Every 2 seconds on host
const currentTime = player.getCurrentTime();
emit('sync-time', { time: currentTime, isPlaying });

// On clients
const drift = Math.abs(myTime - hostTime);
if (drift > 0.3) {  // 300ms threshold
  player.seekTo(hostTime);
}
```

### 4. Room Management

- Rooms created on-demand
- Automatic cleanup when empty
- No database required (in-memory storage)
- Unlimited concurrent rooms

## 🐛 Troubleshooting

### Common Issues

**Player not loading:**
- Check browser console for errors
- Verify YouTube IFrame API loaded
- Try different browser

**Not syncing:**
- Check connection indicator (green = connected)
- Verify backend is running
- Check CORS settings

**Video blocked:**
- Some videos can't be embedded
- Try different video
- Check video ID is valid

**High drift:**
- Check network connection
- Increase DRIFT_THRESHOLD
- Reduce SYNC_INTERVAL

## 📝 API Reference

### Socket.io Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId, videoId }` | Join/create room |
| `play` | `{ roomId, time }` | Play video |
| `pause` | `{ roomId, time }` | Pause video |
| `seek` | `{ roomId, time }` | Seek to time |
| `change-video` | `{ roomId, videoId }` | Change video |
| `sync-time` | `{ roomId, time, isPlaying }` | Sync time |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-state` | `{ videoId, isPlaying, currentTime, isHost, userCount }` | Initial state |
| `user-count` | `{ count }` | User count update |
| `play` | `{ time }` | Play command |
| `pause` | `{ time }` | Pause command |
| `seek` | `{ time }` | Seek command |
| `video-changed` | `{ videoId }` | Video changed |
| `time-update` | `{ time, isPlaying }` | Time sync |
| `host-assigned` | - | You're now host |

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/room/:roomId` | GET | Get room info |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- YouTube IFrame Player API
- Socket.io team
- Next.js team
- Vercel for hosting

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review server/client logs
3. Open an issue on GitHub

---

**Built with ❤️ using Next.js and Socket.io**

Happy watching together! 🎉
