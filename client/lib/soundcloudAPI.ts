// SoundCloud API service
// Uses server-side proxy for authenticated API requests

export interface SoundCloudTrack {
  id: number;
  permalink_url: string;
  title: string;
  user: {
    username: string;
    avatar_url: string;
  };
  artwork_url: string | null;
  duration: number;
  playback_count: number;
  genre: string;
  description: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

/**
 * Get authorization headers with user token if available
 */
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('soundcloud_access_token') : null;
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Search for tracks on SoundCloud
 */
export async function searchTracks(query: string, limit: number = 20): Promise<SoundCloudTrack[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${SERVER_URL}/api/soundcloud/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    return data.collection || [];
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
}

/**
 * Get track info from URL
 */
export async function getTrackFromUrl(url: string): Promise<SoundCloudTrack | null> {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/soundcloud/resolve?url=${encodeURIComponent(url)}`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Failed to resolve track');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting track from URL:', error);
    return null;
  }
}

/**
 * Get popular tracks by genre
 */
export async function getPopularTracks(genre?: string, limit: number = 20): Promise<SoundCloudTrack[]> {
  try {
    let url = `${SERVER_URL}/api/soundcloud/charts?limit=${limit}`;
    if (genre) {
      url += `&genre=${encodeURIComponent(genre)}`;
    }

    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get popular tracks');
    }

    const data = await response.json();
    return data.collection || [];
  } catch (error) {
    console.error('Error getting popular tracks:', error);
    return [];
  }
}

/**
 * Format duration from milliseconds to MM:SS
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Get artwork URL with better resolution
 */
export function getArtworkUrl(track: SoundCloudTrack, size: 'small' | 'medium' | 'large' = 'large'): string {
  if (!track.artwork_url) {
    return track.user.avatar_url || '/default-artwork.png';
  }

  const sizeMap = {
    small: 't300x300',
    medium: 't500x500',
    large: 't500x500',
  };

  return track.artwork_url.replace('large', sizeMap[size]);
}
