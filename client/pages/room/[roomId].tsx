import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import YouTubePlayer from '@/components/YouTubePlayer';
import { getSocket } from '@/lib/socket';
import { extractVideoId } from '@/lib/youtube';

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

  const playerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const syncIntervalRef = useRef<any>(null);
  const ignoreNextStateChange = useRef<boolean>(false);
  const lastSyncTime = useRef<number>(0);

  const DRIFT_THRESHOLD = 1.0; // seconds (increased to reduce over-correction)
  const SYNC_INTERVAL = 5000; // 5 seconds (less frequent checks)

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
      console.log('Connected to server');

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

      // Sync to current state
      if (playerRef.current && data.currentTime > 0) {
        ignoreNextStateChange.current = true;
        playerRef.current.seekTo(data.currentTime, true);

        if (data.isPlaying) {
          setTimeout(() => {
            playerRef.current.playVideo();
          }, 100);
        }
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
        playerRef.current.seekTo(data.time, true);
        setTimeout(() => {
          playerRef.current.playVideo();
        }, 50);
      }
    });

    // Pause event from other users
    socket.on('pause', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        playerRef.current.seekTo(data.time, true);
        playerRef.current.pauseVideo();
      }
    });

    // Seek event from other users
    socket.on('seek', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        playerRef.current.seekTo(data.time, true);
      }
    });

    // Video changed by host
    socket.on('video-changed', (data: any) => {
      console.log('Video changed to:', data.videoId);
      setVideoId(data.videoId);
      setInputUrl('');
    });

    // Disabled automatic drift correction to prevent stuttering
    // Everyone controls playback directly, no need for continuous sync
    // socket.on('time-update', ...) - REMOVED

    // Cleanup
    return () => {
      clearTimeout(loadingTimeout);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
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

    // Disable automatic drift correction - everyone controls playback directly
    // This prevents the stuttering/seeking issues
    // Users sync naturally through play/pause/seek events
  }, [roomId, isHost]);

  // Player state change callback
  const handleStateChange = useCallback((event: any) => {
    if (ignoreNextStateChange.current) {
      ignoreNextStateChange.current = false;
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
      return;
    }
    lastSyncTime.current = now;

    switch (state) {
      case YT_STATES.PLAYING:
        console.log('Emitting play event');
        socketRef.current.emit('play', { roomId, time: currentTime });
        break;

      case YT_STATES.PAUSED:
        console.log('Emitting pause event');
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
      socketRef.current.emit('change-video', { roomId, videoId: newVideoId });
      setInputUrl('');
      setPlayerError(null);
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
        <div className="max-w-5xl mx-auto space-y-6">
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
