import { useState, useCallback, useRef, useEffect } from "react";
import type { Clip, Track, MediaItem, EditorState } from "./types/video";
import { generateId } from "./lib/utils";
import { UndoRedo, createAddClipCommand, createDeleteClipCommand, createUpdateClipCommand, createSplitClipCommand } from "./lib/undoRedo";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { saveProject, saveProjectNative, loadProject } from "./lib/projectManager";
import { Toolbar } from "./components/Toolbar";
import { Player } from "./components/Player";
import { Timeline } from "./components/Timeline";
import { MediaBin } from "./components/MediaBin";
import { StatusBar } from "./components/StatusBar";
import { ProColorPanel } from "./components/ProColorPanel";
import { KeyframePanel } from "./components/KeyframePanel";
import { TitlePanel } from "./components/TitlePanel";
import { ExportDialog } from "./components/ExportDialog";
import { WelcomeGuide } from "./components/WelcomeGuide";
import { MobileMenu } from "./components/MobileMenu";

const DEFAULT_FPS = 30;
const PROJECT_W = 1920;
const PROJECT_H = 1080;

function createEmptyProject(name: string) {
  return {
    name, fps: DEFAULT_FPS, width: PROJECT_W, height: PROJECT_H, duration: 60,
    tracks: [
      { id: generateId(), type: 'video' as const, name: 'Video 1', locked: false, muted: false, clips: [] },
      { id: generateId(), type: 'video' as const, name: 'Video 2', locked: false, muted: false, clips: [] },
      { id: generateId(), type: 'audio' as const, name: 'Audio 1', locked: false, muted: false, clips: [] },
      { id: generateId(), type: 'text' as const, name: 'Text 1', locked: false, muted: false, clips: [] },
    ],
  };
}

export default function App() {
  const [state, setState] = useState<EditorState>({
    project: createEmptyProject("Untitled"),
    currentTime: 0, playing: false, zoom: 100, snapEnabled: true,
    selectedClipId: null, selectedTrackId: null, mediaBin: [],
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [tool, setTool] = useState<string>("select");
  const [panelOpen, setPanelOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [mobileMenu, setMobileMenu] = useState<'media' | 'panel' | null>(null);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const playerRef = useRef<HTMLCanvasElement>(null);
  const undoRef = useRef(new UndoRedo());
  const projectRef = useRef(state.project);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  projectRef.current = state.project;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const setProject = useCallback((updater: (p: typeof state.project) => typeof state.project) => {
    setState(prev => ({ ...prev, project: updater(prev.project) }));
  }, []);

  const getTracks = () => state.project.tracks;
  const setTracks = useCallback((tracks: Track[]) => {
    setProject(p => ({ ...p, tracks }));
  }, [setProject]);

  const addMediaToBin = useCallback((item: MediaItem) => {
    setState(prev => ({ ...prev, mediaBin: [...prev.mediaBin, item] }));
  }, []);

  const addClipToTrack = useCallback((trackId: string, clip: Clip) => {
    const cmd = createAddClipCommand(getTracks(), setTracks, trackId, clip);
    undoRef.current.execute(cmd);
  }, [setTracks]);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    setTracks(getTracks().map(t => ({
      ...t, clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c),
    })));
  }, [setTracks]);

  const updateClipUndoable = useCallback((clipId: string, updates: Partial<Clip>) => {
    const cmd = createUpdateClipCommand(getTracks(), setTracks, clipId, updates);
    undoRef.current.execute(cmd);
  }, [setTracks]);

  const deleteClip = useCallback((clipId: string) => {
    const cmd = createDeleteClipCommand(getTracks(), setTracks, clipId);
    undoRef.current.execute(cmd);
    setState(prev => prev.selectedClipId === clipId ? { ...prev, selectedClipId: null } : prev);
  }, [setTracks]);

  const addTrack = useCallback((type: Track['type']) => {
    const names = { video: 'Video', audio: 'Audio', text: 'Text' };
    const count = state.project.tracks.filter(t => t.type === type).length + 1;
    setProject(proj => ({
      ...proj,
      tracks: [...proj.tracks, {
        id: generateId(), type, name: `${names[type]} ${count}`,
        locked: false, muted: false, clips: [],
      }],
    }));
  }, [state.project.tracks, setProject]);

  const splitClip = useCallback(() => {
    const clipId = state.selectedClipId;
    if (!clipId) return;
    const allClips = state.project.tracks.flatMap(t => t.clips);
    const clip = allClips.find(c => c.id === clipId);
    if (!clip) return;
    const splitTime = state.currentTime;
    if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) return;
    const cmd = createSplitClipCommand(getTracks(), setTracks, clipId, splitTime);
    undoRef.current.execute(cmd);
  }, [state.selectedClipId, state.currentTime, setTracks]);

  const importMedia = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const files = await open({ multiple: true, filters: [
        { name: "Media Files", extensions: ["mp4","webm","mov","avi","mkv","ogg","mp3","wav","flac","png","jpg","jpeg","gif","webp"] },
      ]});
      if (!files) return;
      const fileList = Array.isArray(files) ? files : [files];
      for (const path of fileList) {
        const name = path.split('/').pop() || path;
        const ext = name.split('.').pop()?.toLowerCase() || '';
        const type: MediaItem['type'] = ['mp4','webm','mov','avi','mkv'].includes(ext) ? 'video'
          : ['mp3','wav','ogg','flac','aac'].includes(ext) ? 'audio' : 'image';
        addMediaToBin({ id: generateId(), name, path, type, duration: 10, width: 1920, height: 1080 });
      }
    } catch {
      const input = document.createElement("input");
      input.type = "file"; input.multiple = true; input.accept = "video/*,audio/*,image/*";
      input.onchange = () => {
        if (!input.files) return;
        Array.from(input.files).forEach(f => {
          const ext = f.name.split('.').pop()?.toLowerCase() || '';
          const type: MediaItem['type'] = ['mp4','webm','mov','avi','mkv'].includes(ext) ? 'video'
            : ['mp3','wav','ogg','flac','aac'].includes(ext) ? 'audio' : 'image';
          addMediaToBin({ id: generateId(), name: f.name, path: URL.createObjectURL(f), type, duration: 10 });
        });
      };
      input.click();
    }
  }, [addMediaToBin]);

  const addTextClip = useCallback(() => {
    const textTrack = state.project.tracks.find(t => t.type === 'text');
    if (!textTrack) return;
    const clip: Clip = {
      id: generateId(), type: 'text', name: 'Title',
      startTime: state.currentTime, duration: 5, offset: 0,
      speed: 1, volume: 1, opacity: 1, x: 0, y: 0, scale: 1, rotation: 0,
      effects: [], transitions: {}, keyframes: [],
      textContent: "Your Text Here", textFont: "Arial", textSize: 48, textColor: "#ffffff",
      textStroke: "#000000", textStrokeWidth: 2, locked: false, enabled: true,
    };
    const cmd = createAddClipCommand(getTracks(), setTracks, textTrack.id, clip);
    undoRef.current.execute(cmd);
  }, [state.currentTime, state.project.tracks, setTracks]);

  const dropToTimeline = useCallback((mediaId: string, trackId: string, time: number) => {
    const media = state.mediaBin.find(m => m.id === mediaId);
    if (!media) return;
    const clip: Clip = {
      id: generateId(), name: media.name,
      type: media.type === 'image' ? 'image' : media.type === 'audio' ? 'audio' : 'video',
      sourcePath: media.path, sourceWidth: media.width, sourceHeight: media.height,
      sourceDuration: media.duration,
      startTime: Math.max(0, time), duration: Math.min(media.duration, 10),
      offset: 0, speed: 1, volume: 1, opacity: 1,
      x: 0, y: 0, scale: 1, rotation: 0,
      effects: [], transitions: {}, keyframes: [], locked: false, enabled: true,
    };
    addClipToTrack(trackId, clip);
  }, [state.mediaBin, addClipToTrack]);

  const togglePlay = useCallback(() => setState(prev => ({ ...prev, playing: !prev.playing })), []);
  const seekTo = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.project.duration)) }));
  }, []);

  const selectedClip = state.selectedClipId
    ? state.project.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipId)
    : null;

  useKeyboardShortcuts({
    togglePlay, seekFwd: () => seekTo(state.currentTime + 5),
    seekBwd: () => seekTo(state.currentTime - 5),
    stepFwd: () => seekTo(state.currentTime + 1 / 30),
    stepBwd: () => seekTo(state.currentTime - 1 / 30),
    splitClip, deleteSelected: () => { if (state.selectedClipId) deleteClip(state.selectedClipId); },
    undo: () => undoRef.current.undo(), redo: () => undoRef.current.redo(),
    zoomIn: () => setState(prev => ({ ...prev, zoom: Math.min(500, prev.zoom + 20) })),
    zoomOut: () => setState(prev => ({ ...prev, zoom: Math.max(20, prev.zoom - 20) })),
    toggleSnap: () => setState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled })),
    setTool,
  }, tool);

  return (
    <div className="w-full h-full flex flex-col bg-gray-950">
      <div className="bg-blue-950 text-blue-300 text-xs text-center py-0.5 px-4 select-none safe-top">
        No data leaves your device. Royalty-free codecs only.
      </div>

      <Toolbar
        playing={state.playing} onTogglePlay={togglePlay}
        onImport={importMedia} onExport={() => setExportOpen(true)}
        currentTime={state.currentTime} duration={state.project.duration} onSeek={seekTo}
        onUndo={() => undoRef.current.undo()} onRedo={() => undoRef.current.redo()}
        snapEnabled={state.snapEnabled} onToggleSnap={() => setState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }))}
        zoom={state.zoom} onZoomChange={(z) => setState(prev => ({ ...prev, zoom: Math.min(500, Math.max(20, z)) }))}
        onSplit={splitClip} tool={tool} onSetTool={setTool}
        onSave={() => { saveProjectNative(state.project); setToast({ message: "Project saved!", type: "success" }); setTimeout(() => setToast(null), 3000); }}
        onLoad={async () => { const proj = await loadProject(); if (proj) { setState(prev => ({ ...prev, project: proj })); setToast({ message: "Project loaded!", type: "success" }); } setTimeout(() => setToast(null), 3000); }}
        onAddText={addTextClip} canUndo={undoRef.current.canUndo()} canRedo={undoRef.current.canRedo()}
        isMobile={isMobile}
        onToggleMedia={() => setMobileMenu(mobileMenu === 'media' ? null : 'media')}
        onTogglePanel={() => setMobileMenu(mobileMenu === 'panel' ? null : 'panel')}
        mobileMenu={mobileMenu}
        onHamburger={() => setHamburgerOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Media Bin */}
        <div className="media-bin-desktop">
          <MediaBin items={state.mediaBin} onImport={importMedia} onDragToTimeline={dropToTimeline} tracks={state.project.tracks} />
        </div>

        {/* Mobile Media Drawer */}
        {isMobile && mobileMenu === 'media' && (
          <>
            <div className="drawer-overlay" onClick={() => setMobileMenu(null)} />
            <div className="drawer-content">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Media</span>
                <button onClick={() => setMobileMenu(null)} className="text-gray-500 hover:text-gray-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="p-2">
                <MediaBin items={state.mediaBin} onImport={importMedia} onDragToTimeline={dropToTimeline} tracks={state.project.tracks} />
              </div>
            </div>
          </>
        )}

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {state.project.tracks.some(t => t.clips.length > 0) ? (
            <Player ref={playerRef} currentTime={state.currentTime} playing={state.playing}
              project={state.project} selectedClipId={state.selectedClipId} />
          ) : (
            <WelcomeGuide onImport={importMedia} />
          )}

          {/* Desktop Properties Panel */}
          {selectedClip && !isMobile && (
            <div className="h-48 bg-gray-900 border-t border-gray-800 flex shrink-0">
              <div className="flex border-r border-gray-800">
                {[{ id: "color", label: "Color" }, { id: "keyframes", label: "Keys" }, { id: "title", label: "Text" }].map(p => (
                  <button key={p.id} onClick={() => setPanelOpen(panelOpen === p.id ? null : p.id)}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider ${panelOpen === p.id ? "bg-gray-800 text-blue-400" : "text-gray-600 hover:text-gray-400"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {panelOpen === "color" && <ProColorPanel clip={selectedClip} onUpdate={updateClipUndoable} activeFilter={null} onSetFilter={() => {}} />}
                {panelOpen === "keyframes" && <KeyframePanel clip={selectedClip} onUpdate={updateClipUndoable} />}
                {panelOpen === "title" && <TitlePanel clip={selectedClip} onUpdate={updateClipUndoable} />}
              </div>
            </div>
          )}

          {/* Mobile Properties Drawer */}
          {isMobile && selectedClip && mobileMenu === 'panel' && (
            <>
              <div className="drawer-overlay" onClick={() => setMobileMenu(null)} />
              <div className="drawer-content">
                <div className="flex gap-2 px-4 py-3 border-b border-gray-800">
                  {[{ id: "color", label: "Color" }, { id: "keyframes", label: "Keys" }, { id: "title", label: "Text" }].map(p => (
                    <button key={p.id} onClick={() => setPanelOpen(p.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg ${panelOpen === p.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                      {p.label}
                    </button>
                  ))}
                  <button onClick={() => setMobileMenu(null)} className="ml-auto text-gray-500 hover:text-gray-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                  {(!panelOpen || panelOpen === "color") && <ProColorPanel clip={selectedClip} onUpdate={updateClipUndoable} activeFilter={null} onSetFilter={() => {}} />}
                  {panelOpen === "keyframes" && <KeyframePanel clip={selectedClip} onUpdate={updateClipUndoable} />}
                  {panelOpen === "title" && <TitlePanel clip={selectedClip} onUpdate={updateClipUndoable} />}
                </div>
              </div>
            </>
          )}

          <Timeline tracks={state.project.tracks} currentTime={state.currentTime}
            duration={state.project.duration} zoom={state.zoom} snapEnabled={state.snapEnabled}
            selectedClipId={state.selectedClipId} selectedTrackId={state.selectedTrackId}
            tool={tool}
            onSelectClip={(id) => setState(prev => ({ ...prev, selectedClipId: id }))}
            onSelectTrack={(id) => setState(prev => ({ ...prev, selectedTrackId: id }))}
            onSeek={seekTo} onUpdateClip={updateClip} onUpdateClipUndoable={updateClipUndoable}
            onDeleteClip={deleteClip} onAddTrack={addTrack}
            onDeleteTrack={(id) => setProject(p => ({ ...p, tracks: p.tracks.filter(t => t.id !== id) }))}
            onDropMedia={dropToTimeline} mediaBin={state.mediaBin}
            isMobile={isMobile}
          />
        </div>
      </div>

      <StatusBar currentTime={state.currentTime} duration={state.project.duration}
        fps={state.project.fps}
        clipCount={state.project.tracks.reduce((s, t) => s + t.clips.length, 0)}
        trackCount={state.project.tracks.length}
        isMobile={isMobile} />

      {exportOpen && (
        <ExportDialog onClose={() => { setExportOpen(false); }} project={state.project} />
      )}

      {/* Mobile hamburger menu */}
      {isMobile && (
        <MobileMenu
          open={hamburgerOpen}
          onClose={() => setHamburgerOpen(false)}
          title="Video Forge"
          items={[
            { id: "import", label: "Import Media", shortcut: "Ctrl+I", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>, onClick: importMedia },
            { id: "save", label: "Save Project", shortcut: "Ctrl+S", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>, onClick: () => saveProjectNative(state.project) },
            { id: "open", label: "Open Project", shortcut: "Ctrl+O", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>, onClick: async () => { const p = await loadProject(); if (p) setState(prev => ({ ...prev, project: p })); } },
            { id: "export", label: "Export Video", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>, onClick: () => setExportOpen(true) },
            { id: "sep1", label: "", icon: <span />, onClick: () => {} },
            { id: "media-bin", label: "Media Bin", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>, onClick: () => setMobileMenu('media') },
            { id: "properties", label: "Properties", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M3 20h3" /><path d="M12 4h9" /><path d="M3 4h3" /><path d="M12 12h9" /><path d="M3 12h3" /></svg>, onClick: () => setMobileMenu('panel') },
            { id: "add-text", label: "Add Text/Titles", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>, onClick: addTextClip },
            { id: "sep2", label: "", icon: <span />, onClick: () => {} },
            { id: "undo", label: "Undo", shortcut: "Ctrl+Z", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>, onClick: () => undoRef.current.undo() },
            { id: "redo", label: "Redo", shortcut: "Ctrl+Shift+Z", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>, onClick: () => undoRef.current.redo() },
          ]}
        />
      )}

      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'
        }`}>
          {toast.type === 'success' && <span className="mr-1.5">✓</span>}
          {toast.type === 'error' && <span className="mr-1.5">✕</span>}
          {toast.message}
        </div>
      )}
    </div>
  );
}
