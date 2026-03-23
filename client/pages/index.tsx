import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const generateRoomId = (): string => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleCreateRoom = () => {
    setIsCreating(true);
    const newRoomId = generateRoomId();
    if (videoId.trim()) {
      router.push(`/room/${newRoomId}?videoId=${encodeURIComponent(videoId.trim())}`);
    } else {
      router.push(`/room/${newRoomId}`);
    }
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    let cleanRoomId = roomId.trim();
    if (cleanRoomId.includes('localhost') || cleanRoomId.includes('http')) {
      const match = cleanRoomId.match(/\/room\/([a-z0-9]+)/i);
      if (match && match[1]) {
        cleanRoomId = match[1];
      } else {
        alert('Invalid room URL. Please paste just the room ID or the full URL.');
        return;
      }
    }
    router.push(`/room/${cleanRoomId}`);
  };

  return (
    <div className="min-h-screen bg-[rgb(5,5,15)] text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-16 pb-8">
          <div className={`max-w-4xl mx-auto text-center mb-20 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
            {/* Glowing badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 mb-8">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-400 tracking-wide uppercase">Live Music Sharing</span>
            </div>

            <h1 className="text-7xl md:text-8xl font-black mb-6 tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">YT</span>
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-pink-500 bg-clip-text text-transparent text-glow"> Jam</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-3 font-light tracking-wide">
              Listen to YouTube Music together in
              <span className="text-white font-medium"> perfect sync</span>
            </p>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Create a room, share the link, and enjoy synchronized playback with friends — no login required
            </p>
          </div>

          {/* Main Actions */}
          <div className={`max-w-3xl mx-auto grid md:grid-cols-2 gap-8 mb-24 ${mounted ? 'animate-slide-up-delay-1' : 'opacity-0'}`}>
            {/* Create Room */}
            <div className="glass-card-hover p-8 space-y-6 group">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/10 border border-red-500/10 flex items-center justify-center mx-auto mb-5 group-hover:glow-red transition-all duration-500">
                  <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-1 tracking-tight">Create Room</h2>
                <p className="text-sm text-gray-500">Start a new listening party</p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                  YouTube Video ID
                  <span className="text-gray-700 ml-1 normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  placeholder="dQw4w9WgXcQ"
                  className="input-premium"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
                <p className="text-[11px] text-gray-600 mt-2">
                  💡 Leave empty to search for tracks inside the room
                </p>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full btn-primary text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Room →'
                )}
              </button>
            </div>

            {/* Join Room */}
            <div className="glass-card-hover p-8 space-y-6 group">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/10 flex items-center justify-center mx-auto mb-5 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-1 tracking-tight">Join Room</h2>
                <p className="text-sm text-gray-500">Enter an existing room</p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                  Room ID or URL
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="abc123 or paste full room URL"
                  className="input-premium"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
                <p className="text-[11px] text-gray-600 mt-2">
                  💡 Paste the full room URL or just the room ID
                </p>
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:-translate-y-0.5"
              >
                Join Room →
              </button>
            </div>
          </div>

          {/* Features */}
          <div className={`max-w-5xl mx-auto mb-24 ${mounted ? 'animate-slide-up-delay-2' : 'opacity-0'}`}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold tracking-tight mb-2">Built for the Vibe</h3>
              <p className="text-gray-500 text-sm">Everything you need for the perfect group listening session</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '🎵', title: 'Perfect Sync', desc: 'Drift correction keeps everyone within 0.3 seconds', color: 'from-red-500/10 to-transparent' },
                { icon: '⚡', title: 'Real-time', desc: 'Play, pause, and seek synced instantly across all viewers', color: 'from-yellow-500/10 to-transparent' },
                { icon: '👥', title: 'Multi-user', desc: 'Unlimited friends — no account or login required', color: 'from-blue-500/10 to-transparent' },
                { icon: '🎬', title: 'Smart Queue', desc: 'Add songs to queue and let them auto-play seamlessly', color: 'from-purple-500/10 to-transparent' },
                { icon: '🔍', title: 'YT Music Search', desc: 'Search millions of songs directly from YouTube Music', color: 'from-green-500/10 to-transparent' },
                { icon: '💬', title: 'Live Chat', desc: 'Talk with everyone in the room while listening together', color: 'from-pink-500/10 to-transparent' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="glass-card-hover p-6 group cursor-default"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h4 className="text-base font-semibold mb-1.5 tracking-tight">{feature.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className={`max-w-2xl mx-auto mb-24 ${mounted ? 'animate-slide-up-delay-3' : 'opacity-0'}`}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold tracking-tight mb-2">How It Works</h3>
              <p className="text-gray-500 text-sm">Get started in under 30 seconds</p>
            </div>
            <div className="space-y-1">
              {[
                { step: '01', title: 'Create a Room', desc: 'Click "Create Room" to start a new listening session' },
                { step: '02', title: 'Share the Link', desc: 'Copy the room URL and send it to your friends' },
                { step: '03', title: 'Search & Play', desc: 'Search for songs and add them to the queue' },
                { step: '04', title: 'Listen Together', desc: "Everyone's playback stays perfectly in sync" },
              ].map((item, i) => (
                <div key={i} className="flex gap-5 items-start p-4 rounded-xl hover:bg-white/[0.02] transition-colors group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/10 flex items-center justify-center text-sm font-bold text-red-400 group-hover:glow-red transition-all duration-500">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-0.5 tracking-tight">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] bg-white/[0.01]">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center gap-3 text-gray-600 text-xs">
              <span className="text-base">🎵</span>
              <span>YT Jam</span>
              <span className="text-gray-800">·</span>
              <span>Built with Next.js, Socket.io & ytmusic-api</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
