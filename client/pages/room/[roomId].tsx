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

  const addToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const syncToRoomState = useCallback((data: any) => {
    if (!playerRef.current) return;
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
      setTimeout(() => { if (playerRef.current) playerRef.current.play(); }, 100);
    } else {
      setTimeout(() => { if (playerRef.current) playerRef.current.pause(); }, 100);
    }
    setTimeout(() => { ignoreNextStateChange.current = false; }, 1500);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const storedUsername = localStorage.getItem('ytjam_username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setShowNamePrompt(true);
    }
  }, [roomId]);

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

    socket.on('disconnect', () => setIsConnected(false));

    const loadingTimeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);

    socket.on('room-state', (data: any) => {
      clearTimeout(loadingTimeout);
      setVideoId(data.videoId || null);
      setCurrentTrack(data.currentTrack || null);
      setQueue(data.queue || []);
      setIsHost(data.isHost);
      setUserCount(data.userCount);
      if (data.users) setUsers(data.users);
      setIsLoading(false);
      justJoinedRoom.current = true;
      setTimeout(() => { justJoinedRoom.current = false; }, 2000);
      if (playerRef.current) { syncToRoomState(data); } else { setPendingRoomState(data); }
    });

    socket.on('user-count', (data: any) => {
      setUserCount(data.count);
      if (data.users) setUsers(data.users);
    });

    socket.on('host-assigned', () => setIsHost(true));

    socket.on('play', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time);
        setTimeout(() => { if (playerRef.current) playerRef.current.play(); }, 50);
        setTimeout(() => { ignoreNextStateChange.current = false; }, 500);
      }
    });

    socket.on('pause', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time);
        playerRef.current.pause();
        setTimeout(() => { ignoreNextStateChange.current = false; }, 500);
      }
    });

    socket.on('seek', (data: any) => {
      if (playerRef.current) {
        ignoreNextStateChange.current = true;
        lastKnownTime.current = data.time;
        lastSyncTime.current = Date.now();
        playerRef.current.seekTo(data.time);
        if (data.isPlaying) {
          setTimeout(() => { if (playerRef.current) playerRef.current.play(); }, 100);
        }
        setTimeout(() => { ignoreNextStateChange.current = false; }, 300);
      }
    });

    socket.on('video-changed', (data: any) => {
      setVideoId(data.videoId);
      if (data.track) setCurrentTrack(data.track);
      setPlayerError(null);
      lastKnownTime.current = 0;
      lastSyncTime.current = Date.now();
      ignoreNextStateChange.current = true;
      setTimeout(() => { ignoreNextStateChange.current = false; lastKnownTime.current = 0; }, 2000);
    });

    socket.on('queue-updated', (data: any) => setQueue(data.queue || []));
    socket.on('current-track-updated', (data: any) => setCurrentTrack(data.track));

    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      if (message.userId !== socket.id) {
        addToast(`${message.username}`, message.message, 'info');
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      if (seekDetectionInterval.current) clearInterval(seekDetectionInterval.current);
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
      if (roomId) socket.emit('leave-room', { roomId });
    };
  }, [roomId, queryVideoId, username, isLoading, syncToRoomState]);

  const handlePlayerReady = useCallback((player: YouTubePlayerRef) => {
    playerRef.current = player;
    if (pendingRoomState) { syncToRoomState(pendingRoomState); setPendingRoomState(null); }
    if (seekDetectionInterval.current) clearInterval(seekDetectionInterval.current);
    seekDetectionInterval.current = setInterval(() => {
      if (!playerRef.current || !socketRef.current || !roomId) return;
      try {
        const ct = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(ct - lastKnownTime.current);
        const now = Date.now();
        if (timeDiff > 1.5 && !ignoreNextStateChange.current && (now - lastSyncTime.current) > 500) {
          const isCurrentlyPlaying = playerRef.current.isPlaying();
          ignoreNextStateChange.current = true;
          setTimeout(() => { ignoreNextStateChange.current = false; }, 1000);
          if (socketRef.current) socketRef.current.emit('seek', { roomId, time: ct, isPlaying: isCurrentlyPlaying });
          lastSyncTime.current = now;
          lastKnownTime.current = ct;
        } else { lastKnownTime.current = ct; }
      } catch (error) {}
    }, 200);
  }, [roomId, pendingRoomState, syncToRoomState]);

  const handleStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (ignoreNextStateChange.current || justJoinedRoom.current) return;
    if (!socketRef.current || !roomId || !playerRef.current) return;
    const now = Date.now();
    if (now - lastSyncTime.current < 1000) return;
    lastSyncTime.current = now;
    const ct = playerRef.current.getCurrentTime();
    if (playing) { socketRef.current.emit('play', { roomId, time: ct }); }
    else { socketRef.current.emit('pause', { roomId, time: ct }); }
  }, [roomId]);

  const handlePlayerError = useCallback((error: any) => {
    setPlayerError('Error loading YouTube video. Please check the video ID and try again.');
    console.error('Player error:', error);
  }, []);

  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    setCurrentTime(time);
    setDuration(dur);
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (socketRef.current && roomId && queue.length > 0) {
      socketRef.current.emit('next-track', { roomId });
    }
  }, [roomId, queue.length]);

  const handleTrackSelect = (track: YTTrack) => {
    if (socketRef.current && roomId) {
      setCurrentTrack(track);
      setVideoId(track.videoId);
      socketRef.current.emit('change-video', { roomId, videoId: track.videoId, track });
      socketRef.current.emit('update-current-track', { roomId, track });
    }
  };

  const handleAddToQueue = (track: YTTrack) => {
    if (socketRef.current && roomId) socketRef.current.emit('add-to-queue', { roomId, track });
  };

  const handleRemoveFromQueue = (index: number) => {
    if (socketRef.current && roomId) socketRef.current.emit('remove-from-queue', { roomId, index });
  };

  const handleClearQueue = () => {
    if (socketRef.current && roomId) socketRef.current.emit('clear-queue', { roomId });
  };

  const handlePlayFromQueue = (index: number) => {
    if (socketRef.current && roomId) socketRef.current.emit('play-from-queue', { roomId, index });
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playerRef.current.isPaused()) playerRef.current.play();
      else playerRef.current.pause();
    }
  };

  const handleNext = () => {
    if (socketRef.current && roomId && queue.length > 0) socketRef.current.emit('next-track', { roomId });
  };

  const handlePrevious = () => {};

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      if (socketRef.current && roomId) socketRef.current.emit('seek', { roomId, time });
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      addToast('Link Copied! 🔗', 'Share this link with friends', 'success');
    }).catch(() => {
      addToast('Copy Link', link, 'info');
    });
  };

  const handleSendMessage = (message: string) => {
    if (socketRef.current && roomId && message.trim()) {
      socketRef.current.emit('send-message', { roomId, message: message.trim(), username: username || 'Anonymous' });
    }
  };

  const handleNameSubmit = () => {
    const finalName = nameInput.trim() || `User${Math.floor(Math.random() * 1000)}`;
    setUsername(finalName);
    localStorage.setItem('ytjam_username', finalName);
    setShowNamePrompt(false);
  };

  // ── Name Prompt ──
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-[rgb(5,5,15)] bg-mesh text-white flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[120px] animate-float" />
        </div>
        <div className="relative glass-card p-10 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">Welcome to YT Jam</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Enter your name to join the room</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Your name"
              maxLength={20}
              className="input-premium text-center text-lg"
              autoFocus
            />
            <button onClick={handleNameSubmit} className="w-full btn-primary text-white">
              Join Room →
            </button>
          </div>
          <p className="text-center text-gray-700 text-xs mt-6">
            Room: <span className="text-gray-500 font-mono">{roomId}</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (!roomId || isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(5,5,15)] bg-mesh text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500 animate-spin" />
          </div>
          <p className="text-gray-500 text-sm">
            {!roomId ? 'Loading room...' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  // ── Main Room ──
  return (
    <div className="min-h-screen bg-[rgb(5,5,15)] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 bg-mesh-subtle pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[rgb(5,5,15)]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/')} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">YT Jam</span>
                </h1>
                <p className="text-[10px] text-gray-600 font-mono tracking-wider">{roomId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Connection status */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-red-500'}`} />
                <span className="text-[11px] text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
              </div>

              {/* Participants */}
              <div className="relative">
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors text-[11px] text-gray-400"
                >
                  <span>👥</span>
                  <span>{userCount}</span>
                  <svg className={`w-3 h-3 transition-transform ${showParticipants ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showParticipants && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-card overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-white/[0.04]">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Participants</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {users.map((user, idx) => (
                        <div key={user.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/[0.03] transition-colors">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ background: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 50%, 30%)` }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-300 truncate flex-1">
                            {user.name}
                            {user.id === socketRef.current?.id && <span className="text-gray-600 ml-1">(you)</span>}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-semibold">HOST</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isHost && (
                <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-semibold">
                  HOST
                </div>
              )}

              {/* Share button */}
              <button
                onClick={copyRoomLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors text-[11px] text-gray-400"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column - Player and Controls */}
            <div className="lg:col-span-8 space-y-4">
              {/* Player */}
              <div className="glass-card p-5 overflow-hidden">
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
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-sm">⚠️ {playerError}</p>
                  </div>
                )}
                {!videoId && (
                  <div className="mt-4 bg-white/[0.02] rounded-xl p-8 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-400 text-sm">Search and select a track to start playing</p>
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
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">Search</h2>
                <TrackSearch onTrackSelect={handleTrackSelect} onAddToQueue={handleAddToQueue} />
              </div>

              {/* Room info */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Room Info</h2>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {isHost
                      ? '👑 You are the host. Everyone can control playback!'
                      : '🎧 You are a participant. Everyone can search, queue, and control playback!'}
                  </p>
                  {userCount > 1 && (
                    <p className="text-xs text-emerald-400/70 mt-2">
                      ✨ Listening with {userCount - 1} other {userCount - 1 === 1 ? 'person' : 'people'}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition-all"
              >
                ← Leave Room
              </button>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-4">
              {/* Participants */}
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">👥 Participants ({userCount})</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400/70">Live</span>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.03] max-h-40 overflow-y-auto">
                  {users.map((user, idx) => (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 50%, 30%)` }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {user.name}
                          {user.id === socketRef.current?.id && <span className="text-gray-600 ml-1 text-[10px]">(you)</span>}
                        </p>
                        {idx === 0 && <p className="text-[9px] text-red-400/70 font-semibold">HOST</p>}
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 flex-shrink-0" />
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-600 text-xs">No participants yet</div>
                  )}
                </div>
              </div>

              {/* Queue */}
              <div className="h-[450px]">
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
              <div className="h-[380px]">
                <Chat messages={messages} onSendMessage={handleSendMessage} username={username} currentUserId={userId} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
