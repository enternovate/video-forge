import { forwardRef, useEffect, useRef, useCallback } from "react";
import type { VideoProject } from "../types/video";

interface PlayerProps {
  currentTime: number;
  playing: boolean;
  project: VideoProject;
  selectedClipId: string | null;
}

export const Player = forwardRef<HTMLCanvasElement, PlayerProps>(
  ({ currentTime, playing, project, selectedClipId }, ref) => {
    const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
    const animRef = useRef<number>(0);

    // Find clip at current time
    const getActiveClips = useCallback((time: number) => {
      const clips: { trackIndex: number; clip: typeof project.tracks[0]['clips'][0] }[] = [];
      project.tracks.forEach((track, ti) => {
        if (track.muted || track.type === 'audio') return;
        track.clips.forEach((clip) => {
          if (time >= clip.startTime && time <= clip.startTime + clip.duration) {
            clips.push({ trackIndex: ti, clip });
          }
        });
      });
      return clips;
    }, [project.tracks]);

    // Render current frame
    const renderFrame = useCallback(async (time: number) => {
      const canvas = ref as React.RefObject<HTMLCanvasElement | null>;
      if (!canvas.current) return;
      const ctx = canvas.current.getContext('2d');
      if (!ctx) return;

      canvas.current.width = project.width;
      canvas.current.height = project.height;
      ctx.clearRect(0, 0, project.width, project.height);

      const activeClips = getActiveClips(time);

      // Render each active clip layered by track order
      for (const { clip } of activeClips) {
        ctx.save();

        const clipTime = time - clip.startTime;
        const opacity = clip.opacity ?? 1;

        // Handle transitions
        if (clip.transitions?.start && clipTime < clip.transitions.start.duration) {
          const progress = clipTime / clip.transitions.start.duration;
          if (clip.transitions.start.type === 'fade-in') ctx.globalAlpha = opacity * progress;
        }
        if (clip.transitions?.end && clipTime > clip.duration - clip.transitions.end.duration) {
          const progress = (clip.duration - clipTime) / clip.transitions.end.duration;
          if (clip.transitions.end.type === 'fade-out') ctx.globalAlpha = opacity * progress;
        }

        // Scale and position
        const sx = clip.scale || 1;
        const cx = clip.x || 0;
        const cy = clip.y || 0;
        const rot = clip.rotation || 0;

        ctx.translate(project.width / 2 + cx, project.height / 2 + cy);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.scale(sx, sx);

        if (clip.type === 'text' && clip.textContent) {
          ctx.fillStyle = clip.textColor || '#ffffff';
          ctx.font = `${clip.textSize || 48}px ${clip.textFont || 'Arial'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(clip.textContent, 0, 0);
        } else if (clip.sourcePath) {
          // Try to use video element or fallback to placeholder
          const vid = videoElementsRef.current.get(clip.id);
          if (vid && vid.readyState >= 2) {
            ctx.drawImage(vid, -project.width / 2, -project.height / 2, project.width, project.height);
          } else {
            // Placeholder: colored rect with label
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(-project.width / 2, -project.height / 2, project.width, project.height);
            ctx.fillStyle = '#718096';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(clip.name, 0, 0);
          }
        }

        ctx.restore();

        // Selection highlight
        if (clip.id === selectedClipId) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.strokeRect(1, 1, project.width - 2, project.height - 2);
        }
      }

      // Timecode overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(8, 8, 100, 24);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(formatTime(time), 14, 13);
    }, [project, selectedClipId, ref]);

    // Playback loop
    useEffect(() => {
      if (!playing) {
        cancelAnimationFrame(animRef.current);
        return;
      }

      const startTime = performance.now();
      const startCurrent = currentTime;
      let running = true;

      const loop = () => {
        if (!running) return;
        const elapsed = (performance.now() - startTime) / 1000;
        const newTime = startCurrent + elapsed;
        if (newTime > project.duration) {
          // Stop at end
          return;
        }
        renderFrame(newTime);
        animRef.current = requestAnimationFrame(loop);
      };

      animRef.current = requestAnimationFrame(loop);
      return () => { running = false; cancelAnimationFrame(animRef.current); };
    }, [playing, currentTime, project.duration, renderFrame]);

    // Render on seek
    useEffect(() => {
      if (!playing) renderFrame(currentTime);
    }, [currentTime, playing, renderFrame]);

    return (
      <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
        <canvas
          ref={ref}
          className="player-canvas max-w-full max-h-full"
          style={{ aspectRatio: `${project.width}/${project.height}` }}
        />
        {!project.tracks.some(t => t.clips.length > 0) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-700 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <p className="text-gray-600 text-sm">Import media and drag to the timeline</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
