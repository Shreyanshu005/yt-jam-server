import { useState, useEffect } from 'react';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce';

interface SoundCloudUser {
  id: number;
  username: string;
  avatar_url: string;
}

export default function SoundCloudLogin() {
  const [user, setUser] = useState<SoundCloudUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('soundcloud_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('soundcloud_user');
      }
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);

    try {
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateState();

      // Store for later verification
      sessionStorage.setItem('code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      // Build authorization URL
      const clientId = process.env.NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID;
      const redirectUri = `${window.location.origin}/callback`;

      const params = new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state,
        scope: 'non-expiring', // Request non-expiring token
      });

      const authUrl = `https://secure.soundcloud.com/authorize?${params.toString()}`;

      // Redirect to SoundCloud authorization
      window.location.href = authUrl;
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('soundcloud_access_token');
    localStorage.removeItem('soundcloud_refresh_token');
    localStorage.removeItem('soundcloud_user');
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
        <img
          src={user.avatar_url}
          alt={user.username}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-gray-200 font-medium">{user.username}</span>
        <button
          onClick={handleLogout}
          className="ml-2 text-gray-400 hover:text-red-400 transition-colors text-sm"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689c.446.143.636.138 1 .138v-5.949z"/>
          </svg>
          <span>Connect with SoundCloud</span>
        </>
      )}
    </button>
  );
}
