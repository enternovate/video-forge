interface WelcomeGuideProps {
  onImport: () => void;
}

export function WelcomeGuide({ onImport }: WelcomeGuideProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        {/* Hero */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Video Forge</h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Professional open-source video editor. 100% local, zero AI, royalty-free codecs.
            Developed by <span className="text-blue-400">Enternovate</span>.
          </p>
          <button
            onClick={onImport}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Media to Start
          </button>
          <p className="mt-2 text-xs text-gray-600">or drag video/audio/image files onto the media bin</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: LayersIcon, title: "Multi-Track Timeline", desc: "Unlimited video, audio, and text tracks. Drag, drop, trim, and arrange." },
            { icon: ScissorsIcon, title: "Razor Tool", desc: "Split clips at any point. Keyboard shortcut: S" },
            { icon: ColorIcon, title: "Color Grading", desc: "13 adjustment sliders, 11 filter presets, HSL per-channel, split tone." },
            { icon: KeyframeIcon, title: "Keyframe Animation", desc: "Animate position, scale, rotation, opacity. 5 easing modes." },
            { icon: CaptionIcon, title: "Auto Captions", desc: "Speech-to-text via Web Speech API. All local, no data sent." },
            { icon: ChromaIcon, title: "Chroma Key", desc: "Green screen removal. Composite layers with transparency." },
            { icon: AudioIcon, title: "Audio Ducking", desc: "Auto-lower background music during voiceover." },
            { icon: BeatIcon, title: "Beat Detection", desc: "Detect BPM and place markers on the timeline." },
            { icon: TextIcon, title: "Text & Titles", desc: "8 fonts, stroke, shadow, position. Fade in/out transitions." },
            { icon: ExportIcon, title: "Export to WebM", desc: "VP9 encoder via WebCodecs. Royalty-free, plays everywhere." },
            { icon: SaveIcon, title: "Project Save/Load", desc: "Save your work as .vfproj files. Reopen anytime." },
            { icon: GlobeIcon, title: "Web + Desktop", desc: "Runs in browser (Netlify) or as native app (Tauri)." },
          ].map((card) => (
            <div key={card.title} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mb-2">
                <card.icon />
              </div>
              <h3 className="text-sm font-semibold text-gray-200 mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Use cases */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">What You Can Build</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "YouTube Videos", desc: "Multi-layer editing, color grading, transitions, captions, and VP9 export optimized for web." },
              { title: "Social Media Clips", desc: "Quick cuts with the razor tool, text overlays, and export at 1080p or 720p." },
              { title: "Film & Shorts", desc: "Keyframe animation for cinematic moves, split tone for film looks, audio ducking for clean sound." },
              { title: "Tutorials & Courses", desc: "Auto-captions for accessibility, beat-synced cuts, and text overlays for step labels." },
              { title: "Music Videos", desc: "Beat detection for timed edits, speed ramping, chroma key for effects." },
              { title: "Corporate Content", desc: "Professional color presets, lower thirds (text tracks), and multi-track audio mixing." },
              { title: "Game Clips & Streams", desc: "Fast trimming with shortcuts, chroma key for webcam overlay, text for alerts." },
              { title: "Archival & Backup", desc: "Save project files for future re-edits. Export at source resolution for maximum quality." },
            ].map((uc) => (
              <div key={uc.title} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">{uc.title}</h3>
                <p className="text-xs text-gray-600">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick start guide */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Quick Start Guide</h2>
          <div className="space-y-3">
            {[
              { num: "1", title: "Import Media", desc: 'Click the Import button (or press Ctrl+I). Select video, audio, or image files. They appear in the Media Bin on the left.' },
              { num: "2", title: "Build Your Timeline", desc: 'Drag clips from the Media Bin onto a track. Use the razor tool (S) to split. Drag edges to trim.' },
              { num: "3", title: "Color & Effects", desc: 'Select a clip, then click Color/Keys/Text tabs in the properties panel. Adjust colors, add keyframes, or edit text.' },
              { num: "4", title: "Preview & Play", desc: 'Press Space to play. Use arrow keys to frame-step. Click the timeline ruler to jump to a time.' },
              { num: "5", title: "Export & Save", desc: 'Click Export to render a WebM video. Press Ctrl+S to save your project for later editing.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-3 bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{step.num}</div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">{step.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Keyboard Shortcuts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { key: "Space", action: "Play / Pause" },
              { key: "V", action: "Select tool" },
              { key: "S", action: "Split clip" },
              { key: "→ / ←", action: "Frame step" },
              { key: "Delete", action: "Delete clip" },
              { key: "Ctrl+Z", action: "Undo" },
              { key: "Ctrl+Shift+Z", action: "Redo" },
              { key: "Ctrl+I", action: "Import media" },
              { key: "Ctrl+S", action: "Save project" },
              { key: "Ctrl+O", action: "Open project" },
              { key: "N", action: "Toggle snap" },
              { key: "+ / -", action: "Timeline zoom" },
            ].map((s) => (
              <div key={s.key} className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
                <kbd className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono border border-gray-700 min-w-[60px] text-center">{s.key}</kbd>
                <span className="text-xs text-gray-500">{s.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legal footer */}
        <div className="text-center border-t border-gray-800 pt-6">
          <p className="text-xs text-gray-600">
            Video Forge is <strong className="text-gray-500">MIT licensed</strong> open-source software.
            All processing is local — no data leaves your device.
            Royalty-free codecs only (VP9/WebM).
          </p>
          <p className="text-xs text-gray-700 mt-2">
            Developed by <a href="https://enternovate.co.za" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">Enternovate</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ====== Icons ======
function LayersIcon() { return <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>; }
function ScissorsIcon() { return <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>; }
function ColorIcon() { return <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>; }
function KeyframeIcon() { return <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15 9 22 9 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9 9 9 12 2" /></svg>; }
function CaptionIcon() { return <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 10h3m-3 4h6m4-4h1m-1 4h-1" /></svg>; }
function ChromaIcon() { return <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M12 9v6m-3-3h6" /></svg>; }
function AudioIcon() { return <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>; }
function BeatIcon() { return <svg className="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l2-9 4 18 2-9h3" /></svg>; }
function TextIcon() { return <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>; }
function ExportIcon() { return <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>; }
function SaveIcon() { return <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>; }
function GlobeIcon() { return <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>; }
