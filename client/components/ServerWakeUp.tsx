import { useEffect, useState, useRef } from 'react';

const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

const COOL_TEXTS = [
  { emoji: '🎸', text: 'Tuning the guitars...' },
  { emoji: '🎹', text: 'Warming up the keys...' },
  { emoji: '🥁', text: 'Setting up the drums...' },
  { emoji: '🎤', text: 'Doing a sound check...' },
  { emoji: '🎧', text: 'Plugging in the headphones...' },
  { emoji: '🎵', text: 'Loading your favorite beats...' },
  { emoji: '🎶', text: 'Syncing the rhythm...' },
  { emoji: '🔊', text: 'Cranking up the speakers...' },
  { emoji: '🎷', text: 'Polishing the saxophone...' },
  { emoji: '🎻', text: 'Rosining the bow...' },
  { emoji: '🪗', text: 'Stretching the accordion...' },
  { emoji: '🎺', text: 'Practicing the trumpet solo...' },
  { emoji: '🪘', text: 'Tightening the drumheads...' },
  { emoji: '🎼', text: 'Reading the sheet music...' },
  { emoji: '🎙️', text: 'Testing one, two, three...' },
  { emoji: '🪕', text: 'Strumming up a vibe...' },
  { emoji: '💿', text: 'Spinning up the turntable...' },
  { emoji: '📻', text: 'Dialing in the frequency...' },
  { emoji: '🎚️', text: 'Adjusting the mix...' },
  { emoji: '⚡', text: 'Powering up the amplifier...' },
];

interface ServerWakeUpProps {
  onServerReady: () => void;
}

export default function ServerWakeUp({ onServerReady }: ServerWakeUpProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [dots, setDots] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const startTime = useRef(Date.now());

  // Rotate cool texts every 2.5 seconds
  useEffect(() => {
    // Shuffle the starting index
    setCurrentTextIndex(Math.floor(Math.random() * COOL_TEXTS.length));
    // Trigger fade in
    requestAnimationFrame(() => setFadeIn(true));

    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % COOL_TEXTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll server health
  useEffect(() => {
    let cancelled = false;

    const checkServer = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${SERVER_URL}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok && !cancelled) {
          onServerReady();
        }
      } catch {
        // Server still sleeping, retry
      }
    };

    // Check immediately, then every 3 seconds
    checkServer();
    const interval = setInterval(checkServer, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [onServerReady]);

  const currentText = COOL_TEXTS[currentTextIndex];

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center transition-opacity duration-500 ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 30 + 345}, 80%, 60%)`,
              animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center px-6 max-w-lg">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-red-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
            🎵 YT Jam
          </h1>
        </div>

        {/* Equalizer animation */}
        <div className="flex items-end justify-center gap-1 mb-8 h-12">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 rounded-full bg-gradient-to-t from-red-600 to-red-400"
              style={{
                animation: `equalizer ${0.8 + i * 0.15}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Main message */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-3 uppercase tracking-widest font-medium">
            Waking up the server{dots}
          </p>
          <div className="h-14 flex items-center justify-center">
            <p
              key={currentTextIndex}
              className="text-2xl font-semibold text-white animate-fadeSlideIn"
            >
              <span className="mr-2">{currentText.emoji}</span>
              {currentText.text}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto mb-6">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-pink-500 to-red-500 rounded-full animate-progressPulse"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
        </div>

        {/* Info text */}
        <p className="text-gray-600 text-xs mb-2">
          Free servers take a moment to spin up — hang tight!
        </p>
        <p className="text-gray-700 text-xs">
          {elapsedSeconds > 0 && `Waiting for ${elapsedSeconds}s`}
          {elapsedSeconds >= 30 && ' — almost there! 🚀'}
          {elapsedSeconds >= 60 && ' — just a few more seconds...'}
        </p>
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes equalizer {
          0% {
            height: 8px;
          }
          100% {
            height: 48px;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(1.5);
          }
        }

        @keyframes progressPulse {
          0% {
            width: 15%;
            background-position: 0% 0%;
          }
          50% {
            width: 75%;
            background-position: 100% 0%;
          }
          100% {
            width: 15%;
            background-position: 0% 0%;
          }
        }

        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.5s ease-out;
        }

        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-progressPulse {
          animation: progressPulse 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
