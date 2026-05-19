import type { MediaItem, Track } from "../types/video";

interface MediaBinProps {
  items: MediaItem[];
  onImport: () => void;
  onDragToTimeline: (mediaId: string, trackId: string, time: number) => void;
  tracks: Track[];
}

export function MediaBin({ items, onImport, onDragToTimeline, tracks }: MediaBinProps) {
  return (
    <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Media</span>
        <button onClick={onImport} className="text-blue-400 hover:text-blue-300 text-xs" title="Import media">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto text-gray-700 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="12" x2="17" y2="12" />
            </svg>
            <p className="text-xs text-gray-600">Import media to get started</p>
            <button onClick={onImport} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
              Browse files...
            </button>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 cursor-grab active:cursor-grabbing group"
          >
            {/* Type icon */}
            <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
              {item.type === 'video' && (
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              {item.type === 'audio' && (
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              )}
              {item.type === 'image' && (
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate">{item.name}</p>
              <p className="text-[10px] text-gray-600">
                {item.type} {item.duration ? `· ${item.duration.toFixed(1)}s` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Drag hint */}
      <div className="px-3 py-2 border-t border-gray-800">
        <p className="text-[10px] text-gray-600 text-center">Drag media to the timeline</p>
      </div>
    </div>
  );
}
