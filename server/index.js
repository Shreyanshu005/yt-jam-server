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

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory storage for rooms
// Structure: { roomId: { videoId, isPlaying, currentTime, host, users: Set } }
const rooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
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
  socket.on('join-room', ({ roomId, videoId = 'dQw4w9WgXcQ' }) => {
    console.log(`User ${socket.id} joining room: ${roomId}`);

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
        videoId: videoId,
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
      videoId: room.videoId,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      isHost: room.host === socket.id,
      userCount: room.users.size
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

  // Handle video change (anyone can change)
  socket.on('change-video', ({ roomId, videoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.videoId = videoId;
    room.currentTime = 0;
    room.isPlaying = false;
    room.lastUpdate = Date.now();

    console.log(`Room ${roomId}: Video changed to ${videoId} by ${socket.id}`);

    // Broadcast to all users in the room EXCEPT sender (sender already updated locally)
    socket.to(roomId).emit('video-changed', { videoId });
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
