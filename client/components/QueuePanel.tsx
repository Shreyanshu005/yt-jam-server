import { SoundCloudTrack, formatDuration, getArtworkUrl } from '@/lib/soundcloudAPI';

interface QueuePanelProps {
  queue: SoundCloudTrack[];
  currentTrack: SoundCloudTrack | null;
  onTrackSelect: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onClearQueue: () => void;
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
}

const QueuePanel: React.FC<QueuePanelProps> = ({
  queue,
  currentTrack,
  onTrackSelect,
  onRemoveTrack,
  onClearQueue,
  onMoveTrack,
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Queue</h3>
          <p className="text-xs text-gray-400">
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>
        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Current Track */}
      {currentTrack && (
        <div className="p-4 bg-gradient-to-r from-orange-900/20 to-transparent border-b border-gray-700">
          <p className="text-xs text-orange-400 mb-2 font-semibold">NOW PLAYING</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-900 rounded flex-shrink-0 overflow-hidden">
              {currentTrack.artwork_url || currentTrack.user.avatar_url ? (
                <img
                  src={getArtworkUrl(currentTrack, 'small')}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = currentTrack.user.avatar_url || '';
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
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate text-sm">{currentTrack.title}</p>
              <p className="text-gray-400 text-xs truncate">{currentTrack.user.username}</p>
            </div>
            <div className="flex items-center gap-1 text-orange-500 flex-shrink-0">
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Queue is empty</p>
            <p className="text-gray-500 text-xs mt-1">Search and add tracks to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {queue.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-lg cursor-pointer group mb-1"
              >
                {/* Queue Number */}
                <div className="w-6 text-center text-gray-500 text-sm font-mono flex-shrink-0">
                  {index + 1}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0" onClick={() => onTrackSelect(index)}>
                  <p className="text-white text-sm truncate">{track.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="truncate">{track.user.username}</span>
                    <span>•</span>
                    <span className="flex-shrink-0">{formatDuration(track.duration)}</span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveTrack(index)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-red-500/20 rounded transition-all"
                  title="Remove from queue"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue Info Footer */}
      {queue.length > 0 && (
        <div className="p-3 border-t border-gray-700 bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total duration</span>
            <span className="font-mono">
              {formatDuration(queue.reduce((acc, track) => acc + track.duration, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueuePanel;
