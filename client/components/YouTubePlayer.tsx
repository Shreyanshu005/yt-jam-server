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

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !containerRef.current) return;

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Create new player
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        playsinline: 1,
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
      }
    };
  }, [isAPIReady, videoId, onReady, onStateChange, onError]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default YouTubePlayer;
