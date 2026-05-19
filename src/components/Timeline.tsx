import { useRef, useCallback, useState, useEffect } from "react";
import type { Track, Clip, MediaItem } from "../types/video";
import { formatTime, generateId, COLOR_PALETTE } from "../lib/utils";

interface TimelineProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoom: number;
  snapEnabled: boolean;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  onSelectClip: (id: string | null) => void;
  onSelectTrack: (id: string | null) => void;
  onSeek: (t: number) => void;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onDeleteClip: (id: string) => void;
  onAddTrack: (type: Track['type']) => void;
  onDeleteTrack: (id: string) => void;
  onDropMedia: (mediaId: string, trackId: string, time: number) => void;
  mediaBin: MediaItem[];
}

const TRACK_H = 48;
const HEADER_H = 24;
const RULER_H = 24;

export function Timeline({
  tracks, currentTime, duration, zoom, snapEnabled,
  selectedClipId, selectedTrackId,
  onSelectClip, onSelectTrack, onSeek, onUpdateClip, onDeleteClip,
  onAddTrack, onDeleteTrack, onDropMedia, mediaBin,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'trim-start' | 'trim-end';
    clipId: string;
    startX: number;
    origStart: number;
    origDuration: number;
    origOffset: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ trackId: string; time: number } | null>(null);

  const totalWidth = Math.max(duration * zoom, containerRef.current?.clientWidth || 800);

  // Snap to clip edges
  const snapTime = useCallback((t: number) => {
    if (!snapEnabled) return t;
    const snapPoints = new Set<number>();
    snapPoints.add(0);
    snapPoints.add(duration);
    tracks.forEach(track => track.clips.forEach(c => {
      snapPoints.add(c.startTime);
      snapPoints.add(c.startTime + c.duration);
    }));
    for (const pt of snapPoints) {
      if (Math.abs(t - pt) < 0.5) return pt;
    }
    return Math.round(t * 30) / 30; // snap to frame
  }, [tracks, duration, snapEnabled]);

  // Mouse handlers for clip drag
  const handleClipMouseDown = useCallback((e: React.MouseEvent, clip: Clip, edge: 'body' | 'start' | 'end') => {
    e.stopPropagation();
    if (edge === 'start') {
      setDragState({ type: 'trim-start', clipId: clip.id, startX: e.clientX, origStart: clip.startTime, origDuration: clip.duration, origOffset: clip.offset });
    } else if (edge === 'end') {
      setDragState({ type: 'trim-end', clipId: clip.id, startX: e.clientX, origStart: clip.startTime, origDuration: clip.duration, origOffset: clip.offset });
    } else {
      setDragState({ type: 'move', clipId: clip.id, startX: e.clientX, origStart: clip.startTime, origDuration: clip.duration, origOffset: clip.offset });
    }
    onSelectClip(clip.id);
  }, [onSelectClip]);

  // Drag handling
  useEffect(() => {
    if (!dragState) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragState.startX) / zoom;
      if (dragState.type === 'move') {
        const newStart = snapTime(dragState.origStart + dx);
        onUpdateClip(dragState.clipId, { startTime: Math.max(0, newStart) });
      } else if (dragState.type === 'trim-start') {
        const dt = (e.clientX - dragState.startX) / zoom;
        const newStart = snapTime(dragState.origStart + dt);
        if (newStart < dragState.origStart + dragState.origDuration - 0.5) {
          onUpdateClip(dragState.clipId, {
            startTime: newStart,
            offset: dragState.origOffset + (newStart - dragState.origStart),
            duration: dragState.origDuration - (newStart - dragState.origStart),
          });
        }
      } else if (dragState.type === 'trim-end') {
        const dt = (e.clientX - dragState.startX) / zoom;
        const newDur = snapTime(dragState.origDuration + dt);
        if (newDur > 0.5) {
          onUpdateClip(dragState.clipId, { duration: newDur });
        }
      }
    };
    const handleUp = () => setDragState(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragState, zoom, snapTime, onUpdateClip]);

  // Drop from media bin
  const handleDrop = useCallback((e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    setDropTarget(null);
    const mediaId = e.dataTransfer.getData('text/plain');
    if (!mediaId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const time = Math.max(0, (e.clientX - rect.left + scrollLeft - 60) / zoom);
    onDropMedia(mediaId, trackId, snapTime(time));
  }, [zoom, snapTime, onDropMedia]);

  return (
    <div className="h-52 bg-gray-900 border-t border-gray-800 flex flex-col shrink-0" ref={containerRef}>
      {/* Ruler */}
      <div className="h-6 bg-gray-850 border-b border-gray-800 flex items-end relative" style={{ minWidth: totalWidth }}>
        <div className="absolute left-16 right-0 bottom-0 h-full">
          {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
            <div key={i} className="absolute bottom-0" style={{ left: i * zoom }}>
              <div className="h-2 w-px bg-gray-700" />
              {i % 5 === 0 && (
                <span className="text-[10px] text-gray-500 absolute -top-3.5 left-1 select-none">
                  {formatTime(i)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <div style={{ minWidth: totalWidth, minHeight: tracks.length * TRACK_H + 50 }} className="relative">
          {/* Track backgrounds */}
          {tracks.map((track, ti) => (
            <div
              key={track.id}
              className={`absolute left-16 right-0 h-12 border-b border-gray-800 flex ${
                selectedTrackId === track.id ? 'bg-blue-900/10' : 'bg-gray-900/50'
              }`}
              style={{ top: ti * TRACK_H + 2 }}
              onClick={() => onSelectTrack(track.id)}
              onDragOver={(e) => {
                e.preventDefault();
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const scrollLeft = containerRef.current?.scrollLeft || 0;
                const time = Math.max(0, (e.clientX - rect.left + scrollLeft - 60) / zoom);
                setDropTarget({ trackId: track.id, time });
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, track.id)}
            >
              {/* Track label */}
              <div className="absolute -left-16 w-16 h-full flex items-center px-2 bg-gray-850 border-r border-gray-800 z-10">
                <span className="text-[10px] text-gray-500 truncate">{track.name}</span>
              </div>

              {/* Drop indicator */}
              {dropTarget?.trackId === track.id && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20" style={{ left: dropTarget.time * zoom }} />
              )}
            </div>
          ))}

          {/* Clips */}
          {tracks.map((track, ti) =>
            track.clips.map((clip, ci) => {
              const left = clip.startTime * zoom;
              const width = clip.duration * zoom;
              const top = ti * TRACK_H + 4;
              const colorIdx = (ci + ti * 3) % COLOR_PALETTE.length;
              const color = COLOR_PALETTE[colorIdx];
              const isSelected = clip.id === selectedClipId;

              return (
                <div
                  key={clip.id}
                  className={`timeline-clip absolute ${isSelected ? 'selected' : ''}`}
                  style={{
                    left, top, width: Math.max(width, 8),
                    height: TRACK_H - 8,
                    background: `${color}22`,
                    borderLeft: `3px solid ${color}`,
                    zIndex: isSelected ? 10 : 1,
                  }}
                  onMouseDown={(e) => handleClipMouseDown(e, clip, 'body')}
                  onClick={() => onSelectClip(clip.id)}
                >
                  {/* Trim handles */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-white/20"
                    onMouseDown={(e) => handleClipMouseDown(e, clip, 'start')}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-white/20"
                    onMouseDown={(e) => handleClipMouseDown(e, clip, 'end')}
                  />

                  {/* Clip label */}
                  <div className="px-2 py-1 text-[11px] text-gray-300 truncate select-none">
                    {clip.name}
                  </div>

                  {/* Clip duration */}
                  <div className="px-2 text-[10px] text-gray-500 select-none">
                    {formatTime(clip.duration)}
                  </div>

                  {/* Delete button */}
                  {isSelected && (
                    <button
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500"
                      onClick={(e) => { e.stopPropagation(); onDeleteClip(clip.id); }}
                    >
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </div>
              );
            })
          )}

          {/* Playhead */}
          <div className="playhead" style={{ left: currentTime * zoom, height: tracks.length * TRACK_H + 20 }} />

          {/* Add track button */}
          <div className="absolute bottom-1 left-2 z-10 flex gap-1">
            <button onClick={() => onAddTrack('video')} className="text-[10px] px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400">
              + Video Track
            </button>
            <button onClick={() => onAddTrack('audio')} className="text-[10px] px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400">
              + Audio Track
            </button>
            <button onClick={() => onAddTrack('text')} className="text-[10px] px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400">
              + Text Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
