import type { Clip, Keyframe } from "../types/video";
import { generateId } from "../lib/utils";

interface KeyframePanelProps {
  clip: Clip;
  onUpdate: (id: string, updates: Partial<Clip>) => void;
}

export function KeyframePanel({ clip, onUpdate }: KeyframePanelProps) {
  const keyframes = clip.keyframes || [];
  const duration = clip.duration || 10;

  const addKeyframe = (time: number) => {
    const kf: Keyframe = {
      id: generateId(), time, easing: "linear",
      properties: { x: clip.x, y: clip.y, scale: clip.scale, rotation: clip.rotation, opacity: clip.opacity },
    };
    onUpdate(clip.id, { keyframes: [...keyframes, kf].sort((a, b) => a.time - b.time) });
  };

  const removeKeyframe = (kfId: string) => {
    onUpdate(clip.id, { keyframes: keyframes.filter(k => k.id !== kfId) });
  };

  const updateKeyframe = (kfId: string, updates: Partial<Keyframe>) => {
    onUpdate(clip.id, { keyframes: keyframes.map(k => k.id === kfId ? { ...k, ...updates } : k) });
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keyframes</h3>
        <button onClick={() => addKeyframe(0)} className="text-[10px] text-blue-400 hover:text-blue-300">
          + Add at start
        </button>
      </div>

      {/* Mini timeline */}
      <div className="relative h-8 bg-gray-800 rounded overflow-hidden">
        {/* Duration bar */}
        <div className="absolute left-0 top-0 bottom-0 bg-blue-900/20" style={{ width: "100%" }} />
        {/* Keyframe dots */}
        {keyframes.map((kf) => (
          <div
            key={kf.id}
            className="absolute top-1 w-2 h-6 bg-yellow-400 rounded-sm cursor-pointer hover:bg-yellow-300 z-10"
            style={{ left: `${(kf.time / duration) * 100}%` }}
            title={`${kf.time.toFixed(2)}s: ${Object.entries(kf.properties).map(([k, v]) => `${k}=${v?.toFixed(2)}`).join(", ")}`}
            onClick={() => removeKeyframe(kf.id)}
          />
        ))}
      </div>

      {/* Keyframe list */}
      {keyframes.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-4">
          No keyframes. Click "+ Add at start" or scrub to a position and add a keyframe.
        </p>
      )}

      {keyframes.map((kf, idx) => (
        <div key={kf.id} className="bg-gray-800 rounded-lg p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">{kf.time.toFixed(2)}s</span>
            <div className="flex gap-1">
              <select
                value={kf.easing}
                onChange={(e) => updateKeyframe(kf.id, { easing: e.target.value as Keyframe["easing"] })}
                className="text-[10px] bg-gray-700 rounded px-1 text-gray-300"
              >
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease IO</option>
                <option value="bounce">Bounce</option>
              </select>
              <button onClick={() => removeKeyframe(kf.id)} className="text-red-400 hover:text-red-300">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {(["x", "y", "scale", "rotation", "opacity", "speed"] as const).map((prop) => (
              <div key={prop}>
                <span className="text-gray-600">{prop}</span>
                <input
                  type="number"
                  value={(kf.properties as any)[prop] ?? (clip as any)[prop] ?? 0}
                  onChange={(e) => updateKeyframe(kf.id, {
                    properties: { ...kf.properties, [prop]: parseFloat(e.target.value) }
                  })}
                  className="w-full bg-gray-700 rounded px-1 text-gray-300 text-[10px]"
                  step="any"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
