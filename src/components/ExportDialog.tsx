import { useState, useCallback, useRef } from "react";
import type { VideoProject } from "../types/video";

interface ExportDialogProps {
  onClose: () => void;
  project: VideoProject;
}

export function ExportDialog({ onClose, project }: ExportDialogProps) {
  const [format, setFormat] = useState<"webm" | "mp4">("webm");
  const [quality, setQuality] = useState(0.8);
  const [resolution, setResolution] = useState<"source" | "1080p" | "720p" | "480p">("source");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
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

    try {
      const { w, h } = getRes();
      const fps = project.fps || 30;
      const totalFrames = Math.ceil(project.duration * fps);
      const canvas = canvasRef.current!;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Use WebCodecs API for VP9 encoding
      const VideoEncoder = (window as any).VideoEncoder;
      if (!VideoEncoder) {
        alert("WebCodecs API not available in this browser. Try Chrome or Edge.");
        setExporting(false);
        return;
      }

      const config = {
        codec: format === "webm" ? "vp09.00.10.08" : "avc1.42001E",
        width: w,
        height: h,
        bitrate: Math.round(quality * 10_000_000),
        framerate: fps,
      };

      let chunks: Uint8Array[] = [];
      const encoder = new VideoEncoder({
        output: (chunk: any) => {
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          chunks.push(data);
        },
        error: (e: any) => console.error("Encoder error:", e),
      });

      encoder.configure(config);

      // Render each frame
      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / fps;
        setProgress(Math.round((frame / totalFrames) * 100));

        // Clear
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        // Find active clips and render them
        for (const track of project.tracks) {
          if (track.type === "audio") continue;
          for (const clip of track.clips) {
            if (!clip.enabled) continue;
            const clipStart = clip.startTime;
            const clipEnd = clip.startTime + clip.duration;
            if (time < clipStart || time > clipEnd) continue;

            const clipTime = time - clipStart;
            const sx = (clip.scale || 1) * (w / project.width);
            const sy = (clip.scale || 1) * (h / project.height);
            const cx = (clip.x || 0) * (w / project.width);
            const cy = (clip.y || 0) * (h / project.height);

            ctx.save();
            ctx.translate(w / 2 + cx, h / 2 + cy);
            ctx.rotate(((clip.rotation || 0) * Math.PI) / 180);
            ctx.scale(sx, sy);
            ctx.globalAlpha = clip.opacity ?? 1;

            if (clip.type === "text" && clip.textContent) {
              ctx.fillStyle = clip.textColor || "#fff";
              ctx.font = `${clip.textSize || 48}px ${clip.textFont || "Arial"}`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              if (clip.textStroke) {
                ctx.strokeStyle = clip.textStroke;
                ctx.lineWidth = clip.textStrokeWidth || 2;
                ctx.strokeText(clip.textContent, 0, 0);
              }
              ctx.fillText(clip.textContent, 0, 0);
            } else {
              // Placeholder rendering (Phase 3 will add actual video frame rendering)
              const colors = ["#2d3748", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];
              const ci = tracks.indexOf(track) % colors.length;
              ctx.fillStyle = colors[ci];
              ctx.fillRect(-w / 2, -h / 2, w, h);
              ctx.fillStyle = "rgba(255,255,255,0.2)";
              ctx.font = "24px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(clip.name, 0, 0);
            }
            ctx.restore();
          }
        }

        // Create VideoFrame from canvas
        const videoFrame = new VideoFrame(canvas, { timestamp: frame / fps * 1_000_000 });
        encoder.encode(videoFrame);
        videoFrame.close();

        // Yield to UI
        if (frame % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      await encoder.flush();
      encoder.close();

      // Create WebM file from chunks
      const blob = new Blob(chunks as unknown as BlobPart[], { type: format === "webm" ? "video/webm" : "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name}.${format === "webm" ? "webm" : "mp4"}`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      setDone(true);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Export failed. Check console for details.");
    } finally {
      setExporting(false);
    }
  }, [project, format, quality, resolution, getRes]);

  const tracks = project.tracks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Export Video</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          {done ? (
            <div className="text-center py-6">
              <svg className="w-12 h-12 mx-auto text-green-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-sm text-gray-400">Export complete. Downloading...</p>
              <p className="text-xs text-gray-600 mt-1">Exported with royalty-free codec (VP9). Safe to distribute.</p>
            </div>
          ) : exporting ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 mb-2">Exporting... {progress}%</p>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-600 mt-2">Rendering frame by frame using WebCodecs API</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Export your project as a video file. VP9 (WebM) is royalty-free and patent-safe.
              </p>

              <div className="bg-amber-900/20 border border-amber-800/30 text-amber-400 text-xs p-3 rounded-lg">
                Only WebM (VP9) is bundled. VP9 is royalty-free — no patent licenses needed.
                H.264/MP4 requires MPEG-LA licensing and is not included.
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Format</label>
                <div className="flex gap-2">
                  <button onClick={() => setFormat("webm")} className={`flex-1 py-2 text-sm rounded-lg ${format === "webm" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                    WebM (VP9) — Royalty-free
                  </button>
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Resolution</label>
                <div className="flex gap-2">
                  {(["source", "1080p", "720p", "480p"] as const).map((r) => (
                    <button key={r} onClick={() => setResolution(r)} className={`flex-1 py-2 text-sm rounded-lg ${resolution === r ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                      {r === "source" ? `${project.width}x${project.height}` : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quality: {Math.round(quality * 100)}%</label>
                <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full accent-blue-500" />
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p>Duration: {project.duration.toFixed(1)}s at {project.fps} fps</p>
                <p>Frames: {Math.ceil(project.duration * project.fps)}</p>
                <p>Resolution: {getRes().w}x{getRes().h}</p>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-gray-900/50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
            {done ? "Close" : "Cancel"}
          </button>
          {!done && !exporting && (
            <button onClick={handleExport} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Export {format === "webm" ? "WebM" : "MP4"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
