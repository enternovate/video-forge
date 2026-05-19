# Video Forge

**Professional open-source video editor.** 100% local. Zero AI. Royalty-free codecs. MIT licensed.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/badge.svg)](https://app.netlify.com)
[![Built with Tauri](https://img.shields.io/badge/desktop-Tauri-ffc131)](https://v2.tauri.app)

---

Developed by [Enternovate](https://enternovate.co.za) — open-source, community-driven.

---

## Quick Start

### Web Version (Netlify — no install)
```bash
git clone https://github.com/enternovate/video-forge
cd video-forge
npm install
npm run dev:web
# Opens at http://localhost:3000
```

### Desktop Version (Tauri — macOS/Windows/Linux)

**Prerequisites:** Node.js 20+, Rust 1.70+ (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)

```bash
git clone https://github.com/enternovate/video-forge
cd video-forge
npm install
npm run tauri dev
```

### Build for Production

| Target | Command | Output |
|--------|---------|--------|
| Web (Netlify) | `npm run build:web` | `dist/` (static site) |
| Desktop (macOS) | `npm run tauri build` | `.dmg` in `src-tauri/target/release/bundle/` |
| Desktop (Windows) | `npm run tauri build` | `.msi` in `src-tauri/target/release/bundle/` |
| Desktop (Linux) | `npm run tauri build` | `.deb` / `.AppImage` in `src-tauri/target/release/bundle/` |

---

## Full Usage Guide

### 1. Getting Started

When you open Video Forge, you'll see a dark interface with three main areas:

```
┌─────────────────────────────────────────────────┐
│ Toolbar (import, play, tools, undo, export)     │
├────────┬────────────────────────────────────────┤
│        │                                        │
│ Media  │         Video Preview (Canvas)          │
│ Bin    │                                        │
│        │                                        │
│        ├────────────────────────────────────────┤
│        │    Properties Panel (Color/Keys/Text)  │
│        ├────────────────────────────────────────┤
│        │    Timeline (multi-track)              │
└────────┴────────────────────────────────────────┘
│ Status bar (timecode, fps, clip count, Enternovate)│
└─────────────────────────────────────────────────┘
```

### 2. Import Media

| Method | How |
|--------|-----|
| **Import button** | Click the folder icon in the toolbar (or press `Ctrl+I`) |
| **Supported formats** | MP4, WebM, MOV, AVI, MKV, MP3, WAV, FLAC, OGG, PNG, JPG, GIF, WebP |
| **Media Bin** | Imported files appear in the left sidebar — drag them to the timeline |

### 3. Build Your Timeline

#### Adding Clips
1. **Import media** using the toolbar button
2. **Drag** a clip from the Media Bin onto a track in the timeline
3. The clip snaps to the nearest edge (when snap is enabled)

#### Rearranging Clips
- **Click and drag** a clip left/right to move it
- **Drag to a different track** to re-layer

#### Trimming Clips
- **Drag the left edge** of a clip to trim the start (changes offset into source)
- **Drag the right edge** to trim the end (changes duration)
- Trim handles appear when you hover near clip edges

#### Splitting Clips (Razor)
1. Move the **playhead** to where you want to cut
2. Press **`S`** (or click the razor icon in the toolbar)
3. The clip splits into two independent clips

#### Deleting Clips
- **Select** a clip by clicking it
- Press **`Delete`** or **`Backspace`**

### 4. Controls & Navigation

| Action | Keyboard | Mouse |
|--------|----------|-------|
| Play / Pause | `Space` | — |
| Step forward 1 frame | `→` | — |
| Step backward 1 frame | `←` | — |
| Jump forward 5s | `Ctrl + →` | Click on ruler |
| Jump backward 5s | `Ctrl + ←` | — |
| Go to start | `Home` | — |
| Go to end | `End` | — |
| Select tool | `V` | — |
| Split (razor) | `S` | Razor button |
| Undo | `Ctrl + Z` | Undo button |
| Redo | `Ctrl + Shift + Z` | Redo button |
| Toggle snap | `N` | Snap button |
| Zoom in timeline | `+` | Zoom buttons |
| Zoom out timeline | `-` | — |
| Delete selected clip | `Delete` / `Backspace` | X on clip |

### 5. Color Grading

Select a clip, then click the **Color** tab in the properties panel:

#### Basic Adjustments
13 sliders that affect the entire frame:
- **Brightness** — overall lightness
- **Contrast** — difference between light and dark areas
- **Saturation** — color intensity
- **Exposure** — simulate camera exposure changes
- **Temperature** — warm (orange) vs cool (blue)
- **Tint** — green vs magenta shift
- **Highlights** — adjust only the bright parts
- **Shadows** — adjust only the dark parts
- **Fade** — lift blacks for a film look
- **Vignette** — darken edges to focus center
- **Grain** — add film grain texture
- **Blur** — soften the image
- **Sharpness** — enhance edges

#### Filter Presets
One-click color grades inspired by professional workflows:
- `Natural` — subtle contrast and saturation
- `Warm` — golden tone
- `Cool` — blue tone
- `Vintage` — faded with warm shadows
- `Film` — grain + fade + vignette
- `Noir` — desaturated high contrast
- `Fade` — lifted blacks, muted
- `Drama` — strong contrast with split tone
- `Pastel` — soft, muted
- `Matte` — flat finish
- `HDR` — expanded dynamic range

#### HSL Per-Channel (Advanced)
Adjust individual color channels independently:
- **8 channels:** Red, Orange, Yellow, Green, Cyan, Blue, Purple, Magenta
- **3 controls per channel:** Hue (shift color), Saturation (intensity), Luminance (brightness)

#### Split Tone (Professional)
Color the shadows and highlights with different hues:
- **Shadows color** — affects dark areas
- **Highlights color** — affects bright areas
- **Balance** — shifts between shadows/highlights emphasis

### 6. Keyframe Animation

Select a clip and click the **Keys** tab:

1. **Add a keyframe** at the start of the clip
2. **Move the playhead** to a different time
3. **Adjust properties** (position, scale, rotation, opacity)
4. A new keyframe is automatically created

**Easing modes:**
- `Linear` — constant speed
- `Ease In` — starts slow, speeds up
- `Ease Out` — starts fast, slows down
- `Ease In-Out` — smooth acceleration and deceleration
- `Bounce` — overshoots with bounce effect

**Removing keyframes:** Click the yellow dot on the mini-timeline.

### 7. Text & Titles

1. Click the **Text** button in the toolbar (or `T`)
2. A text clip is added to a text track
3. Click the **Text** tab in the properties panel
4. Customize:
   - **Content** — type your text
   - **Font** — choose from 8 fonts
   - **Size** — adjust text size
   - **Color** — text fill color
   - **Stroke** — outline color and width
   - **Position** — X and Y coordinates
5. Use **Fade In/Out** sliders for smooth appearance

### 8. Transitions

- **Fade In** — clip appears gradually from black
- **Fade Out** — clip disappears gradually to black

Adjust the duration with the sliders in the Text/Properties panel. More transition types coming in future releases.

### 9. Auto-Captions

1. Click the **Captions** tab in properties (select any clip)
2. Click **Start Recording**
3. Speak into your microphone
4. Captions appear in real-time
5. Click **Stop Recording**
6. Click **Add Caption(s) to Timeline** to place auto-synced text clips

Captions use the Web Speech API — all processing is local. No data is sent anywhere.

### 10. Audio Ducking

1. Click the **Audio Ducking** tab
2. Name your voiceover clips with "voice" in the filename
3. Click **Apply Audio Ducking**
4. Background music clips that overlap with voiceover will be lowered to 20% volume

### 11. Beat Detection

1. Add an audio clip to an audio track
2. Click **Beat Detection** in the properties
3. Click **Detect Beat**
4. The app estimates the BPM and places markers on the timeline

### 12. Chroma Key (Green Screen)

Add a green screen clip to the timeline. The chroma key effect automatically removes solid green backgrounds.

To adjust: add the `chromakey` effect via the Color panel (threshold control).

### 13. Exporting

1. Click the **Export** button in the toolbar
2. Configure:
   - **Format:** WebM (VP9) — royalty-free
   - **Resolution:** Source, 1080p, 720p, or 480p
   - **Quality:** 10% to 100%
3. Click **Export**
4. The video renders frame by frame using WebCodecs
5. The completed file downloads automatically

**Legal note:** Only VP9/WebM is bundled — fully royalty-free.

### 14. Project Management

| Action | How |
|--------|-----|
| **Save** | `Ctrl+S` or click save icon |
| **Open** | `Ctrl+O` or click open icon |
| **Format** | `.vfproj` (JSON-based, human-readable) |

Project files contain all timeline data, clip references, and settings. Media files are referenced by path — keep media files in the same location when reopening.

---

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `V` | Select tool |
| `S` | Split clip at playhead |
| `→` | Forward 1 frame |
| `←` | Backward 1 frame |
| `Ctrl + →` | Jump forward 5s |
| `Ctrl + ←` | Jump backward 5s |
| `Home` | Go to start |
| `End` | Go to end |
| `Delete` / `Backspace` | Delete selected clip |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Ctrl + I` | Import media |
| `Ctrl + S` | Save project |
| `Ctrl + O` | Open project |
| `N` | Toggle snap |
| `+` / `=` | Zoom in timeline |
| `-` | Zoom out timeline |

---

## Deployment

### Netlify (Web Version)

```bash
# Connect your fork to Netlify:
# 1. Go to https://app.netlify.com
# 2. "Add new site" → "Import from Git"
# 3. Select your repository
# 4. Build command: npm run build:web
# 5. Publish directory: dist
# 6. Deploy!

# Or use the CLI:
npm install -g netlify-cli
ntl deploy --prod --dir=dist
```

### Desktop (Binary)

```bash
npm run tauri build
# Find the binary in src-tauri/target/release/bundle/
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Shell | [Tauri v2](https://v2.tauri.app) | Cross-platform native app (Rust) |
| Web Hosting | [Netlify](https://netlify.com) | Static site deployment |
| UI Framework | [React](https://react.dev) + [TypeScript](https://typescriptlang.org) | Component-based UI |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first dark theme |
| Rendering | HTML5 Canvas 2D | Frame-by-frame compositing |
| Color Pipeline | Custom pixel shader | Real-time color grading (HSL, split tone, filters) |
| Video Export | [WebCodecs API](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API) | VP9 encoding (browser-native, royalty-free) |
| Captions | [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | Local speech recognition |
| Keyframes | Custom animation engine | Property interpolation with 5 easing modes |
| Project Files | JSON (.vfproj) | Human-readable, version-controllable |

---

## Project Structure

```
video-forge/
├── src/
│   ├── App.tsx                  # State hub + layout
│   ├── components/
│   │   ├── Player.tsx           # Canvas video preview
│   │   ├── Timeline.tsx         # Multi-track editor
│   │   ├── Toolbar.tsx          # Transport, import, tools
│   │   ├── MediaBin.tsx         # Import panel
│   │   ├── StatusBar.tsx        # Timecode + branding
│   │   ├── ProColorPanel.tsx    # Color grading (13 sliders, HSL, split tone, presets)
│   │   ├── CaptionsPanel.tsx    # Web Speech API captions
│   │   ├── BeatDetector.tsx     # Audio analysis
│   │   ├── AudioDucking.tsx     # Auto volume ducking
│   │   ├── KeyframePanel.tsx    # Animation editor
│   │   ├── TitlePanel.tsx       # Text editor
│   │   ├── ExportDialog.tsx     # WebCodecs export
│   │   └── ... (ColorPanel, etc.)
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts  # 20+ shortcuts
│   ├── lib/
│   │   ├── utils.ts             # Color pipeline + presets + helpers
│   │   ├── undoRedo.ts          # Command history
│   │   └── projectManager.ts    # Save/load .vfproj
│   └── types/
│       └── video.ts             # Full type system
├── src-tauri/                   # Rust backend (desktop only)
├── public/
│   ├── favicon.svg
│   └── _redirects               # SPA routing for Netlify
├── netlify.toml                 # Netlify deployment config
├── CONTRIBUTING.md              # Open source guide
├── SECURITY.md                  # Privacy & codec policy
└── LICENSE                      # MIT
```

---

## Legal

| Concern | Status |
|---------|--------|
| **Codec patents** | Only VP9/AV1 bundled — royalty-free, no MPEG-LA licensing needed |
| **H.264/H.265** | Not included — users can add via external ffmpeg at their own risk |
| **Trademarks** | Zero competitor brand names in code or documentation |
| **License** | MIT — free to use, modify, sublicense, distribute |
| **Data collection** | Zero — no telemetry, analytics, or accounts |
| **AI/Cloud** | None — all processing is local |

See [SECURITY.md](SECURITY.md) for full details.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Reporting bugs and suggesting features
- Submitting pull requests
- Development setup and coding standards

---

## License

[MIT](LICENSE) — Developed by [Enternovate](https://enternovate.co.za)

*Built with open-source tools. Free for everyone. Forever.*
