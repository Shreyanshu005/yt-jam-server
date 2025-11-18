import { useEffect, useRef, useState } from 'react';

// Extend Window interface to include SC
declare global {
  interface Window {
    SC: any;
  }
}

interface SoundCloudPlayerProps {
  trackUrl: string;
  onReady: (player: any) => void;
  onStateChange: (isPlaying: boolean) => void;
  onError: (error: any) => void;
}

const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({
  trackUrl,
  onReady,
  onStateChange,
  onError,
}) => {
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(trackUrl);

  // Load SoundCloud Widget API
  useEffect(() => {
    // Check if API is already loaded
    if (window.SC && window.SC.Widget) {
      setIsAPIReady(true);
      return;
    }

    // Wait for API to load
    const checkAPIReady = setInterval(() => {
      if (window.SC && window.SC.Widget) {
        setIsAPIReady(true);
        clearInterval(checkAPIReady);
      }
    }, 100);

    return () => clearInterval(checkAPIReady);
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !iframeRef.current || playerRef.current) return;

    try {
      // Create SoundCloud Widget
      playerRef.current = window.SC.Widget(iframeRef.current);

      // Bind events
      playerRef.current.bind(window.SC.Widget.Events.READY, () => {
        console.log('SoundCloud Player Ready');
        onReady(playerRef.current);
      });

      playerRef.current.bind(window.SC.Widget.Events.PLAY, () => {
        console.log('SoundCloud: Playing');
        onStateChange(true);
      });

      playerRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
        console.log('SoundCloud: Paused');
        onStateChange(false);
      });

      playerRef.current.bind(window.SC.Widget.Events.FINISH, () => {
        console.log('SoundCloud: Finished');
        onStateChange(false);
      });

      playerRef.current.bind(window.SC.Widget.Events.ERROR, (error: any) => {
        console.error('SoundCloud Player Error:', error);
        onError(error);
      });
    } catch (error) {
      console.error('Error initializing SoundCloud player:', error);
      onError(error);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current = null;
      }
    };
  }, [isAPIReady, onReady, onStateChange, onError]);

  // Handle track URL changes
  useEffect(() => {
    if (!playerRef.current || !trackUrl || trackUrl === currentUrl) return;

    try {
      console.log('Loading new track:', trackUrl);
      playerRef.current.load(trackUrl, {
        auto_play: true,
        buying: false,
        sharing: false,
        download: false,
        show_artwork: true,
        show_playcount: true,
        show_user: true,
      });
      setCurrentUrl(trackUrl);
    } catch (error) {
      console.error('Error loading track:', error);
      onError(error);
    }
  }, [trackUrl, currentUrl, onError]);

  // Generate SoundCloud embed URL
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    trackUrl
  )}&auto_play=false&buying=false&sharing=false&download=false&show_artwork=true&show_playcount=true&show_user=true&show_comments=false&visual=false`;

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-2xl">
      <iframe
        ref={iframeRef}
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={embedUrl}
        className="w-full"
      />
    </div>
  );
};

export default SoundCloudPlayer;
