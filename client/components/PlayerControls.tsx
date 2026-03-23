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
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  hasNext,
  hasPrevious,
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
    const newTime = percentage * duration;
    onSeek(newTime);
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
    if (isDragging) {
      onSeek(dragTime);
      setIsDragging(false);
    }
  }, [isDragging, dragTime, onSeek]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const displayTime = isDragging ? dragTime : currentTime;

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
      {/* Current Track Info */}
      {currentTrack && (
        <div className="flex items-center gap-4 mb-4">
          {/* Thumbnail */}
          <div className="w-16 h-16 bg-gray-900 rounded-lg flex-shrink-0 overflow-hidden shadow-lg">
            {currentTrack.thumbnails && currentTrack.thumbnails.length > 0 ? (
              <img
                src={getThumbnailUrl(currentTrack, 'medium')}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
            )}
          </div>

          {/* Track Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{currentTrack.title}</h3>
            <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
            {currentTrack.type && (
              <p className="text-gray-500 text-xs mt-1">
                <span className="bg-gray-700 px-2 py-0.5 rounded-full">{currentTrack.type}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Seek Bar */}
      {currentTrack && (
        <div className="mb-4">
          <div
            ref={progressRef}
            className="h-2 bg-gray-700 rounded-full cursor-pointer group relative"
            onClick={handleProgressClick}
            onMouseDown={handleMouseDown}
          >
            {/* Progress Fill */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all group-hover:from-red-400 group-hover:to-red-500"
              style={{ width: `${progress}%` }}
            />
            
            {/* Drag Handle */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{formatDuration(Math.floor(displayTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="p-3 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
          title="Previous track"
        >
          <svg className="w-6 h-6 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          className="p-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-3 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
          title="Next track"
        >
          <svg className="w-6 h-6 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
          </svg>
        </button>
      </div>

      {/* Playback Status */}
      {!currentTrack && (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">No track selected</p>
          <p className="text-gray-500 text-xs mt-1">Search for a track to start playing</p>
        </div>
      )}
    </div>
  );
};

export default PlayerControls;
