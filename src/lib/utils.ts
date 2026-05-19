export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const cs = Math.floor((s % 1) * 100);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const COLOR_PALETTE = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

// ====== Professional Color Grading Types ======
export interface ColorChannel {
  hue: number; saturation: number; luminance: number;
}

export function defaultHSL() {
  const ch = (): ColorChannel => ({ hue: 0, saturation: 0, luminance: 0 });
  return { red: ch(), orange: ch(), yellow: ch(), green: ch(), cyan: ch(), blue: ch(), purple: ch(), magenta: ch() };
}

export interface SplitTone {
  shadows: { hue: number; saturation: number };
  highlights: { hue: number; saturation: number };
  balance: number;
}

export function defaultSplitTone(): SplitTone {
  return { shadows: { hue: 0, saturation: 0 }, highlights: { hue: 0, saturation: 0 }, balance: 0 };
}

// Color filter presets (original names — no competitors referenced)
export interface FilterPreset {
  name: string; contrast?: number; saturation?: number; exposure?: number;
  temperature?: number; tint?: number; highlights?: number; shadows?: number;
  vignette?: number; grain?: number; fade?: number;
  splitTone?: SplitTone;
  hsl?: Record<string, Partial<ColorChannel>>;
}

export const BUILTIN_PRESETS: FilterPreset[] = [
  { name: "Natural", contrast: 0.05, saturation: -0.05 },
  { name: "Warm", temperature: 0.15, saturation: 0.05 },
  { name: "Cool", temperature: -0.15, saturation: 0.05 },
  { name: "Vintage", vignette: 30, grain: 15, fade: 10, saturation: -0.2, contrast: 0.1,
    splitTone: { shadows: { hue: 30, saturation: 20 }, highlights: { hue: 350, saturation: 10 }, balance: 0 } },
  { name: "Film", grain: 25, fade: 15, contrast: 0.15, saturation: -0.1, vignette: 20 },
  { name: "Noir", saturation: -0.8, contrast: 0.3, exposure: -0.2, grain: 10 },
  { name: "Fade", fade: 25, saturation: -0.15, contrast: -0.05, grain: 5 },
  { name: "Drama", contrast: 0.35, saturation: 0.15, vignette: 40,
    splitTone: { shadows: { hue: 220, saturation: 15 }, highlights: { hue: 30, saturation: 10 }, balance: -20 } },
  { name: "Pastel", saturation: -0.3, contrast: -0.1, fade: 10, temperature: 0.05 },
  { name: "Matte", fade: 20, contrast: 0.1, saturation: -0.15, grain: 8 },
];

// ====== Canvas-based color effect pipeline ======
/** Apply all color effects to a canvas region */
export function applyColorPipeline(
  ctx: CanvasRenderingContext2D, width: number, height: number,
  effects: Record<string, number>,
  hslChannels?: Record<string, ColorChannel>,
  splitTone?: SplitTone, preset?: FilterPreset
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;

  const p = { ...effects, ...preset } as Record<string, number>;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];

    // Brightness
    if (p.brightness) { r += p.brightness * 128; g += p.brightness * 128; b += p.brightness * 128; }

    // Contrast
    if (p.contrast) { const f = (1 + p.contrast); r = 128 + (r - 128) * f; g = 128 + (g - 128) * f; b = 128 + (b - 128) * f; }

    // Exposure
    if (p.exposure) { const f = Math.pow(2, p.exposure); r *= f; g *= f; b *= f; }

    // Saturation
    if (p.saturation) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * (1 + p.saturation);
      g = gray + (g - gray) * (1 + p.saturation);
      b = gray + (b - gray) * (1 + p.saturation);
    }

    // Temperature
    if (p.temperature) {
      r += p.temperature * 30; b -= p.temperature * 30;
    }

    // Tint
    if (p.tint) { g += p.tint * 20; }

    // Highlights/Shadows
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const hlFactor = Math.max(0, (luminance - 128) / 128);
    const shFactor = Math.max(0, (128 - luminance) / 128);
    if (p.highlights) { r += p.highlights * hlFactor * 50; g += p.highlights * hlFactor * 50; b += p.highlights * hlFactor * 50; }
    if (p.shadows) { r += p.shadows * shFactor * 50; g += p.shadows * shFactor * 50; b += p.shadows * shFactor * 50; }

    // Split Tone
    if (splitTone) {
      const bal = (splitTone.balance || 0) / 100;
      const shAmt = shFactor * (splitTone.shadows.saturation / 100);
      const hlAmt = hlFactor * (splitTone.highlights.saturation / 100);
      if (shAmt > 0) {
        const shR = Math.max(0, Math.min(255, r + shAmt * Math.cos(splitTone.shadows.hue * Math.PI / 180) * 50));
        const shG = Math.max(0, Math.min(255, g + shAmt * Math.sin(splitTone.shadows.hue * Math.PI / 180) * 50));
        r = r * (1 - shAmt * 0.5) + shR * shAmt * 0.5;
        g = g * (1 - shAmt * 0.5) + shG * shAmt * 0.5;
      }
      if (hlAmt > 0) {
        const hlR = Math.max(0, Math.min(255, r + hlAmt * Math.cos(splitTone.highlights.hue * Math.PI / 180) * 50));
        const hlG = Math.max(0, Math.min(255, g + hlAmt * Math.sin(splitTone.highlights.hue * Math.PI / 180) * 50));
        r = r * (1 - hlAmt * 0.5) + hlR * hlAmt * 0.5;
        g = g * (1 - hlAmt * 0.5) + hlG * hlAmt * 0.5;
      }
    }

    // Fade (lift blacks)
    if (p.fade) { r += p.fade; g += p.fade; b += p.fade; }

    // Clamp
    d[i] = Math.max(0, Math.min(255, r));
    d[i + 1] = Math.max(0, Math.min(255, g));
    d[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);

  // Vignette
  if (p.vignette && p.vignette > 0) {
    ctx.fillStyle = `rgba(0,0,0,${p.vignette / 200})`;
    const grd = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.75);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, `rgba(0,0,0,${p.vignette / 100})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
  }

  // Grain
  if (p.grain && p.grain > 0) {
    const grainData = ctx.createImageData(width, height);
    const gd = grainData.data;
    for (let i = 0; i < gd.length; i += 4) {
      const noise = (Math.random() - 0.5) * p.grain * 2;
      gd[i] = noise; gd[i + 1] = noise; gd[i + 2] = noise; gd[i + 3] = p.grain / 100;
    }
    ctx.putImageData(grainData, 0, 0);
  }
}
