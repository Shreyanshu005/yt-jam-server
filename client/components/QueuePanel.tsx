import { YTTrack, formatDuration, getThumbnailUrl } from '@/lib/ytmusicAPI';

interface QueuePanelProps {
  queue: YTTrack[];
  currentTrack: YTTrack | null;
  onTrackSelect: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onClearQueue: () => void;
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
}

const QueuePanel: React.FC<QueuePanelProps> = ({
  queue, currentTrack, onTrackSelect, onRemoveTrack, onClearQueue, onMoveTrack,
}) => {
  return (
    <div className="glass-card flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Queue</h3>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>
        {queue.length > 0 && (
          <button onClick={onClearQueue} className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors uppercase tracking-wider font-medium">
            Clear
          </button>
        )}
      </div>

      {/* Now Playing */}
      {currentTrack && (
        <div className="px-4 py-3 bg-gradient-to-r from-red-500/[0.06] to-transparent border-b border-white/[0.04]">
          <p className="text-[9px] text-red-400/70 mb-2 font-semibold uppercase tracking-wider">Now Playing</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/[0.03] rounded-lg flex-shrink-0 overflow-hidden ring-1 ring-white/[0.05]">
              {currentTrack.thumbnails && currentTrack.thumbnails.length > 0 ? (
                <img src={getThumbnailUrl(currentTrack, 'small')} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate text-xs">{currentTrack.title}</p>
              <p className="text-gray-500 text-[10px] truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-1 text-red-400/60 flex-shrink-0">
              <div className="flex items-end gap-[2px] h-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-[3px] bg-red-400/60 rounded-full animate-pulse" style={{
                    height: `${8 + Math.random() * 6}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${0.6 + i * 0.1}s`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-12 h-12 bg-white/[0.02] rounded-xl flex items-center justify-center mb-3 border border-white/[0.04]">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-gray-500 text-xs">Queue is empty</p>
            <p className="text-gray-700 text-[10px] mt-1">Search and add tracks</p>
          </div>
        ) : (
          <div className="p-1.5">
            {queue.map((track, index) => (
              <div
                key={`${track.videoId}-${index}`}
                className="flex items-center gap-2.5 p-2 hover:bg-white/[0.03] rounded-lg cursor-pointer group mb-0.5 transition-colors"
              >
                <div className="w-5 text-center text-gray-600 text-[10px] font-mono flex-shrink-0">
                  {index + 1}
                </div>
                <div className="w-9 h-9 bg-white/[0.03] rounded-lg flex-shrink-0 overflow-hidden ring-1 ring-white/[0.03]">
                  {track.thumbnails && track.thumbnails.length > 0 ? (
                    <img src={getThumbnailUrl(track, 'small')} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0" onClick={() => onTrackSelect(index)}>
                  <p className="text-white text-[11px] truncate font-medium">{track.title}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <span className="truncate">{track.artist}</span>
                    <span>·</span>
                    <span className="flex-shrink-0 font-mono">{formatDuration(track.durationSeconds)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveTrack(index)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-red-500/10 rounded-md transition-all"
                >
                  <svg className="w-3.5 h-3.5 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {queue.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between text-[10px] text-gray-600">
            <span>Total</span>
            <span className="font-mono">{formatDuration(queue.reduce((acc, track) => acc + (track.durationSeconds || 0), 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueuePanel;
