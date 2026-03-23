const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const YTMusic = require('ytmusic-api');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// -----------------------------
// YouTube Music API (ytmusic-api)
// -----------------------------

let ytmusicClient = null;
let ytmusicInitPromise = null;

async function getYTMusicClient() {
  if (ytmusicClient) return ytmusicClient;
  if (ytmusicInitPromise) return ytmusicInitPromise;

  ytmusicInitPromise = (async () => {
    const client = new YTMusic();
    // Optional cookies support (string). If you need auth-restricted content,
    // set YTMUSIC_COOKIES in server env.
    const cookies = process.env.YTMUSIC_COOKIES;
    await client.initialize(cookies);
    ytmusicClient = client;
    console.log('✅ YTMusic client initialized');
    return client;
  })();

  return ytmusicInitPromise;
}

function parseDurationToSeconds(duration) {
  // ytmusic-api sometimes returns null, or a string like "3:45" / "1:02:10"
  if (!duration) return null;
  if (typeof duration === 'number' && Number.isFinite(duration)) return duration;
  if (typeof duration !== 'string') return null;

  const parts = duration.split(':').map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return null;
}

function mapSearchItemToTrack(item) {
  if (!item || !item.videoId || !item.name) return null;

  const artistName =
    item.artist?.name ||
    item.artists?.[0]?.name ||
    item.author?.name ||
    item.author ||
    'Unknown Artist';

  return {
    videoId: item.videoId,
    title: item.name,
    artist: artistName,
    durationSeconds: parseDurationToSeconds(item.duration),
    thumbnails: Array.isArray(item.thumbnails) ? item.thumbnails : [],
    type: item.type || 'UNKNOWN'
  };
}

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory storage for rooms
// Structure: { roomId: { videoId, currentTrack, queue: [], isPlaying, currentTime, host, users: Set } }
const rooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// -----------------------------
// YouTube Music proxy endpoints
// -----------------------------

// Search YouTube Music
// GET /api/ytmusic/search?q=...&limit=20&filter=songs|videos|all
app.get('/api/ytmusic/search', async (req, res) => {
  try {
    const { q, limit = 20, filter = 'songs' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const client = await getYTMusicClient();

    let results;
    const numericLimit = Math.min(Number(limit) || 20, 50);

    if (filter === 'videos') {
      results = await client.searchVideos(String(q));
    } else if (filter === 'all') {
      results = await client.search(String(q));
    } else {
      // default: songs
      results = await client.searchSongs(String(q));
    }

    const mapped = (Array.isArray(results) ? results : [])
      .map(mapSearchItemToTrack)
      .filter(Boolean)
      .slice(0, numericLimit);

    res.json({ collection: mapped });
  } catch (error) {
    console.error('YTMusic search error:', error);
    res.status(500).json({ error: 'Failed to search YouTube Music' });
  }
});

// Get video details
// GET /api/ytmusic/video?videoId=...
app.get('/api/ytmusic/video', async (req, res) => {
  try {
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId parameter required' });
    }

    const client = await getYTMusicClient();
    const data = await client.getVideo(String(videoId));

    // Normalize to the same track shape used by the client UI.
    const mapped = mapSearchItemToTrack({
      videoId: data?.videoId || String(videoId),
      name: data?.name || data?.title || 'Unknown Title',
      artist: { name: data?.artist?.name || data?.author?.name || 'Unknown Artist' },
      duration: data?.duration,
      thumbnails: data?.thumbnails,
      type: data?.type || 'VIDEO'
    });

    res.json(mapped || { videoId: String(videoId) });
  } catch (error) {
    console.error('YTMusic getVideo error:', error);
    res.status(500).json({ error: 'Failed to get video details' });
  }
});

// Get search suggestions
// GET /api/ytmusic/suggestions?q=...
app.get('/api/ytmusic/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const client = await getYTMusicClient();
    const suggestions = await client.getSearchSuggestions(String(q));
    res.json({ suggestions: Array.isArray(suggestions) ? suggestions : [] });
  } catch (error) {
    console.error('YTMusic suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get room info endpoint
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    roomId,
    videoId: room.videoId,
    isPlaying: room.isPlaying,
    currentTime: room.currentTime,
    userCount: room.users.size
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create or join a room
  socket.on('join-room', ({ roomId, videoId, username }) => {
    console.log(`User ${socket.id} (${username || 'Anonymous'}) joining room: ${roomId}`);

    // Default video ID if none provided (Rick Astley - Never Gonna Give You Up)
    const finalVideoId = videoId || 'lYBUbBu4W08';
    const userName = username || 'Anonymous';

    // Leave any previous rooms
    const previousRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    previousRooms.forEach(room => {
      socket.leave(room);
      const roomData = rooms.get(room);
      if (roomData) {
        roomData.users.delete(socket.id);
        roomData.userNames.delete(socket.id);
        // Notify others in the room
        const usersList = Array.from(roomData.users).map(id => ({
          id,
          name: roomData.userNames.get(id) || 'Anonymous'
        }));
        io.to(room).emit('user-count', { count: roomData.users.size, users: usersList });

        // Clean up empty rooms
        if (roomData.users.size === 0) {
          rooms.delete(room);
        }
      }
    });

    // Join the new room
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        videoId: finalVideoId,
        currentTrack: null,
        queue: [],
        isPlaying: false,
        currentTime: 0,
        host: socket.id,
        users: new Set([socket.id]),
        userNames: new Map([[socket.id, userName]]),
        lastUpdate: Date.now()
      });
      console.log(`Room ${roomId} created by ${socket.id}`);
    } else {
      const room = rooms.get(roomId);
      room.users.add(socket.id);
      room.userNames.set(socket.id, userName);
    }

    const room = rooms.get(roomId);

    // Build users list with names
    const usersList = Array.from(room.users).map(id => ({
      id,
      name: room.userNames.get(id) || 'Anonymous'
    }));

    // Send current room state to the joining user
    socket.emit('room-state', {
      roomId,
      videoId: room.videoId,
      currentTrack: room.currentTrack,
      queue: room.queue,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      isHost: room.host === socket.id,
      userCount: room.users.size,
      users: usersList,
      timestamp: Date.now()
    });

    // Notify all users in the room about the new user count and users list
    io.to(roomId).emit('user-count', { count: room.users.size, users: usersList });

    console.log(`Room ${roomId} now has ${room.users.size} users`);
  });

  // Handle play action
  socket.on('play', ({ roomId, time }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.isPlaying = true;
    room.currentTime = time;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Play at ${time}s`);

    // Broadcast to all users in the room except sender
    socket.to(roomId).emit('play', { time });
  });

  // Handle pause action
  socket.on('pause', ({ roomId, time }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.isPlaying = false;
    room.currentTime = time;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Pause at ${time}s`);

    // Broadcast to all users in the room except sender
    socket.to(roomId).emit('pause', { time });
  });

  // Handle seek action
  socket.on('seek', ({ roomId, time, isPlaying }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.currentTime = time;
    room.isPlaying = isPlaying !== undefined ? isPlaying : room.isPlaying;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Seek to ${time}s (playing: ${room.isPlaying})`);

    // Broadcast to all users in the room except sender, including playback state
    socket.to(roomId).emit('seek', { time, isPlaying: room.isPlaying });
  });

  // Handle video change
  socket.on('change-video', ({ roomId, videoId, track }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.videoId = videoId;
    room.currentTrack = track || null;
    room.currentTime = 0;
    room.isPlaying = false;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Video changed to ${videoId} by ${socket.id}`);

    // Broadcast to ALL users in the room including sender for consistency
    io.to(roomId).emit('video-changed', { videoId, track });
  });

  // Handle time sync (for drift correction)
  socket.on('sync-time', ({ roomId, time, isPlaying }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Only allow host to sync time
    if (room.host !== socket.id) return;

    room.currentTime = time;
    room.isPlaying = isPlaying;
    room.lastUpdate = Date.now();

    // Broadcast current time to all clients except sender
    socket.to(roomId).emit('time-update', {
      time,
      isPlaying,
      timestamp: Date.now()
    });
  });

  // Queue Management
  socket.on('add-to-queue', ({ roomId, track }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.queue.push(track);
    console.log(`Room ${roomId}: Track added to queue by ${socket.id}`);

    // Broadcast queue update to all users
    io.to(roomId).emit('queue-updated', { queue: room.queue });
  });

  socket.on('remove-from-queue', ({ roomId, index }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (index >= 0 && index < room.queue.length) {
      room.queue.splice(index, 1);
      console.log(`Room ${roomId}: Track removed from queue at index ${index}`);

      // Broadcast queue update to all users
      io.to(roomId).emit('queue-updated', { queue: room.queue });
    }
  });

  socket.on('clear-queue', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.queue = [];
    console.log(`Room ${roomId}: Queue cleared by ${socket.id}`);

    // Broadcast queue update to all users
    io.to(roomId).emit('queue-updated', { queue: room.queue });
  });

  socket.on('play-from-queue', ({ roomId, index }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (index >= 0 && index < room.queue.length) {
      const track = room.queue[index];
      room.currentTrack = track;
      room.videoId = track.videoId;
      room.currentTime = 0;
      room.isPlaying = true;
      room.lastUpdate = Date.now();

      console.log(`Room ${roomId}: Playing track from queue at index ${index}`);

      // Broadcast video change to all users
      io.to(roomId).emit('video-changed', { videoId: track.videoId, track });
    }
  });

  socket.on('next-track', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.queue.length === 0) return;

    // Play first track from queue and remove it
    const track = room.queue.shift();
    room.currentTrack = track;
    room.videoId = track.videoId;
    room.currentTime = 0;
    room.isPlaying = true;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Playing next track from queue`);

    // Broadcast video change and queue update to all users
    io.to(roomId).emit('video-changed', { videoId: track.videoId, track });
    io.to(roomId).emit('queue-updated', { queue: room.queue });
  });

  socket.on('update-current-track', ({ roomId, track }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.currentTrack = track;
    room.videoId = track.videoId;
    console.log(`Room ${roomId}: Current track updated`);

    // Broadcast to all users
    io.to(roomId).emit('current-track-updated', { track });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        room.userNames.delete(socket.id);

        // If host disconnected, assign new host
        if (room.host === socket.id && room.users.size > 0) {
          const newHost = Array.from(room.users)[0];
          room.host = newHost;
          io.to(newHost).emit('host-assigned');
          console.log(`Room ${roomId}: New host assigned - ${newHost}`);
        }

        // Build users list with names
        const usersList = Array.from(room.users).map(id => ({
          id,
          name: room.userNames.get(id) || 'Anonymous'
        }));
        io.to(roomId).emit('user-count', { count: room.users.size, users: usersList });

        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    });
  });

  // Handle chat messages
  socket.on('send-message', ({ roomId, message, username }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const chatMessage = {
      id: `${socket.id}-${Date.now()}`,
      userId: socket.id,
      username: username || 'Anonymous',
      message: message,
      timestamp: Date.now()
    };

    console.log(`Room ${roomId}: Message from ${username}: ${message}`);

    // Broadcast to all users in the room including sender
    io.to(roomId).emit('new-message', chatMessage);
  });

  // Handle explicit leave room
  socket.on('leave-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.users.has(socket.id)) {
      socket.leave(roomId);
      room.users.delete(socket.id);
      room.userNames.delete(socket.id);

      // If host left, assign new host
      if (room.host === socket.id && room.users.size > 0) {
        const newHost = Array.from(room.users)[0];
        room.host = newHost;
        io.to(newHost).emit('host-assigned');
      }

      // Build users list with names
      const usersList = Array.from(room.users).map(id => ({
        id,
        name: room.userNames.get(id) || 'Anonymous'
      }));
      io.to(roomId).emit('user-count', { count: room.users.size, users: usersList });

      // Clean up empty rooms
      if (room.users.size === 0) {
        rooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
