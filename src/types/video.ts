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
  startTime: number;
  duration: number;
  offset: number;
  speed: number;
  volume: number;
  opacity: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  effects: Effect[];
  transitions: { start?: Transition; end?: Transition };
  keyframes: Keyframe[];
  textContent?: string;
  textFont?: string;
  textSize?: number;
  textColor?: string;
  textStroke?: string;
  textStrokeWidth?: number;
  textShadow?: string;
  locked: boolean;
  enabled: boolean;
}

export interface Keyframe {
  id: string;
  time: number; // relative to clip start
  properties: Partial<{
    x: number; y: number; scale: number; rotation: number;
    opacity: number; volume: number; speed: number;
  }>;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
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
