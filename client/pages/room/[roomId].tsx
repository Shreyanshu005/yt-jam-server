import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import YouTubePlayer from '@/components/YouTubePlayer';
import Chat from '@/components/Chat';
import { getSocket } from '@/lib/socket';
import { extractVideoId } from '@/lib/youtube';

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

// YouTube Player States
const YT_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

export default function RoomPage() {
  const router = useRouter();
  const { roomId, videoId: queryVideoId } = router.query;

  const [videoId, setVideoId] = useState<string>('dQw4w9WgXcQ'); // Default video
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingRoomState, setPendingRoomState] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const playerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const syncIntervalRef = useRef<any>(null);
  const ignoreNextStateChange = useRef<boolean>(false);
  const lastSyncTime = useRef<number>(0);
  const lastKnownTime = useRef<number>(0);
  const isPlayingBeforeSeek = useRef<boolean>(false);
  const seekDetectionInterval = useRef<any>(null);
  const justJoinedRoom = useRef<boolean>(false);

  const DRIFT_THRESHOLD = 1.0; // seconds (increased to reduce over-correction)
  const SYNC_INTERVAL = 5000; // 5 seconds (less frequent checks)

  // Sync to room state helper function
  const syncToRoomState = useCallback((data: any) => {
    if (!playerRef.current) return;

    console.log('Syncing to room state:', data);
    ignoreNextStateChange.current = true;
    lastSyncTime.current = Date.now();

    // Calculate actual time accounting for network delay
    let targetTime = data.currentTime || 0;

    if (data.isPlaying && data.timestamp) {
      // Calculate elapsed time since the room state was sent
      const now = Date.now();
      const elapsed = (now - data.timestamp) / 1000; // Convert to seconds
      targetTime = data.currentTime + elapsed;
      console.log(`Syncing with time adjustment: base=${data.currentTime}s + elapsed=${elapsed.toFixed(2)}s = ${targetTime.toFixed(2)}s`);
    } else {
      console.log('Syncing to time:', targetTime, 's');
    }

    lastKnownTime.current = targetTime;

    // Seek to calculated time
    if (targetTime > 0) {
      playerRef.current.seekTo(targetTime, true);
    }

    // Always try to play if video should be playing
    if (data.isPlaying) {
      console.log('Force-playing video for new joiner');

      // Immediate play attempt
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.playVideo();
          console.log('Immediate play attempt');
        }
      }, 100);

      // Second attempt
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.playVideo();
          console.log('Second play attempt');
        }
      }, 500);

      // Third attempt - force it
      setTimeout(() => {
        if (playerRef.current) {
          const state = playerRef.current.getPlayerState();
          if (state !== 1) { // Not playing
            playerRef.current.playVideo();
            console.log('Third play attempt (was in state:', state, ')');
          }
        }
      }, 1000);
    }

    // Clear the ignore flag after all attempts
    setTimeout(() => {
      ignoreNextStateChange.current = false;
    }, 1500);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Use query param video ID if provided
    const initialVideoId = (queryVideoId as string) || videoId;
    if (queryVideoId) {
      setVideoId(queryVideoId as string);
    }

    // Join room immediately if already connected, or wait for connection
    if (socket.connected) {
      setIsConnected(true);
      console.log('Already connected to server, joining room...');
      socket.emit('join-room', { roomId, videoId: initialVideoId });
    } else {
      console.log('Waiting for connection...');
    }

    socket.on('connect', () => {
      setIsConnected(true);
      setUserId(socket.id || '');
      console.log('Connected to server');

      // Generate username if not set
      if (!username) {
        const randomName = `User${Math.floor(Math.random() * 1000)}`;
        setUsername(randomName);
      }

      // Join the room with initial video ID
      socket.emit('join-room', { roomId, videoId: initialVideoId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    // Safety timeout - if room-state doesn't arrive, stop loading anyway
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout - showing room anyway');
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout

    // Receive initial room state
    socket.on('room-state', (data: any) => {
      console.log('Room state received:', data);
      clearTimeout(loadingTimeout);
      setVideoId(data.videoId);
      setIsHost(data.isHost);
      setUserCount(data.userCount);
      setIsLoading(false);

      // Mark that we just joined to prevent emitting events immediately
      justJoinedRoom.current = true;
      setTimeout(() => {
        justJoinedRoom.current = false;
        console.log('Join grace period ended - can now emit events');
      }, 2000); // 2 second grace period after joining (reduced for faster interaction)

      // If player is ready, sync immediately. Otherwise, save for later
      if (playerRef.current) {
        syncToRoomState(data);
      } else {
        console.log('Player not ready yet, saving room state for later');
        setPendingRoomState(data);
      }
    });

    // User count updates
    socket.on('user-count', (data: any) => {
      setUserCount(data.count);
    });

    // Host assignment
    socket.on('host-assigned', () => {
      setIsHost(true);
      console.log('You are now the host');
    });

    // Play event from other users
    socket.on('play', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time, true);
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.playVideo();
          }
        }, 50);

        // Clear the ignore flag after playback starts
        setTimeout(() => {
          ignoreNextStateChange.current = false;
        }, 500);
      }
    });

    // Pause event from other users
    socket.on('pause', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time, true);
        playerRef.current.pauseVideo();

        // Clear the ignore flag after pause completes
        setTimeout(() => {
          ignoreNextStateChange.current = false;
        }, 500);
      }
    });

    // Seek event from other users
    socket.on('seek', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now(); // Prevent immediate re-sync
        playerRef.current.seekTo(data.time, true);

        // Resume playback if it was playing before the seek
        if (data.isPlaying) {
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.playVideo();
            }
          }, 100);
        }

        // Clear the ignore flag after a delay
        setTimeout(() => {
          ignoreNextStateChange.current = false;
        }, 300);
      }
    });

    // Video changed by anyone
    socket.on('video-changed', (data: any) => {
      console.log('Video changed to:', data.videoId);
      setVideoId(data.videoId);
      setInputUrl('');
      setPlayerError(null);

      // Reset player state to prevent seek detection during load
      lastKnownTime.current = 0;
      lastSyncTime.current = Date.now();
      ignoreNextStateChange.current = true;

      // Clear ignore flag after video loads (longer delay for video change)
      setTimeout(() => {
        ignoreNextStateChange.current = false;
        lastKnownTime.current = 0; // Reset again after load
      }, 2000);
    });

    // Disabled automatic drift correction to prevent stuttering
    // Everyone controls playback directly, no need for continuous sync
    // socket.on('time-update', ...) - REMOVED

    // Chat message received
    socket.on('new-message', (message: Message) => {
      console.log('New message received:', message);
      setMessages((prev) => [...prev, message]);
    });

    // Cleanup
    return () => {
      clearTimeout(loadingTimeout);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (seekDetectionInterval.current) {
        clearInterval(seekDetectionInterval.current);
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room-state');
      socket.off('user-count');
      socket.off('host-assigned');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
      socket.off('video-changed');
      socket.off('time-update');
      socket.off('new-message');

      // Leave room on unmount
      if (roomId) {
        socket.emit('leave-room', { roomId });
      }
    };
  }, [roomId, isHost, videoId, queryVideoId]);

  // Player ready callback
  const handlePlayerReady = useCallback((player: any) => {
    console.log('Player ready');
    playerRef.current = player;

    // Apply pending room state if exists
    if (pendingRoomState) {
      console.log('Applying pending room state');
      syncToRoomState(pendingRoomState);
      setPendingRoomState(null);
    }

    // Start monitoring for manual seeks
    if (seekDetectionInterval.current) {
      clearInterval(seekDetectionInterval.current);
    }

    seekDetectionInterval.current = setInterval(() => {
      if (!playerRef.current || !socketRef.current || !roomId) return;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        const playerState = playerRef.current.getPlayerState();

        // Detect manual seek: time jumped more than 1.5 seconds
        const timeDiff = Math.abs(currentTime - lastKnownTime.current);
        const now = Date.now();

        // Only detect seeks if:
        // 1. Time jumped significantly (>1.5s)
        // 2. Not ignoring state changes (not from network sync)
        // 3. At least 500ms since last sync (debounce)
        if (timeDiff > 1.5 && !ignoreNextStateChange.current && (now - lastSyncTime.current) > 500) {
          const isCurrentlyPlaying = playerState === YT_STATES.PLAYING || playerState === YT_STATES.BUFFERING;

          console.log(`Manual seek detected: ${lastKnownTime.current.toFixed(1)}s -> ${currentTime.toFixed(1)}s (playing: ${isCurrentlyPlaying})`);

          // Ignore subsequent state changes for 1 second to prevent pause event during seek
          ignoreNextStateChange.current = true;
          setTimeout(() => {
            ignoreNextStateChange.current = false;
          }, 1000);

          // Emit seek event with current playing state
          socketRef.current.emit('seek', {
            roomId,
            time: currentTime,
            isPlaying: isCurrentlyPlaying
          });

          // Update sync time and last known time immediately to prevent loop
          lastSyncTime.current = now;
          lastKnownTime.current = currentTime;
        } else {
          // Normal playback - update lastKnownTime gradually
          lastKnownTime.current = currentTime;
        }
      } catch (error) {
        // Player might not be fully ready yet
      }
    }, 200); // Check every 200ms for seeks
  }, [roomId, pendingRoomState, syncToRoomState]);

  // Player state change callback
  const handleStateChange = useCallback((event: any) => {
    if (ignoreNextStateChange.current) {
      console.log('State change ignored (ignoreNextStateChange flag set)');
      return; // Don't reset the flag - let setTimeout handle it
    }

    // Don't emit events if we just joined (prevents restarting video for everyone)
    if (justJoinedRoom.current) {
      console.log('State change ignored (just joined room, in grace period)');
      return;
    }

    if (!socketRef.current || !roomId) return;

    const state = event.data;
    const currentTime = playerRef.current?.getCurrentTime() || 0;

    // Ignore buffering states - they cause sync loops
    if (state === YT_STATES.BUFFERING) {
      console.log('Buffering... (ignored)');
      return;
    }

    // Throttle events to prevent spam
    const now = Date.now();
    if (now - lastSyncTime.current < 1000) {
      console.log('State change throttled');
      return;
    }
    lastSyncTime.current = now;

    switch (state) {
      case YT_STATES.PLAYING:
        console.log('Emitting play event at', currentTime, 's');
        socketRef.current.emit('play', { roomId, time: currentTime });
        break;

      case YT_STATES.PAUSED:
        console.log('Emitting pause event at', currentTime, 's');
        socketRef.current.emit('pause', { roomId, time: currentTime });
        break;
    }
  }, [roomId]);

  // Player error callback
  const handlePlayerError = useCallback((event: any) => {
    const errorCode = event.data;
    const errorMessages: { [key: number]: string } = {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found or private',
      101: 'Video not allowed to be played in embedded players',
      150: 'Video not allowed to be played in embedded players',
    };

    const errorMsg = errorMessages[errorCode] || `Unknown error: ${errorCode}`;
    setPlayerError(errorMsg);
    console.error('Player error:', errorMsg);
  }, []);

  // Change video (anyone can change)
  const handleChangeVideo = () => {
    if (!inputUrl.trim()) {
      alert('Please enter a YouTube URL or video ID');
      return;
    }

    const newVideoId = extractVideoId(inputUrl.trim());
    if (!newVideoId) {
      alert('Invalid YouTube URL or video ID. Please enter a valid YouTube link or 11-character video ID.');
      return;
    }

    if (socketRef.current && roomId) {
      console.log('Changing video to:', newVideoId);

      // Update locally immediately
      setVideoId(newVideoId);
      setInputUrl('');
      setPlayerError(null);

      // Reset tracking to prevent seek detection during video load
      lastKnownTime.current = 0;
      lastSyncTime.current = Date.now();
      ignoreNextStateChange.current = true;

      // Clear ignore flag after video loads (longer delay for video change)
      setTimeout(() => {
        ignoreNextStateChange.current = false;
        lastKnownTime.current = 0; // Reset again after load
      }, 2000);

      // Broadcast to others
      socketRef.current.emit('change-video', { roomId, videoId: newVideoId });
    }
  };

  // Copy room link
  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      alert('✅ Room link copied!\n\nShare this link with friends to watch together.');
    }).catch(() => {
      // Fallback if clipboard API fails
      alert(`Copy this link:\n\n${link}`);
    });
  };

  // Send chat message
  const handleSendMessage = (message: string) => {
    if (socketRef.current && roomId && message.trim()) {
      socketRef.current.emit('send-message', {
        roomId,
        message: message.trim(),
        username: username || 'Anonymous'
      });
    }
  };

  if (!roomId || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">
            {!roomId ? 'Loading room...' : 'Connecting to room...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-500">YouTube Sync</h1>
              <p className="text-sm text-gray-400">Room: {roomId}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm bg-gray-800 px-4 py-2 rounded-lg">
                👥 {userCount} {userCount === 1 ? 'person' : 'people'}
              </div>
              {isHost && (
                <div className="text-sm bg-red-600 px-4 py-2 rounded-lg font-semibold">
                  HOST
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Video and Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Player */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <YouTubePlayer
                  videoId={videoId}
                  onReady={handlePlayerReady}
                  onStateChange={handleStateChange}
                  onError={handlePlayerError}
                />
                {playerError && (
                  <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400">⚠️ {playerError}</p>
                  </div>
                )}
              </div>

          {/* Controls */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Room Controls</h2>

            {/* Change Video */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                🎬 Change Video {isHost && '(You are Host)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste YouTube URL or video ID (e.g., dQw4w9WgXcQ)"
                  className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleChangeVideo();
                    }
                  }}
                />
                <button
                  onClick={handleChangeVideo}
                  disabled={!inputUrl.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
                >
                  Change
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Current: <span className="text-gray-400 font-mono">{videoId}</span>
                </p>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Open on YouTube ↗
                </a>
              </div>
              <p className="text-xs text-green-400 mt-2">
                💡 Anyone in the room can change the video, play, pause, or seek!
              </p>
            </div>

            {/* Share Room */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Share Room Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  readOnly
                  className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-400"
                />
                <button
                  onClick={copyRoomLink}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400">
                ℹ️ {isHost
                  ? 'You are the host (first to join). Everyone can control playback!'
                  : 'You are a participant. Everyone can play, pause, seek, and change videos!'}
              </p>
              {userCount > 1 && (
                <p className="text-sm text-green-400 mt-2">
                  ✨ You're watching with {userCount - 1} other{' '}
                  {userCount - 1 === 1 ? 'person' : 'people'}!
                </p>
              )}
              <p className="text-sm text-blue-400 mt-2">
                🎮 All controls are synced in real-time across all viewers
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ← Leave Room
          </button>
        </div>
      </main>
    </div>
  );
}
