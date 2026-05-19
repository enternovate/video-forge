# Video Forge

**Open-source professional video editor.** 100% local. Zero AI. Royalty-free codecs.

Developed by [Enternovate](https://enternovate.co.za) — MIT Licensed.

---

## Features

### Timeline
- Multi-track video + audio + text editing
- Drag-and-drop clips from media bin
- Trim handles on both ends of clips
- Snap-to-edge, frame-accurate positioning
- Unlimited tracks, reorderable

### Player
- Canvas-rendered video preview
- Real-time playback at project framerate
- Selection highlighting
- Timecode overlay
- Layered compositing (track order)

### Media Management
- Import video (MP4, WebM, MOV, AVI, MKV), audio (MP3, WAV, FLAC, OGG), images (PNG, JPG, GIF, WebP)
- Thumbnail previews in media bin
- Drag to timeline to create clips

### Transitions & Effects
- Fade in, fade out, crossfade
- Brightness, contrast, saturation controls
- Speed control per clip
- Opacity and rotation
- Chroma key (green screen) support

### Text & Titles
- Dedicated text tracks
- Custom text content, font, size, color
- Position anywhere in frame

### Export
- WebM (VP9) — royalty-free, patent-safe
- Configurable resolution and quality
- Local processing, no cloud upload

### Privacy & Legal
- No data collection — zero telemetry
- No accounts, no cloud, no AI
- Royalty-free codecs only (VP8, VP9, AV1)
- No patent-encumbered formats bundled
- MIT licensed — fully open source

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| UI | React + TypeScript |
| Styling | Tailwind CSS v4 |
| Rendering | HTML5 Canvas 2D |
| Codec Handling | WebCodecs API (browser-native, patent-safe) |
| Media Import | Tauri native dialogs |

---

## Build from Source

### Prerequisites
- Node.js 20+
- Rust 1.70+ (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Setup & Run
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
