const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// SoundCloud API token management
let soundcloudToken = null;
let tokenExpiry = 0;

async function getSoundCloudToken() {
  // Return cached token if still valid
  if (soundcloudToken && Date.now() < tokenExpiry) {
    return soundcloudToken;
  }

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SoundCloud credentials not configured');
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://secure.soundcloud.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    soundcloudToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    console.log('✅ SoundCloud token obtained');
    return soundcloudToken;
  } catch (error) {
    console.error('❌ Failed to get SoundCloud token:', error);
    throw error;
  }
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
// Structure: { roomId: { trackUrl, currentTrack, queue: [], isPlaying, currentTime, host, users: Set } }
const rooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// SoundCloud API proxy endpoints
app.get('/api/soundcloud/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    // Try to use user token from header, fallback to app token
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    const token = userToken || await getSoundCloudToken();

    const response = await fetch(
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&limit=${limit}`,
      {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`SoundCloud API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

app.get('/api/soundcloud/resolve', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Try to use user token from header, fallback to app token
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    const token = userToken || await getSoundCloudToken();

    const response = await fetch(
      `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`SoundCloud API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Resolve error:', error);
    res.status(500).json({ error: 'Failed to resolve track' });
  }
});

app.get('/api/soundcloud/charts', async (req, res) => {
  try {
    const { genre, limit = 20 } = req.query;

    // Try to use user token from header, fallback to app token
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    const token = userToken || await getSoundCloudToken();

    let url = `https://api-v2.soundcloud.com/charts?kind=top&limit=${limit}`;
    if (genre) {
      url += `&genre=${encodeURIComponent(genre)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `OAuth ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`SoundCloud API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Charts error:', error);
    res.status(500).json({ error: 'Failed to get charts' });
  }
});

// OAuth callback endpoint - exchange code for tokens
app.post('/api/auth/callback', async (req, res) => {
  try {
    const { code, code_verifier } = req.body;

    if (!code || !code_verifier) {
      return res.status(400).json({ error: 'Missing code or code_verifier' });
    }

    const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
    const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Server not configured' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://secure.soundcloud.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
        code_verifier: code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return res.status(tokenResponse.status).json({ error: 'Token exchange failed' });
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch('https://api.soundcloud.com/me', {
      headers: {
        'Authorization': `OAuth ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch user info' });
    }

    const userData = await userResponse.json();

    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      user: {
        id: userData.id,
        username: userData.username,
        avatar_url: userData.avatar_url,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
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
    trackUrl: room.trackUrl,
    isPlaying: room.isPlaying,
    currentTime: room.currentTime,
    userCount: room.users.size
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create or join a room
  socket.on('join-room', ({ roomId, trackUrl = 'https://soundcloud.com/21savage/a-lot-feat-j-cole', videoId }) => {
    console.log(`User ${socket.id} joining room: ${roomId}`);

    // Support backward compatibility - if videoId is provided instead of trackUrl
    const finalTrackUrl = trackUrl || videoId || 'https://soundcloud.com/21savage/a-lot-feat-j-cole';

    // Leave any previous rooms
    const previousRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    previousRooms.forEach(room => {
      socket.leave(room);
      const roomData = rooms.get(room);
      if (roomData) {
        roomData.users.delete(socket.id);
        // Notify others in the room
        io.to(room).emit('user-count', { count: roomData.users.size });

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
        trackUrl: finalTrackUrl,
        currentTrack: null,
        queue: [],
        isPlaying: false,
        currentTime: 0,
        host: socket.id,
        users: new Set([socket.id]),
        lastUpdate: Date.now()
      });
      console.log(`Room ${roomId} created by ${socket.id}`);
    } else {
      const room = rooms.get(roomId);
      room.users.add(socket.id);
    }

    const room = rooms.get(roomId);

    // Send current room state to the joining user
    socket.emit('room-state', {
      roomId,
      trackUrl: room.trackUrl,
      currentTrack: room.currentTrack,
      queue: room.queue,
      videoId: room.trackUrl, // Backward compatibility
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      isHost: room.host === socket.id,
      userCount: room.users.size,
      timestamp: Date.now() // Add timestamp for sync calculation
    });

    // Notify all users in the room about the new user count
    io.to(roomId).emit('user-count', { count: room.users.size });

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

  // Handle track change (anyone can change)
  socket.on('change-track', ({ roomId, trackUrl }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.trackUrl = trackUrl;
    room.currentTime = 0;
    room.isPlaying = false;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Track changed to ${trackUrl} by ${socket.id}`);

    // Broadcast to ALL users in the room including sender for consistency
    io.to(roomId).emit('track-changed', { trackUrl });
  });

  // Handle video change (backward compatibility)
  socket.on('change-video', ({ roomId, videoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.trackUrl = videoId;
    room.currentTime = 0;
    room.isPlaying = false;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Track changed to ${videoId} by ${socket.id} (via change-video)`);

    // Broadcast to ALL users in the room including sender for consistency
    io.to(roomId).emit('video-changed', { videoId, trackUrl: videoId });
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
      room.trackUrl = track.permalink_url;
      room.currentTime = 0;
      room.isPlaying = true;
      room.lastUpdate = Date.now();

      console.log(`Room ${roomId}: Playing track from queue at index ${index}`);

      // Broadcast track change to all users
      io.to(roomId).emit('track-changed', {
        trackUrl: track.permalink_url,
        track: track
      });
    }
  });

  socket.on('next-track', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.queue.length === 0) return;

    // Play first track from queue and remove it
    const track = room.queue.shift();
    room.currentTrack = track;
    room.trackUrl = track.permalink_url;
    room.currentTime = 0;
    room.isPlaying = true;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Playing next track from queue`);

    // Broadcast track change and queue update to all users
    io.to(roomId).emit('track-changed', {
      trackUrl: track.permalink_url,
      track: track
    });
    io.to(roomId).emit('queue-updated', { queue: room.queue });
  });

  socket.on('update-current-track', ({ roomId, track }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.currentTrack = track;
    room.trackUrl = track.permalink_url;
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

        // If host disconnected, assign new host
        if (room.host === socket.id && room.users.size > 0) {
          const newHost = Array.from(room.users)[0];
          room.host = newHost;
          io.to(newHost).emit('host-assigned');
          console.log(`Room ${roomId}: New host assigned - ${newHost}`);
        }

        // Notify remaining users
        io.to(roomId).emit('user-count', { count: room.users.size });

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

      // If host left, assign new host
      if (room.host === socket.id && room.users.size > 0) {
        const newHost = Array.from(room.users)[0];
        room.host = newHost;
        io.to(newHost).emit('host-assigned');
      }

      io.to(roomId).emit('user-count', { count: room.users.size });

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
