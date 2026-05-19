# Video Forge

**Professional open-source video editor.** 100% local. Zero AI. Royalty-free codecs. MIT licensed.

Developed by [Enternovate](https://enternovate.co.za)

---

## Features

### Editing
- Multi-track timeline with unlimited video/audio/text tracks
- Drag-and-drop clip placement from media bin
- Trim handles, snap-to-edge, frame-accurate positioning
- Razor tool (split clips at playhead)
- Ripple delete
- Keyboard shortcuts (20+): Space=play, V=select, S=split, Arrows=step, Ctrl+Z=undo
- Speed control (0.1x to 10x), volume envelope per clip

### Color Grading (Industry Standard)
- 13 basic adjustments: brightness, contrast, saturation, exposure, temperature, tint, highlights, shadows, fade, vignette, grain, blur, sharpness
- 11 built-in filter presets: Natural, Warm, Cool, Vintage, Film, Noir, Fade, Drama, Pastel, Matte, HDR
- HSL per-channel: hue/saturation/luminance for 8 individual color channels (red, orange, yellow, green, cyan, blue, purple, magenta)
- Split tone: independent color for shadows and highlights with balance control
- Real-time canvas-based color pipeline

### Transitions & Effects
- Fade in/out with adjustable duration
- Chroma key (green screen) compositing
- Keyframe animation system with 5 easing modes (linear, ease-in, ease-out, ease-in-out, bounce)
- Keyframe targets: position, scale, rotation, opacity, speed
- Visual keyframe mini-timeline editor
- Audio ducking: auto-lower background music during voiceover

### Captions & Audio
- Auto-captions via Web Speech API (local, no data sent)
- Beat detection with timeline markers
- Multi-track audio mixing

### Titles & Text
- Dedicated text tracks with full compositing
- 8 fonts, adjustable size/color/stroke/shadow/position
- Text stroke width control

### Export
- WebCodecs VP9 encoder (royalty-free)
- Resolutions: source, 1080p, 720p, 480p
- Quality slider (10-100%)
- Progress bar with frame counter

### Privacy & Legal
- No data collection — zero telemetry, no accounts, no cloud
- Royalty-free codecs only (VP9/WebM) — no MPEG-LA patent licensing needed
- Open source (MIT) — fully auditable

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| UI | React + TypeScript |
| Styling | Tailwind CSS v4 |
| Rendering | HTML5 Canvas 2D (with WebCodecs for export) |
| Captions | Web Speech API (browser-native, local) |
| Codec Safety | VP9/AV1 only — no patent-encumbered formats bundled |

---

## Build from Source

```bash
git clone https://github.com/enternovate/video-forge
cd video-forge
npm install
npm run tauri dev
```

### Build Binary
```bash
npm run tauri build
```

## License

[MIT](LICENSE) | Developed by Enternovate
