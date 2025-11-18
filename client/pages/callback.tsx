import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { code, state, error: authError } = router.query;

      if (authError) {
        setError(`Authentication failed: ${authError}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (!code || !state) {
        return; // Still loading query params
      }

      try {
        // Retrieve stored state and code_verifier
        const storedState = sessionStorage.getItem('oauth_state');
        const codeVerifier = sessionStorage.getItem('code_verifier');

        if (!storedState || !codeVerifier) {
          throw new Error('Missing OAuth state or verifier');
        }

        // Verify state matches (CSRF protection)
        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for tokens via server
        const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
        const response = await fetch(`${SERVER_URL}/api/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code as string,
            code_verifier: codeVerifier,
          }),
        });

        if (!response.ok) {
          throw new Error('Token exchange failed');
        }

        const data = await response.json();

        // Store tokens
        localStorage.setItem('soundcloud_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('soundcloud_refresh_token', data.refresh_token);
        }
        localStorage.setItem('soundcloud_user', JSON.stringify(data.user));

        // Clean up session storage
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('code_verifier');

        // Redirect to home page
        router.push('/');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-400 text-xl mb-4">❌ {error}</div>
            <p className="text-gray-400">Redirecting to home...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
