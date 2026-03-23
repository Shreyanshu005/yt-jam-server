import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const generateRoomId = (): string => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleCreateRoom = () => {
    setIsCreating(true);
    const newRoomId = generateRoomId();

    // If video ID is provided, pass it as query param
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

    // If user pasted a full URL, extract just the room ID
    if (cleanRoomId.includes('localhost') || cleanRoomId.includes('http')) {
      // Extract room ID from URL like: http://localhost:3000/room/abc123?videoId=xyz
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
            🎵 YT Jam
          </h1>
          <p className="text-xl text-gray-400 mb-4">
            Listen to YouTube Music together in perfect sync
          </p>
          <p className="text-gray-500">
            Create a room, share the link, and enjoy synchronized playback with friends
          </p>
        </div>

        {/* Main Actions */}
        <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Room */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Create Room</h2>
              <p className="text-sm text-gray-400">
                Start a new listening party
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                YouTube Video ID (optional)
              </label>
              <input
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="dQw4w9WgXcQ"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateRoom();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Leave empty to start without a track. You can search and select one in the room!
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>

          {/* Join Room */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Join Room</h2>
              <p className="text-sm text-gray-400">
                Enter an existing room ID
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Room ID or URL
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="abc123 or paste full room URL"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 You can paste the full room URL or just the room ID
              </p>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!roomId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">🎵</div>
              <h4 className="text-lg font-semibold mb-2">Perfect Sync</h4>
              <p className="text-sm text-gray-400">
                Advanced drift correction ensures everyone stays in sync within 0.3 seconds
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold mb-2">Real-time</h4>
              <p className="text-sm text-gray-400">
                Play, pause, and seek actions are instantly synced across all viewers
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">👥</div>
              <h4 className="text-lg font-semibold mb-2">Multi-user</h4>
              <p className="text-sm text-gray-400">
                Listen with unlimited friends - no account or login required
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">🎬</div>
              <h4 className="text-lg font-semibold mb-2">Queue System</h4>
              <p className="text-sm text-gray-400">
                Add songs to queue and let them play automatically
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-lg font-semibold mb-2">YouTube Music Search</h4>
              <p className="text-sm text-gray-400">
                Search millions of songs directly from YouTube Music
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">🆓</div>
              <h4 className="text-lg font-semibold mb-2">Completely Free</h4>
              <p className="text-sm text-gray-400">
                No ads, no subscriptions, no hidden costs - just pure sync
              </p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-3xl mx-auto mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Create a Room</h4>
                <p className="text-sm text-gray-400">
                  Click "Create Room" to start a new listening session
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Share the Link</h4>
                <p className="text-sm text-gray-400">
                  Copy the room URL and send it to your friends
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Search & Play</h4>
                <p className="text-sm text-gray-400">
                  Search for songs on YouTube Music and add them to the queue
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">Listen Together</h4>
                <p className="text-sm text-gray-400">
                  Everyone's playback stays perfectly in sync - just like being in the same room!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-500 text-sm">
            Built with Next.js, Socket.io, YouTube IFrame API, and ytmusic-api
          </p>
        </div>
      </footer>
    </div>
  );
}
