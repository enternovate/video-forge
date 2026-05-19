import type { Clip } from "../types/video";
import { defaultHSL, defaultSplitTone, BUILTIN_PRESETS, type FilterPreset } from "../lib/utils";

interface ProColorPanelProps {
  clip: Clip;
  onUpdate: (id: string, updates: Partial<Clip>) => void;
  activeFilter: FilterPreset | null;
  onSetFilter: (f: FilterPreset | null) => void;
}

const CHANNELS = ["red","orange","yellow","green","cyan","blue","purple","magenta"];

export function ProColorPanel({ clip, onUpdate, activeFilter, onSetFilter }: ProColorPanelProps) {
  const effects = clip.effects || [];
  const getE = (t: string) => effects.find(e => e.type === t)?.value ?? 0;
  const setE = (t: string, v: number) => {
    const i = effects.findIndex(e => e.type === t);
    const up = [...effects];
    if (i >= 0) up[i] = { ...up[i], value: v }; else up.push({ type: t as any, value: v });
    onUpdate(clip.id, { effects: up });
  };

  const hsl = defaultHSL();
  const splitTone = defaultSplitTone();

  // Render filter presets
  const renderPresets = () => (
    <div>
      <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Filter Presets</h4>
      <div className="grid grid-cols-5 gap-1">
        {[{ name: "None" }, ...BUILTIN_PRESETS].map((p) => (
          <button key={p.name}
            onClick={() => onSetFilter(p.name === "None" ? null : p)}
            className={`text-[10px] py-2 rounded ${activeFilter?.name === p.name ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );

  // Render basic adjustments
  const basicSliders = [
    { key: "brightness", label: "Brightness", min: -1, max: 1 },
    { key: "contrast", label: "Contrast", min: -1, max: 1 },
    { key: "saturation", label: "Saturation", min: -1, max: 1 },
    { key: "exposure", label: "Exposure", min: -2, max: 2 },
    { key: "temperature", label: "Temperature", min: -1, max: 1 },
    { key: "tint", label: "Tint", min: -1, max: 1 },
    { key: "highlights", label: "Highlights", min: -1, max: 1 },
    { key: "shadows", label: "Shadows", min: -1, max: 1 },
    { key: "fade", label: "Fade", min: 0, max: 50 },
    { key: "vignette", label: "Vignette", min: 0, max: 100 },
    { key: "grain", label: "Grain", min: 0, max: 100 },
    { key: "blur", label: "Blur", min: 0, max: 20 },
    { key: "sharpness", label: "Sharpness", min: 0, max: 2 },
  ];

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      {renderPresets()}

      <h4 className="text-[10px] text-gray-500 uppercase tracking-wider">Basic Adjustments</h4>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {basicSliders.map(s => (
          <div key={s.key} className="text-xs">
            <div className="flex justify-between"><span className="text-gray-400">{s.label}</span><span className="text-gray-600">{getE(s.key).toFixed(2)}</span></div>
            <input type="range" min={s.min} max={s.max} step={(s.max - s.min) / 100} value={getE(s.key)}
              onChange={e => setE(s.key, parseFloat(e.target.value))} className="w-full accent-blue-500 h-1" />
          </div>
        ))}
      </div>

      <h4 className="text-[10px] text-gray-500 uppercase tracking-wider pt-2">HSL Per Channel</h4>
      {CHANNELS.map(ch => (
        <div key={ch} className="text-[10px] border-b border-gray-800 pb-1">
          <span className="text-gray-400 capitalize block mb-0.5">{ch}</span>
          <div className="grid grid-cols-3 gap-1">
            {["hue", "saturation", "luminance"].map(prop => (
              <input key={prop} type="range" min={prop === "hue" ? -180 : -100} max={prop === "hue" ? 180 : 100}
                value={0} onChange={() => {}}
                className="w-full accent-blue-500 h-0.5" title={prop} />
            ))}
          </div>
        </div>
      ))}

      <h4 className="text-[10px] text-gray-500 uppercase tracking-wider pt-2">Split Tone</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {["shadows", "highlights"].map(region => (
          <div key={region} className="bg-gray-800 rounded p-2">
            <p className="text-gray-400 capitalize mb-1">{region}</p>
            <div className="space-y-1">
              {["hue", "saturation"].map(prop => (
                <div key={prop}>
                  <span className="text-gray-600">{prop}</span>
                  <input type="range" min={prop === "hue" ? 0 : 0} max={prop === "hue" ? 360 : 100} value={0}
                    onChange={() => {}} className="w-full accent-blue-500 h-0.5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h4 className="text-[10px] text-gray-500 uppercase tracking-wider pt-2">Transform</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[{k:"x",l:"X"},{k:"y",l:"Y"},{k:"scale",l:"Scale",mx:5},{k:"rotation",l:"Rot",mx:360},{k:"opacity",l:"Opacity",mx:1},{k:"speed",l:"Speed",mx:10},{k:"volume",l:"Volume",mx:1}].map(p => (
          <div key={p.k}>
            <span className="text-gray-500">{p.l}</span>
            <input type="range" min={p.k==="scale"?0.01:p.k==="speed"?0.1:0} max={p.mx||1000} step={p.k==="scale"?0.01:p.k==="speed"?0.1:1}
              value={(clip as any)[p.k]??0} onChange={e=>onUpdate(clip.id,{[p.k]:parseFloat(e.target.value)})}
              className="w-full accent-blue-500 h-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
