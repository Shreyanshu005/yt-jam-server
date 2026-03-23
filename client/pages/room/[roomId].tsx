import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import YouTubePlayer, { YouTubePlayerRef } from '@/components/YouTubePlayer';
import TrackSearch from '@/components/TrackSearch';
import QueuePanel from '@/components/QueuePanel';
import PlayerControls from '@/components/PlayerControls';
import Chat from '@/components/Chat';
import Toast, { ToastMessage } from '@/components/Toast';
import { getSocket } from '@/lib/socket';
import { YTTrack } from '@/lib/ytmusicAPI';

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export default function RoomPage() {
  const router = useRouter();
  const { roomId, videoId: queryVideoId } = router.query;

  const [videoId, setVideoId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<YTTrack | null>(null);
  const [queue, setQueue] = useState<YTTrack[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingRoomState, setPendingRoomState] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);

  const playerRef = useRef<YouTubePlayerRef | null>(null);
  const socketRef = useRef<any>(null);
  const ignoreNextStateChange = useRef<boolean>(false);
  const lastSyncTime = useRef<number>(0);
  const lastKnownTime = useRef<number>(0);
  const seekDetectionInterval = useRef<any>(null);
  const justJoinedRoom = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);

  // Toast helpers
  const addToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync to room state helper function
  const syncToRoomState = useCallback((data: any) => {
    if (!playerRef.current) return;

    console.log('Syncing to room state:', data);
    ignoreNextStateChange.current = true;
    lastSyncTime.current = Date.now();

    let targetTime = data.currentTime || 0;

    if (data.isPlaying && data.timestamp) {
      const now = Date.now();
      const elapsed = (now - data.timestamp) / 1000;
      targetTime = data.currentTime + elapsed;
    }

    lastKnownTime.current = targetTime;
    playerRef.current.seekTo(targetTime);

    if (data.isPlaying) {
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.play();
        }
      }, 100);
    } else {
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.pause();
        }
      }, 100);
    }

    setTimeout(() => {
      ignoreNextStateChange.current = false;
    }, 1500);
  }, []);

  // Check for stored username on mount
  useEffect(() => {
    if (!roomId) return;
    
    const storedUsername = localStorage.getItem('ytjam_username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setShowNamePrompt(true);
    }
  }, [roomId]);

  // Initialize socket connection when username is available
  useEffect(() => {
    if (!roomId || !username) return;

    const socket = getSocket();
    socketRef.current = socket;

    const initialVideoId = (queryVideoId as string) || null;

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join-room', { roomId, videoId: initialVideoId, username });
    }

    socket.on('connect', () => {
      setIsConnected(true);
      setUserId(socket.id || '');
      socket.emit('join-room', { roomId, videoId: initialVideoId, username });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);

    socket.on('room-state', (data: any) => {
      console.log('Room state received:', data);
      clearTimeout(loadingTimeout);
      setVideoId(data.videoId || null);
      setCurrentTrack(data.currentTrack || null);
      setQueue(data.queue || []);
      setIsHost(data.isHost);
      setUserCount(data.userCount);
      if (data.users) {
        setUsers(data.users);
      }
      setIsLoading(false);

      justJoinedRoom.current = true;
      setTimeout(() => {
        justJoinedRoom.current = false;
      }, 2000);

      if (playerRef.current) {
        syncToRoomState(data);
      } else {
        setPendingRoomState(data);
      }
    });

    socket.on('user-count', (data: any) => {
      setUserCount(data.count);
      if (data.users) {
        setUsers(data.users);
      }
    });

    socket.on('host-assigned', () => {
      setIsHost(true);
    });

    socket.on('play', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time);
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.play();
          }
        }, 50);

        setTimeout(() => {
          ignoreNextStateChange.current = false;
        }, 500);
      }
    });

    socket.on('pause', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time);
        playerRef.current.pause();

        setTimeout(() => {
          ignoreNextStateChange.current = false;
        }, 500);
      }
    });

    socket.on('seek', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time);

        if (data.isPlaying) {
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.play();
            }
          }, 100);
        }

        setTimeout(() => {
          ignoreNextStateChange.current = false;
        }, 300);
      }
    });

    socket.on('video-changed', (data: any) => {
      console.log('Video changed:', data);
      setVideoId(data.videoId);
      if (data.track) {
        setCurrentTrack(data.track);
      }
      setPlayerError(null);

      lastKnownTime.current = 0;
      lastSyncTime.current = Date.now();
      ignoreNextStateChange.current = true;

      setTimeout(() => {
        ignoreNextStateChange.current = false;
        lastKnownTime.current = 0;
      }, 2000);
    });

    // Queue events
    socket.on('queue-updated', (data: any) => {
      console.log('Queue updated:', data.queue);
      setQueue(data.queue || []);
    });

    socket.on('current-track-updated', (data: any) => {
      console.log('Current track updated:', data.track);
      setCurrentTrack(data.track);
    });

    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      // Show toast notification for messages from others
      if (message.userId !== socket.id) {
        addToast(`${message.username}`, message.message, 'info');
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
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
      socket.off('queue-updated');
      socket.off('current-track-updated');
      socket.off('new-message');

      if (roomId) {
        socket.emit('leave-room', { roomId });
      }
    };
  }, [roomId, queryVideoId, username, isLoading, syncToRoomState]);

  // Player ready callback
  const handlePlayerReady = useCallback((player: YouTubePlayerRef) => {
    console.log('YouTube Player ready');
    playerRef.current = player;

    if (pendingRoomState) {
      syncToRoomState(pendingRoomState);
      setPendingRoomState(null);
    }

    if (seekDetectionInterval.current) {
      clearInterval(seekDetectionInterval.current);
    }

    seekDetectionInterval.current = setInterval(() => {
      if (!playerRef.current || !socketRef.current || !roomId) return;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentTime - lastKnownTime.current);
        const now = Date.now();

        if (timeDiff > 1.5 && !ignoreNextStateChange.current && (now - lastSyncTime.current) > 500) {
          const isCurrentlyPlaying = playerRef.current.isPlaying();

          ignoreNextStateChange.current = true;
          setTimeout(() => {
            ignoreNextStateChange.current = false;
          }, 1000);

          if (socketRef.current) {
            socketRef.current.emit('seek', {
              roomId,
              time: currentTime,
              isPlaying: isCurrentlyPlaying
            });
          }

          lastSyncTime.current = now;
          lastKnownTime.current = currentTime;
        } else {
          lastKnownTime.current = currentTime;
        }
      } catch (error) {
        // Player might not be fully ready yet
      }
    }, 200);
  }, [roomId, pendingRoomState, syncToRoomState]);

  // Player state change callback
  const handleStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);

    if (ignoreNextStateChange.current) {
      return;
    }

    if (justJoinedRoom.current) {
      return;
    }

    if (!socketRef.current || !roomId || !playerRef.current) return;

    const now = Date.now();
    if (now - lastSyncTime.current < 1000) {
      return;
    }
    lastSyncTime.current = now;

    const currentTime = playerRef.current.getCurrentTime();

    if (playing) {
      socketRef.current.emit('play', { roomId, time: currentTime });
    } else {
      socketRef.current.emit('pause', { roomId, time: currentTime });
    }
  }, [roomId]);

  const handlePlayerError = useCallback((error: any) => {
    const errorMsg = 'Error loading YouTube video. Please check the video ID and try again.';
    setPlayerError(errorMsg);
    console.error('Player error:', error);
  }, []);

  // Handle time updates from player
  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    setCurrentTime(time);
    setDuration(dur);
  }, []);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    // Auto-play next track from queue
    if (socketRef.current && roomId && queue.length > 0) {
      socketRef.current.emit('next-track', { roomId });
    }
  }, [roomId, queue.length]);

  // Track selection from search
  const handleTrackSelect = (track: YTTrack) => {
    if (socketRef.current && roomId) {
      setCurrentTrack(track);
      setVideoId(track.videoId);
      socketRef.current.emit('change-video', { roomId, videoId: track.videoId, track });
      socketRef.current.emit('update-current-track', { roomId, track });
    }
  };

  // Add track to queue
  const handleAddToQueue = (track: YTTrack) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('add-to-queue', { roomId, track });
    }
  };

  // Remove track from queue
  const handleRemoveFromQueue = (index: number) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('remove-from-queue', { roomId, index });
    }
  };

  // Clear queue
  const handleClearQueue = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('clear-queue', { roomId });
    }
  };

  // Play track from queue
  const handlePlayFromQueue = (index: number) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('play-from-queue', { roomId, index });
    }
  };

  // Player controls
  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playerRef.current.isPaused()) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  const handleNext = () => {
    if (socketRef.current && roomId && queue.length > 0) {
      socketRef.current.emit('next-track', { roomId });
    }
  };

  const handlePrevious = () => {
    // TODO: Implement previous track logic with history
  };

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      if (socketRef.current && roomId) {
        socketRef.current.emit('seek', { roomId, time });
      }
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      alert('✅ Room link copied!\n\nShare this link with friends to listen together.');
    }).catch(() => {
      alert(`Copy this link:\n\n${link}`);
    });
  };

  const handleSendMessage = (message: string) => {
    if (socketRef.current && roomId && message.trim()) {
      socketRef.current.emit('send-message', {
        roomId,
        message: message.trim(),
        username: username || 'Anonymous'
      });
    }
  };

  const handleNameSubmit = () => {
    const finalName = nameInput.trim() || `User${Math.floor(Math.random() * 1000)}`;
    setUsername(finalName);
    localStorage.setItem('ytjam_username', finalName);
    setShowNamePrompt(false);
  };

  // Username prompt modal
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold text-red-500">Welcome to YT Jam!</h1>
            <p className="text-gray-400 mt-2">Enter your name to join the room</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              autoFocus
            />
            
            <button
              onClick={handleNameSubmit}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-semibold transition-all transform hover:scale-[1.02]"
            >
              Join Room
            </button>
          </div>
          
          <p className="text-center text-gray-500 text-sm mt-4">
            Room: {roomId}
          </p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-red-500">🎵 YT Jam</h1>
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
              <div className="relative">
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  👥 {userCount} {userCount === 1 ? 'person' : 'people'}
                  <svg className={`w-3 h-3 ml-1 transition-transform ${showParticipants ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showParticipants && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Participants</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse"></div>
                          <span className="text-sm text-gray-200 truncate flex-1">
                            {user.name}
                            {user.id === socketRef.current?.id && (
                              <span className="text-gray-500 ml-1">(you)</span>
                            )}
                          </span>
                          {users.length > 0 && users[0]?.id === user.id && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-semibold">HOST</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Player and Controls */}
            <div className="lg:col-span-3 space-y-6">
              {/* Current Track Info */}
              {currentTrack && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-4">
                    {currentTrack.thumbnails && currentTrack.thumbnails.length > 0 && (
                      <img
                        src={currentTrack.thumbnails[0].url}
                        alt={currentTrack.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{currentTrack.title}</h3>
                      <p className="text-gray-400 truncate">{currentTrack.artist}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Player */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 ">
                <YouTubePlayer
                  videoId={videoId}
                  onReady={handlePlayerReady}
                  onStateChange={handleStateChange}
                  onError={handlePlayerError}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  autoPlay={true}
                  showControls={false}
                  height={100}
                />
                {playerError && (
                  <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400">⚠️ {playerError}</p>
                  </div>
                )}
                {!videoId && (
                  <div className="mt-4 bg-gray-700/50 rounded-lg p-4 text-center">
                    <p className="text-gray-400">🔍 Search and select a track to start playing</p>
                  </div>
                )}
              </div>

              {/* Player Controls */}
              <PlayerControls
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSeek={handleSeek}
                hasNext={queue.length > 0}
                hasPrevious={false}
              />

              {/* Search */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Search YouTube Music</h2>
                <TrackSearch
                  onTrackSelect={handleTrackSelect}
                  onAddToQueue={handleAddToQueue}
                />
              </div>

              {/* Room Controls */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 space-y-4">
                <h2 className="text-xl font-semibold">Room Controls</h2>

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

                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-400">
                    ℹ️ {isHost
                      ? 'You are the host (first to join). Everyone can control playback!'
                      : 'You are a participant. Everyone can search, queue, and control playback!'}
                  </p>
                  {userCount > 1 && (
                    <p className="text-sm text-green-400 mt-2">
                      ✨ You're listening with {userCount - 1} other{' '}
                      {userCount - 1 === 1 ? 'person' : 'people'}!
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ← Leave Room
              </button>
            </div>

            {/* Right Column - Queue and Chat */}
            <div className="lg:col-span-1 space-y-6">
              {/* Participants */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">👥 Participants ({userCount})</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-700/50 max-h-48 overflow-y-auto">
                  {users.map((user, idx) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/30 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 60%, 40%)`,
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.name}
                          {user.id === socketRef.current?.id && (
                            <span className="text-gray-500 ml-1 text-xs">(you)</span>
                          )}
                        </p>
                        {idx === 0 && (
                          <p className="text-[10px] text-red-400 font-semibold">HOST</p>
                        )}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No participants yet
                    </div>
                  )}
                </div>
              </div>

              {/* Queue */}
              <div className="h-[500px]">
                <QueuePanel
                  queue={queue}
                  currentTrack={currentTrack}
                  onTrackSelect={handlePlayFromQueue}
                  onRemoveTrack={handleRemoveFromQueue}
                  onClearQueue={handleClearQueue}
                  onMoveTrack={() => {}}
                />
              </div>

              {/* Chat */}
              <div className="h-[400px]">
                <Chat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  username={username}
                  currentUserId={userId}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

