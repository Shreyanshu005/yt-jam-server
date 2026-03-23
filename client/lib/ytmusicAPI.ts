// YouTube Music API service
// Uses server-side proxy for ytmusic-api requests

export interface YTTrack {
  videoId: string;
  title: string;
  artist: string;
  durationSeconds: number | null;
  thumbnails: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  type: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

/**
 * Search for tracks on YouTube Music
 */
export async function searchTracks(query: string, limit: number = 20, filter: 'songs' | 'videos' | 'all' = 'songs'): Promise<YTTrack[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${SERVER_URL}/api/ytmusic/search?q=${encodeURIComponent(query)}&limit=${limit}&filter=${filter}`
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
 * Get video details from videoId
 */
export async function getVideoDetails(videoId: string): Promise<YTTrack | null> {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/ytmusic/video?videoId=${encodeURIComponent(videoId)}`
    );

    if (!response.ok) {
      throw new Error('Failed to get video details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting video details:', error);
    return null;
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${SERVER_URL}/api/ytmusic/suggestions?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '--:--';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get the best thumbnail URL for a track
 */
export function getThumbnailUrl(track: YTTrack, size: 'small' | 'medium' | 'large' = 'medium'): string {
  if (!track.thumbnails || track.thumbnails.length === 0) {
    return '/default-artwork.png';
  }

  // Sort thumbnails by size
  const sorted = [...track.thumbnails].sort((a, b) => a.width - b.width);

  switch (size) {
    case 'small':
      return sorted[0]?.url || sorted[sorted.length - 1]?.url || '/default-artwork.png';
    case 'medium':
      return sorted[Math.floor(sorted.length / 2)]?.url || sorted[0]?.url || '/default-artwork.png';
    case 'large':
      return sorted[sorted.length - 1]?.url || sorted[0]?.url || '/default-artwork.png';
    default:
      return sorted[0]?.url || '/default-artwork.png';
  }
}
