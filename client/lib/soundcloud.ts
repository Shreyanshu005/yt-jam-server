/**
 * Extract SoundCloud track URL or validate URL format
 */
export const extractTrackUrl = (url: string): string | null => {
  if (!url) return null;

  // Check if it's a valid SoundCloud URL
  const soundcloudPattern = /^https?:\/\/(www\.)?(soundcloud\.com|snd\.sc)\/.+/;

  if (soundcloudPattern.test(url)) {
    return url;
  }

  return null;
};

/**
 * Validate if a URL is a valid SoundCloud URL
 */
export const isValidSoundCloudUrl = (url: string): boolean => {
  if (!url) return false;
  const soundcloudPattern = /^https?:\/\/(www\.)?(soundcloud\.com|snd\.sc)\/.+/;
  return soundcloudPattern.test(url);
};

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 */
export const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};
