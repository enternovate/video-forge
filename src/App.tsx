import { useState, useCallback, useRef } from "react";
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
import { ColorPanel } from "./components/ColorPanel";
import { KeyframePanel } from "./components/KeyframePanel";
import { TitlePanel } from "./components/TitlePanel";
import { ExportDialog } from "./components/ExportDialog";
import { WelcomeGuide } from "./components/WelcomeGuide";

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
  const playerRef = useRef<HTMLCanvasElement>(null);
  const undoRef = useRef(new UndoRedo());
  const projectRef = useRef(state.project);
  projectRef.current = state.project;

  const setProject = useCallback((updater: (p: typeof state.project) => typeof state.project) => {
    setState(prev => ({ ...prev, project: updater(prev.project) }));
  }, []);

  // --- Track helpers ---
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

  // --- Split/razor ---
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

  // --- Import ---
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

  // --- Add text clip ---
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

  // --- Transport ---
  const togglePlay = useCallback(() => setState(prev => ({ ...prev, playing: !prev.playing })), []);
  const seekTo = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.project.duration)) }));
  }, []);

  // --- Keyboard shortcuts ---
  const selectedClip = state.selectedClipId
    ? state.project.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipId)
    : null;

  useKeyboardShortcuts({
    togglePlay,
    seekFwd: () => seekTo(state.currentTime + 5),
    seekBwd: () => seekTo(state.currentTime - 5),
    stepFwd: () => seekTo(state.currentTime + 1 / 30),
    stepBwd: () => seekTo(state.currentTime - 1 / 30),
    splitClip,
    deleteSelected: () => { if (state.selectedClipId) deleteClip(state.selectedClipId); },
    undo: () => undoRef.current.undo(),
    redo: () => undoRef.current.redo(),
    zoomIn: () => setState(prev => ({ ...prev, zoom: Math.min(500, prev.zoom + 20) })),
    zoomOut: () => setState(prev => ({ ...prev, zoom: Math.max(20, prev.zoom - 20) })),
    toggleSnap: () => setState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled })),
    setTool,
  }, tool);

  return (
    <div className="w-full h-full flex flex-col bg-gray-950">
      {/* Privacy banner */}
      <div className="bg-blue-950 text-blue-300 text-xs text-center py-0.5 px-4 select-none">
        No data leaves your device. Everything runs locally. Royalty-free codecs only.
      </div>

      {/* Toolbar */}
      <Toolbar
        playing={state.playing}
        onTogglePlay={togglePlay}
        onImport={importMedia}
        onExport={() => setExportOpen(true)}
        currentTime={state.currentTime}
        duration={state.project.duration}
        onSeek={seekTo}
        onUndo={() => undoRef.current.undo()}
        onRedo={() => undoRef.current.redo()}
        snapEnabled={state.snapEnabled}
        onToggleSnap={() => setState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }))}
        zoom={state.zoom}
        onZoomChange={(z) => setState(prev => ({ ...prev, zoom: Math.min(500, Math.max(20, z)) }))}
        onSplit={splitClip}
        tool={tool}
        onSetTool={setTool}
                    onSave={() => {
                      saveProjectNative(state.project);
                      setToast({ message: "Project saved!", type: "success" });
                      setTimeout(() => setToast(null), 3000);
                    }}
                    onLoad={async () => {
                      const proj = await loadProject();
                      if (proj) {
                        setState(prev => ({ ...prev, project: proj }));
                        setToast({ message: "Project loaded!", type: "success" });
                      } else {
                        setToast({ message: "No project selected", type: "info" });
                      }
                      setTimeout(() => setToast(null), 3000);
                    }}
        onAddText={addTextClip}
        canUndo={undoRef.current.canUndo()}
        canRedo={undoRef.current.canRedo()}
      />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Media bin */}
        <MediaBin items={state.mediaBin} onImport={importMedia} onDragToTimeline={dropToTimeline} tracks={state.project.tracks} />

        {/* Center: Player + Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {state.project.tracks.some(t => t.clips.length > 0) ? (
            <Player
              ref={playerRef}
              currentTime={state.currentTime}
              playing={state.playing}
              project={state.project}
              selectedClipId={state.selectedClipId}
            />
          ) : (
            <WelcomeGuide onImport={importMedia} />
          )}

          {/* Properties panel (when clip selected) */}
          {selectedClip && (
            <div className="h-48 bg-gray-900 border-t border-gray-800 flex shrink-0">
              <div className="flex border-r border-gray-800">
                {[{ id: "color", label: "Color" }, { id: "keyframes", label: "Keys" }, { id: "title", label: "Text" }].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPanelOpen(panelOpen === p.id ? null : p.id)}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider ${
                      panelOpen === p.id ? "bg-gray-800 text-blue-400" : "text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {panelOpen === "color" && <ColorPanel clip={selectedClip} onUpdate={updateClipUndoable} />}
                {panelOpen === "keyframes" && <KeyframePanel clip={selectedClip} onUpdate={updateClipUndoable} />}
                {panelOpen === "title" && <TitlePanel clip={selectedClip} onUpdate={updateClipUndoable} />}
              </div>
            </div>
          )}

          {/* Timeline */}
          <Timeline
            tracks={state.project.tracks}
            currentTime={state.currentTime}
            duration={state.project.duration}
            zoom={state.zoom}
            snapEnabled={state.snapEnabled}
            selectedClipId={state.selectedClipId}
            selectedTrackId={state.selectedTrackId}
            tool={tool}
            onSelectClip={(id) => setState(prev => ({ ...prev, selectedClipId: id }))}
            onSelectTrack={(id) => setState(prev => ({ ...prev, selectedTrackId: id }))}
            onSeek={seekTo}
            onUpdateClip={updateClip}
            onUpdateClipUndoable={updateClipUndoable}
            onDeleteClip={deleteClip}
            onAddTrack={addTrack}
            onDeleteTrack={(id) => setProject(p => ({ ...p, tracks: p.tracks.filter(t => t.id !== id) }))}
            onDropMedia={dropToTimeline}
            mediaBin={state.mediaBin}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        currentTime={state.currentTime}
        duration={state.project.duration}
        fps={state.project.fps}
        clipCount={state.project.tracks.reduce((s, t) => s + t.clips.length, 0)}
        trackCount={state.project.tracks.length}
      />

      {/* Dialogs */}
      {exportOpen && (
        <ExportDialog onClose={() => {
          setExportOpen(false);
          if (document.querySelector('a[download]')) {
            setToast({ message: "Video downloaded!", type: "success" });
            setTimeout(() => setToast(null), 3000);
          }
        }} project={state.project} />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all animate-in ${
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
