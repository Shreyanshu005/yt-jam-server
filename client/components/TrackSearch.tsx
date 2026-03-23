import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { searchTracks, YTTrack, formatDuration, getThumbnailUrl } from '@/lib/ytmusicAPI';

interface TrackSearchProps {
  onTrackSelect: (track: YTTrack) => void;
  onAddToQueue: (track: YTTrack) => void;
}

const TrackSearch: React.FC<TrackSearchProps> = ({ onTrackSelect, onAddToQueue }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YTTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); setSearchError(null); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const tracks = await searchTracks(query, 10, 'songs');
        setResults(tracks);
        updatePosition();
        setShowResults(true);
      } catch (error: any) {
        setSearchError(error.message || 'Search failed');
        setResults([]);
      } finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, updatePosition]);

  useEffect(() => {
    if (showResults) {
      updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('scroll', handleResize, true); };
    }
  }, [showResults, updatePosition]);

  const handleTrackSelect = (track: YTTrack) => { onTrackSelect(track); setShowResults(false); setQuery(''); };
  const handleAddToQueue = (track: YTTrack, e: React.MouseEvent) => { e.stopPropagation(); onAddToQueue(track); };
  const handleFocus = () => { if (query && results.length > 0) { updatePosition(); setShowResults(true); } };

  const renderDropdown = () => {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <>
        {showResults && <div className="fixed inset-0 z-[9998]" onClick={() => setShowResults(false)} />}
        {showResults && results.length > 0 && (
          <div
            className="fixed z-[9999] glass-card max-h-[400px] overflow-y-auto"
            style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${dropdownPosition.width}px` }}
          >
            {results.map((track) => (
              <div key={track.videoId} className="flex items-center gap-3 p-3 hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.03] last:border-b-0 transition-colors">
                <div className="flex-1" onClick={() => handleTrackSelect(track)}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/[0.03] rounded-lg flex-shrink-0 overflow-hidden ring-1 ring-white/[0.04]">
                      {track.thumbnails && track.thumbnails.length > 0 ? (
                        <img src={getThumbnailUrl(track, 'small')} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-xs">{track.title}</p>
                      <p className="text-gray-500 text-[11px] truncate">{track.artist}</p>
                    </div>
                    <div className="text-gray-600 text-[10px] flex-shrink-0 font-mono">{formatDuration(track.durationSeconds)}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleAddToQueue(track, e)}
                  className="flex-shrink-0 p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.04] hover:border-red-500/20 transition-all"
                  title="Add to queue"
                >
                  <svg className="w-4 h-4 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {showResults && query && results.length === 0 && !isSearching && !searchError && (
          <div className="fixed z-[9999] glass-card p-5 text-center" style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${dropdownPosition.width}px` }}>
            <p className="text-gray-500 text-xs">No tracks found</p>
          </div>
        )}
        {showResults && searchError && (
          <div className="fixed z-[9999] glass-card border-red-500/20 p-5 text-center" style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${dropdownPosition.width}px` }}>
            <p className="text-red-400/70 text-xs">Error: {searchError}</p>
          </div>
        )}
      </>,
      document.body
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search songs on YouTube Music..."
          className="input-premium pl-10 text-sm"
        />
        <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>
      {renderDropdown()}
    </div>
  );
};

export default TrackSearch;
