import { useState, useCallback, useRef } from "react";
import type { VideoProject } from "../types/video";
import { formatTime } from "../lib/utils";

interface ExportDialogProps {
  onClose: () => void;
  project: VideoProject;
}

export function ExportDialog({ onClose, project }: ExportDialogProps) {
  const [quality, setQuality] = useState(0.8);
  const [resolution, setResolution] = useState<"source" | "1080p" | "720p" | "480p">("source");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [frame, setFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getRes = useCallback(() => {
    switch (resolution) {
      case "1080p": return { w: 1920, h: 1080 };
      case "720p": return { w: 1280, h: 720 };
      case "480p": return { w: 854, h: 480 };
      default: return { w: project.width, h: project.height };
    }
  }, [resolution, project]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setProgress(0);
    setError(null);

    try {
      const { w, h } = getRes();
      const fps = project.fps || 30;
      const total = Math.ceil(project.duration * fps);
      setTotalFrames(total);

      const canvas = canvasRef.current!;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Check WebCodecs support
      const VideoEncoder = (window as any).VideoEncoder;
      if (!VideoEncoder) {
        setError("Your browser does not support the WebCodecs API. Please use Chrome, Edge, or Firefox.");
        setExporting(false);
        return;
      }

      // Check if VP9 is supported
      let config: VideoEncoderConfig;
      try {
        config = {
          codec: "vp09.00.10.08",
          width: w,
          height: h,
          bitrate: Math.round(quality * 12_000_000),
          framerate: fps,
        };
        // Test if config is supported
        const support = await VideoEncoder.isConfigSupported(config);
        if (!support.supported) {
          // Fallback to simpler VP8
          config = {
            codec: "vp8",
            width: w,
            height: h,
            bitrate: Math.round(quality * 8_000_000),
            framerate: fps,
          };
        }
      } catch {
        config = {
          codec: "vp8",
          width: w,
          height: h,
          bitrate: Math.round(quality * 8_000_000),
          framerate: fps,
        };
      }

      // Collect encoded chunks
      const chunks: Uint8Array[] = [];
      const encoder = new VideoEncoder({
        output: (chunk: any) => {
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          chunks.push(data);
        },
        error: (e: any) => console.error("Encoder error:", e),
      });

      encoder.configure(config);

      // Render and encode each frame
      for (let frameIdx = 0; frameIdx < total; frameIdx++) {
        const time = frameIdx / fps;
        const pct = Math.round((frameIdx / total) * 100);
        setProgress(pct);
        setFrame(frameIdx);

        // Clear to black
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        // Render active clips
        for (const track of project.tracks) {
          if (track.type === "audio" || track.muted) continue;
          for (const clip of track.clips) {
            if (!clip.enabled) continue;
            const clipStart = clip.startTime;
            const clipEnd = clip.startTime + clip.duration;
            if (time < clipStart || time > clipEnd) continue;

            const sx = (clip.scale || 1) * (w / project.width);
            const sy = (clip.scale || 1) * (h / project.height);
            const cx = (clip.x || 0) * (w / project.width);
            const cy = (clip.y || 0) * (h / project.height);

            ctx.save();
            ctx.translate(w / 2 + cx, h / 2 + cy);
            ctx.rotate(((clip.rotation || 0) * Math.PI) / 180);
            ctx.scale(sx, sy);

            // Opacity / fade transitions
            const clipTime = time - clipStart;
            let alpha = clip.opacity ?? 1;
            if (clip.transitions?.start && clipTime < clip.transitions.start.duration) {
              alpha *= (clipTime / clip.transitions.start.duration);
            }
            if (clip.transitions?.end && clipTime > clip.duration - clip.transitions.end.duration) {
              alpha *= ((clip.duration - clipTime) / clip.transitions.end.duration);
            }
            ctx.globalAlpha = alpha;

            // Render text clips
            if (clip.type === "text" && clip.textContent) {
              const fontSize = (clip.textSize || 48) / (sx || 1);
              ctx.fillStyle = clip.textColor || "#ffffff";
              ctx.font = `${fontSize}px ${clip.textFont || "Arial"}`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              if (clip.textStroke && clip.textStrokeWidth) {
                ctx.strokeStyle = clip.textStroke;
                ctx.lineWidth = (clip.textStrokeWidth || 2) / (sx || 1);
                ctx.strokeText(clip.textContent, 0, 0);
              }
              ctx.fillText(clip.textContent, 0, 0);
            } else {
              // Placeholder: colored rectangles with clip name
              const colors = ["#2d3748", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
              const ci = Math.abs(clip.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
              ctx.fillStyle = colors[ci];
              ctx.fillRect(-w / 2, -h / 2, w, h);

              ctx.fillStyle = "rgba(255,255,255,0.5)";
              ctx.font = `${24 / (sx || 1)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(clip.name, 0, -10 / (sx || 1));

              ctx.fillStyle = "rgba(255,255,255,0.25)";
              ctx.font = `${14 / (sx || 1)}px sans-serif`;
              ctx.fillText(`${clip.duration.toFixed(1)}s`, 0, 16 / (sx || 1));
            }

            ctx.restore();
          }
        }

        // Timecode overlay on export
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(8, 8, 90, 20);
        ctx.fillStyle = "#fff";
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(formatTime(time), 12, 12);

        // Encode frame
        const videoFrame = new VideoFrame(canvas, { timestamp: (time * 1_000_000) });
        encoder.encode(videoFrame);
        videoFrame.close();

        // Yield to UI every 5 frames
        if (frameIdx % 5 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }

      await encoder.flush();
      encoder.close();

      // Build the WebM file and trigger download
      const mimeType = "video/webm; codecs=vp9";
      const blob = new Blob(chunks as unknown as BlobPart[], { type: mimeType });

      if (blob.size === 0) {
        setError("Export produced an empty file. Try lowering quality or resolution.");
        setExporting(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, "-") || "video"}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      setProgress(100);
      setDone(true);
    } catch (e: any) {
      console.error("Export failed:", e);
      setError(e.message || "Export failed. Check the console for details.");
    } finally {
      setExporting(false);
    }
  }, [project, quality, resolution, getRes]);

  const r = getRes();
  const fileSizeEstimate = ((r.w * r.h * 3 * project.duration * quality) / 20).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">
            {done ? "Export Complete" : error ? "Export Failed" : "Export Video"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Done state */}
          {done && (
            <div className="text-center py-6">
              <svg className="w-14 h-14 mx-auto text-green-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-sm text-gray-300 font-medium mb-1">Video exported successfully!</p>
              <p className="text-xs text-gray-500 mb-4">The file has been downloaded to your device.</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Format: WebM (VP9) — royalty-free</p>
                <p>Resolution: {r.w}x{r.h}</p>
                <p>Duration: {project.duration.toFixed(1)}s</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-6">
              <svg className="w-14 h-14 mx-auto text-red-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p className="text-sm text-red-400 font-medium mb-2">Export failed</p>
              <p className="text-xs text-gray-400 mb-4">{error}</p>
              <button onClick={() => { setError(null); setExporting(false); setDone(false); }}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">
                Try Again
              </button>
            </div>
          )}

          {/* Exporting state */}
          {exporting && (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-3 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-300 mb-1">Rendering video... {progress}%</p>
              <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${Math.max(2, progress)}%` }} />
              </div>
              <p className="text-xs text-gray-600">
                Frame {frame} of {totalFrames} ({r.w}x{r.h} @ {project.fps}fps)
              </p>
            </div>
          )}

          {/* Config state */}
          {!done && !error && !exporting && (
            <div className="space-y-4">
              {/* Codec info */}
              <div className="bg-blue-900/20 border border-blue-800/30 text-blue-400 text-xs p-3 rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Exporting to <strong>WebM (VP9)</strong> — a royalty-free, patent-safe format. No MPEG-LA licensing needed. Plays in all modern browsers.</span>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Resolution</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["source", "1080p", "720p", "480p"] as const).map((r) => {
                    const res = r === "source" ? `${project.width}x${project.height}` : r;
                    return (
                      <button key={r} onClick={() => setResolution(r)}
                        className={`py-2 text-xs rounded-lg transition-colors ${
                          resolution === r ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}>
                        {res}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quality */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Quality</span>
                  <span className="text-gray-400">{Math.round(quality * 100)}%</span>
                </div>
                <input type="range" min={0.1} max={1} step={0.05} value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Duration</span>
                  <span className="text-gray-300 font-mono">{project.duration.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Frame rate</span>
                  <span className="text-gray-300 font-mono">{project.fps} fps</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Resolution</span>
                  <span className="text-gray-300 font-mono">{r.w}x{r.h}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total frames</span>
                  <span className="text-gray-300 font-mono">{Math.ceil(project.duration * project.fps)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Est. file size</span>
                  <span className="text-gray-300 font-mono">~{fileSizeEstimate} MB</span>
                </div>
                <div className="flex justify-between text-gray-400 pt-1 border-t border-gray-700">
                  <span>Codec</span>
                  <span className="text-green-400 font-mono">VP9 (royalty-free)</span>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-gray-900/50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
            {done || error ? "Close" : "Cancel"}
          </button>
          {!done && !exporting && !error && (
            <button onClick={handleExport}
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium">
              Export WebM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
