import { useState, useCallback } from 'react';

const LOVE_LETTERS = [
  "My dearest Pookie, every moment with you feels like a beautiful song. You make my world so much brighter. 💕",
  "Princess, you're the melody to every song I play. Keep smiling, you're perfect! 🎀",
  "Just a little reminder that you are loved beyond words. You are my greatest joy! 💖",
  "Every time you join my room, my heart skips a beat. You're my favorite notification~ 💌",
  "You're sweeter than the sweetest melody and hotter than the best beat drop! 🔥❤️",
  "I don't need a search bar to find what I'm looking for, because I already found you. 😘"
];

const KISSSES = ['❤️', '💖', '💋', '💕', '🥰', '🎀', '🌸', '✨'];

interface FloatingHeart {
  id: string;
  emoji: string;
  left: number;
  duration: number;
}

export default function LoveWidget() {
  const [showLetter, setShowLetter] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('');
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  const openLetter = () => {
    setCurrentLetter(LOVE_LETTERS[Math.floor(Math.random() * LOVE_LETTERS.length)]);
    setShowLetter(true);
  };

  const sendKisses = useCallback(() => {
    // Generate 15-20 random hearts
    const heartCount = 15 + Math.floor(Math.random() * 10);
    const newHearts = Array.from({ length: heartCount }).map(() => ({
      id: Math.random().toString(),
      emoji: KISSSES[Math.floor(Math.random() * KISSSES.length)],
      left: Math.random() * 100, // random percentage from left edge
      duration: 3 + Math.random() * 3, // 3 to 6 seconds duration
    }));

    setHearts(prev => [...prev, ...newHearts]);

    // Clean up hearts after animation completes (max 6s)
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 6000);
  }, []);

  return (
    <>
      {/* Love Widget Card */}
      <div className="glass-card p-5 border border-pink-400/20 bg-pink-900/10 shadow-[0_0_15px_rgba(236,72,153,0.1)] relative overflow-hidden group mb-4">
        <div className="absolute -inset-0 bg-gradient-to-r from-pink-500/10 to-rose-400/10 blur-xl group-hover:opacity-100 opacity-50 transition-opacity" />
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider text-pink-300 relative z-10 flex items-center gap-2">
          🎀 Anjali's Secret Drawer
        </h2>
        <div className="flex gap-2 relative z-10">
          <button
            onClick={openLetter}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-400/20 transition-all hover:scale-105 active:scale-95 shadow-[0_2px_10px_rgba(236,72,153,0.15)] flex flex-col items-center justify-center gap-1"
          >
            <span className="text-xl">💌</span>
            <span>Love Letter</span>
          </button>
          <button
            onClick={sendKisses}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-400/20 transition-all hover:scale-105 active:scale-95 shadow-[0_2px_10px_rgba(244,63,94,0.15)] flex flex-col items-center justify-center gap-1"
          >
            <span className="text-xl">✨</span>
            <span>Shower Love</span>
          </button>
        </div>
      </div>

      {/* Love Letter Modal */}
      {showLetter && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-gradient-to-br from-pink-100 to-rose-50 w-full max-w-sm rounded-[2rem] shadow-[0_0_50px_rgba(236,72,153,0.3)] animate-[scaleIn_0.3s_ease-out] border-4 border-white">
            <div className="bg-white/60 p-6 rounded-[1.8rem] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-rose-300 to-pink-300" />
              <button
                onClick={() => setShowLetter(false)}
                className="absolute top-3 right-3 text-pink-400/60 hover:text-pink-500 p-1 transition-colors"
              >
                ✕
              </button>
              <div className="text-5xl mb-4 mt-2">💌</div>
              <h3 className="font-serif text-pink-600 font-bold text-xl mb-3">For My Princess</h3>
              <p className="font-medium text-pink-900/80 leading-relaxed text-[15px] mb-8 px-2 italic">
                "{currentLetter}"
              </p>
              <button
                onClick={() => setShowLetter(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold text-sm shadow-[0_4px_15px_rgba(236,72,153,0.3)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.4)] transition-all active:scale-95"
              >
                Aww, close! 💕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hearts Overlay */}
      {hearts.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {hearts.map(heart => (
            <div
              key={heart.id}
              className="absolute bottom-0 text-3xl will-change-transform"
              style={{
                left: `${heart.left}%`,
                animation: `floatUp ${heart.duration}s ease-out forwards`,
                transform: `translateX(-50%) scale(${0.5 + Math.random() * 0.8}) rotate(${-20 + Math.random() * 40}deg)`,
                opacity: 0,
              } as any}
            >
              {heart.emoji}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
