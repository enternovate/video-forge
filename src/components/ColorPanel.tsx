import type { Clip } from "../types/video";

interface ColorPanelProps {
  clip: Clip;
  onUpdate: (id: string, updates: Partial<Clip>) => void;
}

export function ColorPanel({ clip, onUpdate }: ColorPanelProps) {
  const effects = clip.effects || [];
  const getEffect = (type: string) => effects.find(e => e.type === type);

  const setEffect = (type: string, value: number) => {
    const existing = effects.findIndex(e => e.type === type);
    const updated = [...effects];
    if (existing >= 0) {
      updated[existing] = { ...updated[existing], value };
    } else {
      updated.push({ type: type as any, value });
    }
    onUpdate(clip.id, { effects: updated });
  };

  const sliders: { type: string; label: string; min: number; max: number; default: number }[] = [
    { type: "brightness", label: "Brightness", min: -1, max: 1, default: 0 },
    { type: "contrast", label: "Contrast", min: -1, max: 1, default: 0 },
    { type: "saturation", label: "Saturation", min: -1, max: 1, default: 0 },
    { type: "hue", label: "Hue Shift", min: -180, max: 180, default: 0 },
    { type: "temperature", label: "Temperature", min: -1, max: 1, default: 0 },
    { type: "tint", label: "Tint", min: -1, max: 1, default: 0 },
    { type: "exposure", label: "Exposure", min: -2, max: 2, default: 0 },
    { type: "highlights", label: "Highlights", min: -1, max: 1, default: 0 },
    { type: "shadows", label: "Shadows", min: -1, max: 1, default: 0 },
    { type: "blur", label: "Blur", min: 0, max: 20, default: 0 },
    { type: "sharpness", label: "Sharpness", min: 0, max: 2, default: 0 },
  ];

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Color Correction</h3>

      {/* Color Wheels */}
      <div className="grid grid-cols-3 gap-2">
        {["shadows", "midtones", "highlights"].map((wheel) => (
          <div key={wheel} className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 mb-1" />
            <p className="text-[10px] text-gray-500 capitalize">{wheel}</p>
          </div>
        ))}
      </div>

      {/* Tone sliders */}
      {sliders.map((s) => {
        const val = getEffect(s.type)?.value ?? s.default;
        return (
          <div key={s.type}>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{s.label}</span>
              <span className="text-gray-600 font-mono">{val >= 0 ? "+" : ""}{typeof val === 'number' ? val.toFixed(2) : val}</span>
            </div>
            <input
              type="range" min={s.min} max={s.max} step={(s.max - s.min) / 100}
              value={val} onChange={(e) => setEffect(s.type, parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1"
            />
          </div>
        );
      })}

      {/* Transform */}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Transform</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { key: "x", label: "X Position", min: -1000, max: 1000 },
          { key: "y", label: "Y Position", min: -1000, max: 1000 },
          { key: "scale", label: "Scale", min: 0.01, max: 5, step: 0.01 },
          { key: "rotation", label: "Rotation", min: -360, max: 360 },
          { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
          { key: "speed", label: "Speed", min: 0.1, max: 10, step: 0.1 },
          { key: "volume", label: "Volume", min: 0, max: 1, step: 0.01 },
        ].map((prop) => (
          <div key={prop.key}>
            <label className="text-gray-500 block">{prop.label}</label>
            <input
              type="range" min={prop.min} max={prop.max} step={prop.step || 1}
              value={(clip as any)[prop.key] ?? 0}
              onChange={(e) => onUpdate(clip.id, { [prop.key]: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
