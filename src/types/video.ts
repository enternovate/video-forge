export interface VideoProject {
  name: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  tracks: Track[];
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'text';
  name: string;
  locked: boolean;
  muted: boolean;
  clips: Clip[];
}

export interface Clip {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  name: string;
  sourcePath?: string;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceDuration?: number;
  startTime: number;   // position on timeline (seconds)
  duration: number;     // trimmed duration (seconds)
  offset: number;       // offset into source (seconds)
  speed: number;        // playback speed multiplier
  volume: number;       // 0-1
  opacity: number;      // 0-1
  x: number;            // position in frame
  y: number;
  scale: number;        // 0.1-5
  rotation: number;     // degrees
  effects: Effect[];
  transitions: { start?: Transition; end?: Transition };
  textContent?: string;
  textFont?: string;
  textSize?: number;
  textColor?: string;
}

export interface Transition {
  type: 'crossfade' | 'fade-in' | 'fade-out' | 'wipe' | 'slide';
  duration: number; // seconds
}

export interface Effect {
  type: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'blur' | 'chromakey';
  value: number;
}

export interface MediaItem {
  id: string;
  name: string;
  path: string;
  type: 'video' | 'audio' | 'image';
  duration: number;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface EditorState {
  project: VideoProject;
  currentTime: number;
  playing: boolean;
  zoom: number; // pixels per second
  snapEnabled: boolean;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  mediaBin: MediaItem[];
}
