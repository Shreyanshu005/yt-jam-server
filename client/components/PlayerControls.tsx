import { useState, useEffect, useRef, useCallback } from 'react';
import { YTTrack, getThumbnailUrl, formatDuration } from '@/lib/ytmusicAPI';

interface PlayerControlsProps {
  currentTrack: YTTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack, isPlaying, currentTime, duration,
  onPlayPause, onNext, onPrevious, onSeek, hasNext, hasPrevious,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (isDragging ? dragTime / duration : currentTime / duration) * 100 : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  }, [duration, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    setIsDragging(true);
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setDragTime(percentage * duration);
  }, [duration]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setDragTime(percentage * duration);
  }, [isDragging, duration]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) { onSeek(dragTime); setIsDragging(false); }
  }, [isDragging, dragTime, onSeek]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const displayTime = isDragging ? dragTime : currentTime;

  return (
    <div className="glass-card p-5">
      {/* Current Track Info */}
      {currentTrack && (
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-white/[0.03] rounded-xl flex-shrink-0 overflow-hidden shadow-lg ring-1 ring-white/[0.05]">
            {currentTrack.thumbnails && currentTrack.thumbnails.length > 0 ? (
              <img src={getThumbnailUrl(currentTrack, 'medium')} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate text-sm">{currentTrack.title}</h3>
            <p className="text-gray-500 text-xs truncate mt-0.5">{currentTrack.artist}</p>
          </div>
        </div>
      )}

      {/* Seek Bar */}
      {currentTrack && (
        <div className="mb-5">
          <div
            ref={progressRef}
            className="h-1.5 bg-white/[0.06] rounded-full cursor-pointer group relative"
            onClick={handleProgressClick}
            onMouseDown={handleMouseDown}
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono">
            <span>{formatDuration(Math.floor(displayTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="p-2.5 rounded-full hover:bg-white/[0.05] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          className="p-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600 glow-red hover:glow-red-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-2.5 rounded-full hover:bg-white/[0.05] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
          </svg>
        </button>
      </div>

      {!currentTrack && (
        <div className="text-center py-6">
          <p className="text-gray-600 text-xs">No track selected</p>
          <p className="text-gray-700 text-[10px] mt-1">Search for a track to start playing</p>
        </div>
      )}
    </div>
  );
};

export default PlayerControls;
