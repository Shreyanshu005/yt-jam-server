import { useState, useEffect, useCallback } from 'react';
import { searchTracks, SoundCloudTrack, formatDuration, getArtworkUrl } from '@/lib/soundcloudAPI';

interface TrackSearchProps {
  onTrackSelect: (track: SoundCloudTrack) => void;
  onAddToQueue: (track: SoundCloudTrack) => void;
}

const TrackSearch: React.FC<TrackSearchProps> = ({ onTrackSelect, onAddToQueue }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SoundCloudTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const tracks = await searchTracks(query, 10);
        setResults(tracks);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleTrackSelect = (track: SoundCloudTrack) => {
    onTrackSelect(track);
    setShowResults(false);
    setQuery('');
  };

  const handleAddToQueue = (track: SoundCloudTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue(track);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search for tracks..."
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
          {results.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
            >
              <div className="flex-1" onClick={() => handleTrackSelect(track)}>
                <div className="flex items-center gap-3">
                  {/* Artwork */}
                  <div className="w-12 h-12 bg-gray-900 rounded flex-shrink-0 overflow-hidden">
                    {track.artwork_url || track.user.avatar_url ? (
                      <img
                        src={getArtworkUrl(track, 'small')}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = track.user.avatar_url || '';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{track.title}</p>
                    <p className="text-gray-400 text-sm truncate">{track.user.username}</p>
                  </div>

                  {/* Duration */}
                  <div className="text-gray-500 text-sm flex-shrink-0">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              </div>

              {/* Add to Queue Button */}
              <button
                onClick={(e) => handleAddToQueue(track, e)}
                className="flex-shrink-0 bg-gray-900 hover:bg-gray-600 p-2 rounded-lg transition-colors"
                title="Add to queue"
              >
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4">
          <p className="text-gray-400 text-center">No tracks found</p>
        </div>
      )}

      {/* Backdrop to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default TrackSearch;
