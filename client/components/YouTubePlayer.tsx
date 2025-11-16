import { useEffect, useRef, useState } from 'react';

// Extend Window interface to include YT
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onReady: (player: any) => void;
  onStateChange: (event: any) => void;
  onError: (error: any) => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onReady,
  onStateChange,
  onError,
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Wait for API to load
    const checkAPIReady = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsAPIReady(true);
        clearInterval(checkAPIReady);
      }
    }, 100);

    return () => clearInterval(checkAPIReady);
  }, []);

  // Initialize player when API is ready (only once)
  useEffect(() => {
    if (!isAPIReady || !containerRef.current || playerRef.current) return;

    // Create new player
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1, // Enable autoplay
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        playsinline: 1,
        mute: 0, // Not muted (users can control volume)
      },
      events: {
        onReady: (event: any) => {
          console.log('YouTube Player Ready');
          onReady(event.target);
        },
        onStateChange: (event: any) => {
          console.log('Player State Changed:', event.data);
          onStateChange(event);
        },
        onError: (event: any) => {
          console.error('YouTube Player Error:', event.data);
          onError(event);
        },
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isAPIReady, onReady, onStateChange, onError]);

  // Handle video ID changes by loading new video (don't recreate player)
  useEffect(() => {
    if (!playerRef.current || !videoId) return;

    try {
      // Only load if it's a different video
      const currentVideoData = playerRef.current.getVideoData?.();
      if (currentVideoData && currentVideoData.video_id === videoId) {
        console.log('Video already loaded:', videoId);
        return;
      }

      // Check if player is ready before loading
      if (playerRef.current.loadVideoById) {
        console.log('Loading new video:', videoId);
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
        });
      }
    } catch (error) {
      console.error('Error loading video:', error);
    }
  }, [videoId]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default YouTubePlayer;
