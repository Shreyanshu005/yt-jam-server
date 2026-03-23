import { useEffect, useRef, useState, useCallback } from 'react';

// YouTube Player API types
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
  getVideoUrl: () => string;
  getAvailablePlaybackRates: () => number[];
  setPlaybackRate: (rate: number) => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
}

interface YTPlayerEvent {
  data: number;
  target: YTPlayer;
}

// YouTube Player States
const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

// Extend Window interface
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: {
            autoplay?: 0 | 1;
            controls?: 0 | 1;
            disablekb?: 0 | 1;
            fs?: 0 | 1;
            modestbranding?: 0 | 1;
            rel?: 0 | 1;
            showinfo?: 0 | 1;
            iv_load_policy?: 1 | 3;
            playsinline?: 0 | 1;
            origin?: string;
            enablejsapi?: 0 | 1;
          };
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: YTPlayerEvent) => void;
            onError?: (event: YTPlayerEvent) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: typeof YT_PLAYER_STATE;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  isPaused: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
}

interface YouTubePlayerProps {
  videoId: string | null;
  onReady: (player: YouTubePlayerRef) => void;
  onStateChange: (isPlaying: boolean) => void;
  onError: (error: any) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  showControls?: boolean;
  height?: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onReady,
  onStateChange,
  onError,
  onTimeUpdate,
  onEnded,
  autoPlay = true,
  showControls = false,
  height = 100,
}) => {
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.getElementById('youtube-iframe-api');
    if (existingScript) {
      const checkAPIReady = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsAPIReady(true);
          clearInterval(checkAPIReady);
        }
      }, 100);
      return () => clearInterval(checkAPIReady);
    }

    // Load the API script
    const script = document.createElement('script');
    script.id = 'youtube-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);

    // Define callback
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };

    return () => {
      // Clean up only if we added the script
      if (existingScript === null) {
        const scriptToRemove = document.getElementById('youtube-iframe-api');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      }
    };
  }, []);

  // Create player ref methods
  const createPlayerRef = useCallback((): YouTubePlayerRef => ({
    play: () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    },
    pause: () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
      }
    },
    getCurrentTime: () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime();
      }
      return 0;
    },
    getDuration: () => {
      if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        return playerRef.current.getDuration();
      }
      return 0;
    },
    isPlaying: () => {
      if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
        return playerRef.current.getPlayerState() === YT_PLAYER_STATE.PLAYING;
      }
      return false;
    },
    isPaused: () => {
      if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
        return playerRef.current.getPlayerState() === YT_PLAYER_STATE.PAUSED;
      }
      return true;
    },
    setVolume: (volume: number) => {
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(volume);
      }
    },
    getVolume: () => {
      if (playerRef.current && typeof playerRef.current.getVolume === 'function') {
        return playerRef.current.getVolume();
      }
      return 100;
    },
    mute: () => {
      if (playerRef.current && typeof playerRef.current.mute === 'function') {
        playerRef.current.mute();
      }
    },
    unMute: () => {
      if (playerRef.current && typeof playerRef.current.unMute === 'function') {
        playerRef.current.unMute();
      }
    },
    isMuted: () => {
      if (playerRef.current && typeof playerRef.current.isMuted === 'function') {
        return playerRef.current.isMuted();
      }
      return false;
    },
  }), []);

  // Initialize player when API is ready and we have a videoId
  useEffect(() => {
    if (!isAPIReady || !videoId || !playerContainerRef.current) return;

    // If player already exists and video changed, just load the new video (don't destroy!)
    // This is critical for Safari — destroying + recreating the iframe causes redirect to YouTube
    if (playerRef.current && currentVideoId && currentVideoId !== videoId) {
      try {
        if (autoPlay) {
          playerRef.current.loadVideoById(videoId, 0);
        } else {
          playerRef.current.cueVideoById(videoId, 0);
        }
        setCurrentVideoId(videoId);
      } catch (err) {
        console.error('Error loading video, will recreate player:', err);
        playerRef.current.destroy();
        playerRef.current = null;
      }
    }

    // Create new player only if one doesn't exist yet
    if (!playerRef.current) {
      const playerId = `youtube-player-${Date.now()}`;
      
      // Create a div for the player
      const playerDiv = document.createElement('div');
      playerDiv.id = playerId;
      playerContainerRef.current.innerHTML = '';
      playerContainerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerId, {
        height: height,
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: showControls ? 1 : 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            console.log('YouTube Player Ready');
            setCurrentVideoId(videoId);

            // Force playsinline attribute on the iframe for older Safari
            try {
              const iframe = playerContainerRef.current?.querySelector('iframe');
              if (iframe) {
                iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
                iframe.setAttribute('webkit-playsinline', 'true');
                iframe.setAttribute('playsinline', 'true');
              }
            } catch (e) {
              // ignore
            }

            onReady(createPlayerRef());
          },
          onStateChange: (event: YTPlayerEvent) => {
            const state = event.data;
            console.log('YouTube Player State:', state);
            
            if (state === YT_PLAYER_STATE.PLAYING) {
              onStateChange(true);
              // Start time update interval
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
              }
              timeUpdateIntervalRef.current = setInterval(() => {
                if (playerRef.current && onTimeUpdate) {
                  onTimeUpdate(
                    playerRef.current.getCurrentTime(),
                    playerRef.current.getDuration()
                  );
                }
              }, 1000);
            } else if (state === YT_PLAYER_STATE.PAUSED) {
              onStateChange(false);
              // Stop time update interval
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
                timeUpdateIntervalRef.current = null;
              }
            } else if (state === YT_PLAYER_STATE.ENDED) {
              onStateChange(false);
              if (onEnded) {
                onEnded();
              }
              // Stop time update interval
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
                timeUpdateIntervalRef.current = null;
              }
            }
          },
          onError: (event: YTPlayerEvent) => {
            console.error('YouTube Player Error:', event.data);
            onError(event.data);
          },
        },
      });
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };
  }, [isAPIReady, videoId, autoPlay, showControls, height, onReady, onStateChange, onError, onTimeUpdate, onEnded, createPlayerRef, currentVideoId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  if (!videoId) {
    return (
      <div 
        className="w-full bg-gray-900 rounded-lg flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500 text-sm">No video selected</p>
      </div>
    );
  }

  return (
    <div 
      ref={playerContainerRef}
      className="w-full bg-black rounded-lg overflow-hidden shadow-2xl"
      style={{ minHeight: `${height}px` }}
    />
  );
};

export default YouTubePlayer;
