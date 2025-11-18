import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import SoundCloudPlayer from '@/components/SoundCloudPlayer';
import TrackSearch from '@/components/TrackSearch';
import QueuePanel from '@/components/QueuePanel';
import PlayerControls from '@/components/PlayerControls';
import Chat from '@/components/Chat';
import { getSocket } from '@/lib/socket';
import { extractTrackUrl } from '@/lib/soundcloud';
import { SoundCloudTrack } from '@/lib/soundcloudAPI';

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export default function RoomPage() {
  const router = useRouter();
  const { roomId, trackUrl: queryTrackUrl } = router.query;

  const [trackUrl, setTrackUrl] = useState<string>('https://soundcloud.com/21savage/a-lot-feat-j-cole');
  const [currentTrack, setCurrentTrack] = useState<SoundCloudTrack | null>(null);
  const [queue, setQueue] = useState<SoundCloudTrack[]>([]);
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

  const playerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const ignoreNextStateChange = useRef<boolean>(false);
  const lastSyncTime = useRef<number>(0);
  const lastKnownTime = useRef<number>(0);
  const seekDetectionInterval = useRef<any>(null);
  const justJoinedRoom = useRef<boolean>(false);

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
      targetTime = (data.currentTime + elapsed) * 1000;
    } else {
      targetTime = targetTime * 1000;
    }

    lastKnownTime.current = targetTime / 1000;
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

  // Initialize socket connection
  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const initialTrackUrl = (queryTrackUrl as string) || trackUrl;
    if (queryTrackUrl) {
      setTrackUrl(queryTrackUrl as string);
    }

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join-room', { roomId, trackUrl: initialTrackUrl });
    }

    socket.on('connect', () => {
      setIsConnected(true);
      setUserId(socket.id || '');

      if (!username) {
        const randomName = `User${Math.floor(Math.random() * 1000)}`;
        setUsername(randomName);
      }

      socket.emit('join-room', { roomId, trackUrl: initialTrackUrl });
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
      setTrackUrl(data.trackUrl || data.videoId);
      setCurrentTrack(data.currentTrack);
      setQueue(data.queue || []);
      setIsHost(data.isHost);
      setUserCount(data.userCount);
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
    });

    socket.on('host-assigned', () => {
      setIsHost(true);
    });

    socket.on('play', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time * 1000);
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
        playerRef.current.seekTo(data.time * 1000);
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
        playerRef.current.seekTo(data.time * 1000);

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

    socket.on('track-changed', (data: any) => {
      console.log('Track changed:', data);
      setTrackUrl(data.trackUrl);
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

    socket.on('video-changed', (data: any) => {
      const url = data.trackUrl || data.videoId;
      setTrackUrl(url);
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
      socket.off('track-changed');
      socket.off('video-changed');
      socket.off('time-update');
      socket.off('queue-updated');
      socket.off('current-track-updated');
      socket.off('new-message');

      if (roomId) {
        socket.emit('leave-room', { roomId });
      }
    };
  }, [roomId, trackUrl, queryTrackUrl, username, isLoading, syncToRoomState]);

  // Player ready callback
  const handlePlayerReady = useCallback((player: any) => {
    console.log('SoundCloud Player ready');
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
        playerRef.current.getPosition((currentTimeMs: number) => {
          const currentTime = currentTimeMs / 1000;
          const timeDiff = Math.abs(currentTime - lastKnownTime.current);
          const now = Date.now();

          if (timeDiff > 1.5 && !ignoreNextStateChange.current && (now - lastSyncTime.current) > 500) {
            playerRef.current.isPaused((isPaused: boolean) => {
              const isCurrentlyPlaying = !isPaused;

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
            });
          } else {
            lastKnownTime.current = currentTime;
          }
        });
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

    playerRef.current.getPosition((currentTimeMs: number) => {
      const currentTime = currentTimeMs / 1000;

      if (playing) {
        socketRef.current.emit('play', { roomId, time: currentTime });
      } else {
        socketRef.current.emit('pause', { roomId, time: currentTime });
      }
    });
  }, [roomId]);

  const handlePlayerError = useCallback((error: any) => {
    const errorMsg = 'Error loading SoundCloud track. Please check the URL and try again.';
    setPlayerError(errorMsg);
    console.error('Player error:', error);
  }, []);

  // Track selection from search
  const handleTrackSelect = (track: SoundCloudTrack) => {
    if (socketRef.current && roomId) {
      setCurrentTrack(track);
      socketRef.current.emit('change-track', { roomId, trackUrl: track.permalink_url });
      socketRef.current.emit('update-current-track', { roomId, track });
    }
  };

  // Add track to queue
  const handleAddToQueue = (track: SoundCloudTrack) => {
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
      playerRef.current.isPaused((isPaused: boolean) => {
        if (isPaused) {
          playerRef.current.play();
        } else {
          playerRef.current.pause();
        }
      });
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

  if (!roomId || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
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
              <h1 className="text-2xl font-bold text-orange-500">SoundCloud Sync</h1>
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
                <div className="text-sm bg-orange-600 px-4 py-2 rounded-lg font-semibold">
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
              {/* Player */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <SoundCloudPlayer
                  trackUrl={trackUrl}
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

              {/* Player Controls */}
              <PlayerControls
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hasNext={queue.length > 0}
                hasPrevious={false}
              />

              {/* Search */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Search Tracks</h2>
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
    </div>
  );
}
