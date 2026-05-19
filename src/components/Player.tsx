import { forwardRef, useEffect, useRef, useCallback } from "react";
import type { VideoProject } from "../types/video";
import { applyColorPipeline, type FilterPreset, type ColorChannel, type SplitTone } from "../lib/utils";

interface PlayerProps {
  currentTime: number;
  playing: boolean;
  project: VideoProject;
  selectedClipId: string | null;
  activeFilter?: FilterPreset | null;
  activeHSL?: Record<string, ColorChannel> | null;
  activeSplitTone?: SplitTone | null;
}

export const Player = forwardRef<HTMLCanvasElement, PlayerProps>(
  ({ currentTime, playing, project, selectedClipId, activeFilter, activeHSL, activeSplitTone }, ref) => {
    const animRef = useRef<number>(0);
    const currentTimeRef = useRef(currentTime);
    currentTimeRef.current = currentTime;

    const getActiveClips = useCallback((time: number) => {
      const clips: { trackIndex: number; clip: typeof project.tracks[0]['clips'][0] }[] = [];
      project.tracks.forEach((track, ti) => {
        if (track.muted || track.type === 'audio') return;
        track.clips.forEach((clip) => {
          if (!clip.enabled) return;
          if (time >= clip.startTime && time <= clip.startTime + clip.duration) {
            clips.push({ trackIndex: ti, clip });
          }
        });
      });
      return clips;
    }, [project.tracks]);

    const renderFrame = useCallback((time: number) => {
      const canvas = ref as React.RefObject<HTMLCanvasElement | null>;
      if (!canvas.current) return;
      const ctx = canvas.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.current.width = project.width;
      canvas.current.height = project.height;
      ctx.clearRect(0, 0, project.width, project.height);

      const activeClips = getActiveClips(time);

      for (const { clip } of activeClips) {
        ctx.save();
        const clipTime = time - clip.startTime;
        const opacity = clip.opacity ?? 1;

        // Transitions (fade)
        if (clip.transitions?.start && clipTime < clip.transitions.start.duration) {
          const p = clipTime / clip.transitions.start.duration;
          ctx.globalAlpha = opacity * p;
        } else if (clip.transitions?.end && clipTime > clip.duration - clip.transitions.end.duration) {
          const p = (clip.duration - clipTime) / clip.transitions.end.duration;
          ctx.globalAlpha = opacity * p;
        } else {
          ctx.globalAlpha = opacity;
        }

        // Transform
        const sx = clip.scale || 1;
        ctx.translate(project.width / 2 + (clip.x || 0), project.height / 2 + (clip.y || 0));
        ctx.rotate(((clip.rotation || 0) * Math.PI) / 180);
        ctx.scale(sx, sx);

        // Chroma key effect requires source content
        const hasChroma = clip.effects?.some(e => e.type === 'chromakey');
        const chromaEffect = clip.effects?.find(e => e.type === 'chromakey');

        // Render content
        if (clip.type === 'text' && clip.textContent) {
          const fontSize = (clip.textSize || 48) / (sx || 1);
          ctx.fillStyle = clip.textColor || '#ffffff';
          ctx.font = `${fontSize}px ${clip.textFont || 'Arial'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (clip.textStroke && clip.textStrokeWidth) {
            ctx.strokeStyle = clip.textStroke;
            ctx.lineWidth = (clip.textStrokeWidth || 2) / (sx || 1);
            ctx.strokeText(clip.textContent, 0, 0);
          }
          ctx.fillText(clip.textContent, 0, 0);
        } else {
          // Colored placeholder with clip name
          const colors = ['#2d3748', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
          const ci = Math.abs(clip.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
          ctx.fillStyle = colors[ci];
          ctx.fillRect(-project.width / 2, -project.height / 2, project.width, project.height);

          // Draw clip name
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(clip.name, 0, 0);

          // Draw duration
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = '14px sans-serif';
          ctx.fillText(`${clip.duration.toFixed(1)}s`, 0, 30);

          // Chroma key: replace green pixels with transparent
          if (hasChroma && chromaEffect) {
            const imgData = ctx.getImageData(-project.width / 2, -project.height / 2, project.width, project.height);
            const d = imgData.data;
            const threshold = chromaEffect.value || 0.3;
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i + 1], b = d[i + 2];
              // Green screen: high green, low red+blue
              if (g > 100 && g > r * 1.5 && g > b * 1.5) {
                d[i + 3] = 0; // transparent
              }
            }
            ctx.putImageData(imgData, -project.width / 2, -project.height / 2);
          }
        }

        ctx.restore();

        // Selection highlight
        if (clip.id === selectedClipId) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.strokeRect(1, 1, project.width - 2, project.height - 2);
        }

        // Apply color pipeline to entire frame after each clip (global color grade)
        if (activeFilter || (activeHSL && Object.values(activeHSL).some(c => c.hue || c.saturation || c.luminance)) || activeSplitTone) {
          const effects: Record<string, number> = {};
          if (activeFilter) {
            if (activeFilter.contrast) effects.contrast = activeFilter.contrast;
            if (activeFilter.saturation) effects.saturation = activeFilter.saturation;
            if (activeFilter.exposure) effects.exposure = activeFilter.exposure;
            if (activeFilter.temperature) effects.temperature = activeFilter.temperature;
            if (activeFilter.tint) effects.tint = activeFilter.tint;
            if (activeFilter.highlights) effects.highlights = activeFilter.highlights;
            if (activeFilter.shadows) effects.shadows = activeFilter.shadows;
            if (activeFilter.fade) effects.fade = activeFilter.fade;
            if (activeFilter.vignette) effects.vignette = activeFilter.vignette;
            if (activeFilter.grain) effects.grain = activeFilter.grain;
          }
          applyColorPipeline(ctx, project.width, project.height, effects,
            activeHSL || undefined, activeSplitTone || undefined, activeFilter || undefined);
        }

        // Selection indicator
        if (clip.id === selectedClipId) {
          ctx.save();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 4;
          ctx.strokeRect(2, 2, project.width - 4, project.height - 4);
          ctx.restore();
        }
      }

      // Timecode overlay
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.roundRect?.(8, 8, 100, 24, 4) ?? ctx.fillRect(8, 8, 100, 24);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(formatTime(time), 14, 13);
      ctx.restore();
    }, [project, selectedClipId, ref, getActiveClips, activeFilter, activeHSL, activeSplitTone]);

    // Playback loop
    useEffect(() => {
      if (!playing) { cancelAnimationFrame(animRef.current); return; }
      const startTime = performance.now();
      const startCurrent = currentTime;
      let running = true;
      const loop = () => {
        if (!running) return;
        const elapsed = (performance.now() - startTime) / 1000;
        const newTime = startCurrent + elapsed;
        if (newTime > project.duration) { renderFrame(project.duration); return; }
        renderFrame(newTime);
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
      return () => { running = false; cancelAnimationFrame(animRef.current); };
    }, [playing, currentTime, project.duration, renderFrame]);

    useEffect(() => { if (!playing) renderFrame(currentTime); }, [currentTime, playing, renderFrame]);

    return (
      <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
        <canvas ref={ref} className="player-canvas max-w-full max-h-full"
          style={{ aspectRatio: `${project.width}/${project.height}` }} />
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
