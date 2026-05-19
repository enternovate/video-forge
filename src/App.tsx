import { useState, useCallback, useRef } from "react";
import type { Clip, Track, MediaItem, EditorState, Transition, Effect } from "./types/video";
import { generateId, formatTime } from "./lib/utils";
import { Toolbar } from "./components/Toolbar";
import { Player } from "./components/Player";
import { Timeline } from "./components/Timeline";
import { MediaBin } from "./components/MediaBin";
import { StatusBar } from "./components/StatusBar";

const DEFAULT_FPS = 30;
const PROJECT_W = 1920;
const PROJECT_H = 1080;

function createEmptyProject(name: string) {
  return {
    name,
    fps: DEFAULT_FPS,
    width: PROJECT_W,
    height: PROJECT_H,
    duration: 30,
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
    currentTime: 0,
    playing: false,
    zoom: 100, // px per second
    snapEnabled: true,
    selectedClipId: null,
    selectedTrackId: null,
    mediaBin: [],
  });

  const playerRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  // --- Project mutation helpers ---
  const setProject = useCallback((updater: (p: typeof state.project) => typeof state.project) => {
    setState(prev => ({ ...prev, project: updater(prev.project) }));
  }, []);

  const addMediaToBin = useCallback((item: MediaItem) => {
    setState(prev => ({ ...prev, mediaBin: [...prev.mediaBin, item] }));
  }, []);

  const addClipToTrack = useCallback((trackId: string, clip: Clip) => {
    setProject(proj => ({
      ...proj,
      tracks: proj.tracks.map(t =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.startTime - b.startTime) } : t
      ),
    }));
  }, [setProject]);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    setProject(proj => ({
      ...proj,
      tracks: proj.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c),
      })),
    }));
  }, [setProject]);

  const deleteClip = useCallback((clipId: string) => {
    setProject(proj => ({
      ...proj,
      tracks: proj.tracks.map(t => ({
        ...t,
        clips: t.clips.filter(c => c.id !== clipId),
      })),
    }));
    setState(prev => prev.selectedClipId === clipId ? { ...prev, selectedClipId: null } : prev);
  }, [setProject]);

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

  const deleteTrack = useCallback((trackId: string) => {
    setProject(proj => ({
      ...proj,
      tracks: proj.tracks.filter(t => t.id !== trackId),
    }));
  }, [setProject]);

  // --- Media import ---
  const importMedia = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const files = await open({ multiple: true, filters: [
        { name: "Video Files", extensions: ["mp4", "webm", "mov", "avi", "mkv", "ogg"] },
        { name: "Audio Files", extensions: ["mp3", "wav", "ogg", "flac", "aac"] },
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
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
      // Browser fallback
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = "video/*,audio/*,image/*";
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
      effects: [], transitions: {},
    };
    addClipToTrack(trackId, clip);
  }, [state.mediaBin, addClipToTrack]);

  // --- Transport ---
  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, playing: !prev.playing }));
  }, []);

  const seekTo = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.project.duration)) }));
  }, []);

  // --- Export ---
  const exportVideo = useCallback(async () => {
    // Phase 4: WebCodecs-based export to WebM (VP9)
    alert("Export will be available in Phase 2. For now, save the project file.");
  }, []);

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
        onExport={exportVideo}
        currentTime={state.currentTime}
        duration={state.project.duration}
        onSeek={seekTo}
        onUndo={() => {}}
        onRedo={() => {}}
        snapEnabled={state.snapEnabled}
        onToggleSnap={() => setState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }))}
        zoom={state.zoom}
        onZoomChange={(z) => setState(prev => ({ ...prev, zoom: clamp(z, 20, 500) }))}
      />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Media bin sidebar */}
        <MediaBin
          items={state.mediaBin}
          onImport={importMedia}
          onDragToTimeline={dropToTimeline}
          tracks={state.project.tracks}
        />
        
        {/* Center: Player */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Player
            ref={playerRef}
            currentTime={state.currentTime}
            playing={state.playing}
            project={state.project}
            selectedClipId={state.selectedClipId}
          />

          {/* Timeline */}
          <Timeline
            tracks={state.project.tracks}
            currentTime={state.currentTime}
            duration={state.project.duration}
            zoom={state.zoom}
            snapEnabled={state.snapEnabled}
            selectedClipId={state.selectedClipId}
            selectedTrackId={state.selectedTrackId}
            onSelectClip={(id) => setState(prev => ({ ...prev, selectedClipId: id }))}
            onSelectTrack={(id) => setState(prev => ({ ...prev, selectedTrackId: id }))}
            onSeek={seekTo}
            onUpdateClip={updateClip}
            onDeleteClip={deleteClip}
            onAddTrack={addTrack}
            onDeleteTrack={deleteTrack}
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
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
