import type { Clip } from "../types/video";

interface TitlePanelProps {
  clip: Clip;
  onUpdate: (id: string, updates: Partial<Clip>) => void;
}

export function TitlePanel({ clip, onUpdate }: TitlePanelProps) {
  if (clip.type !== "text" && clip.type !== "image") return null;

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Text Editor</h3>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Content</label>
        <textarea
          value={clip.textContent || ""}
          onChange={(e) => onUpdate(clip.id, { textContent: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 resize-none h-16"
          placeholder="Enter text..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Font</label>
          <select
            value={clip.textFont || "Arial"}
            onChange={(e) => onUpdate(clip.id, { textFont: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-gray-300"
          >
            {["Arial", "Helvetica", "Times New Roman", "Georgia", "Courier New", "Verdana", "Impact", "Comic Sans MS"].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Size</label>
          <input
            type="number" min={8} max={500}
            value={clip.textSize || 48}
            onChange={(e) => onUpdate(clip.id, { textSize: parseInt(e.target.value) || 48 })}
            className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Text Color</label>
          <input
            type="color"
            value={clip.textColor || "#ffffff"}
            onChange={(e) => onUpdate(clip.id, { textColor: e.target.value })}
            className="w-full h-8 rounded cursor-pointer bg-gray-800"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Stroke Color</label>
          <input
            type="color"
            value={clip.textStroke || "#000000"}
            onChange={(e) => onUpdate(clip.id, { textStroke: e.target.value })}
            className="w-full h-8 rounded cursor-pointer bg-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Stroke Width</label>
          <input
            type="range" min={0} max={10} step={0.5}
            value={clip.textStrokeWidth || 0}
            onChange={(e) => onUpdate(clip.id, { textStrokeWidth: parseFloat(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Position</label>
          <div className="grid grid-cols-2 gap-1">
            <input type="number" value={clip.x || 0} onChange={(e) => onUpdate(clip.id, { x: parseInt(e.target.value) })} className="bg-gray-800 border border-gray-700 rounded p-1 text-xs text-gray-300" placeholder="X" />
            <input type="number" value={clip.y || 0} onChange={(e) => onUpdate(clip.id, { y: parseInt(e.target.value) })} className="bg-gray-800 border border-gray-700 rounded p-1 text-xs text-gray-300" placeholder="Y" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Transitions</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-600">Fade In</label>
            <input
              type="range" min={0} max={3} step={0.1} value={clip.transitions?.start?.duration || 0}
              onChange={(e) => onUpdate(clip.id, { transitions: { ...clip.transitions, start: { type: "fade-in", duration: parseFloat(e.target.value) } } })}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-600">Fade Out</label>
            <input
              type="range" min={0} max={3} step={0.1} value={clip.transitions?.end?.duration || 0}
              onChange={(e) => onUpdate(clip.id, { transitions: { ...clip.transitions, end: { type: "fade-out", duration: parseFloat(e.target.value) } } })}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
