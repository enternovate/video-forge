import type { Clip, Track, VideoProject } from "../types/video";
import { generateId } from "./utils";

interface Command {
  type: string;
  undo: () => void;
  redo: () => void;
}

export class UndoRedo {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxSize = 200;

  execute(cmd: Command) {
    cmd.redo();
    this.undoStack.push(cmd);
    this.redoStack = [];
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
  }

  undo() {
    const cmd = this.undoStack.pop();
    if (cmd) { cmd.undo(); this.redoStack.push(cmd); }
  }

  redo() {
    const cmd = this.redoStack.pop();
    if (cmd) { cmd.redo(); this.undoStack.push(cmd); }
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }
}

// --- Pre-built command factories ---

export function createAddClipCommand(
  tracks: Track[], setTracks: (t: Track[]) => void,
  trackId: string, clip: Clip
): Command {
  const before = tracks.map(t => ({ ...t, clips: [...t.clips] }));
  return {
    type: 'add-clip',
    redo: () => setTracks(tracks.map(t =>
      t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
    )),
    undo: () => setTracks(before),
  };
}

export function createDeleteClipCommand(
  tracks: Track[], setTracks: (t: Track[]) => void,
  clipId: string
): Command {
  const before = tracks.map(t => ({ ...t, clips: [...t.clips] }));
  const found = tracks.flatMap(t => t.clips).find(c => c.id === clipId);
  return {
    type: 'delete-clip',
    redo: () => setTracks(tracks.map(t => ({
      ...t, clips: t.clips.filter(c => c.id !== clipId)
    }))),
    undo: () => setTracks(before),
  };
}

export function createUpdateClipCommand(
  tracks: Track[], setTracks: (t: Track[]) => void,
  clipId: string, updates: Partial<Clip>
): Command {
  const before = tracks.map(t => ({
    ...t, clips: t.clips.map(c => c.id === clipId ? { ...c } : c)
  }));
  return {
    type: 'update-clip',
    redo: () => setTracks(tracks.map(t => ({
      ...t, clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
    }))),
    undo: () => setTracks(before),
  };
}

export function createSplitClipCommand(
  tracks: Track[], setTracks: (t: Track[]) => void,
  clipId: string, splitTime: number
): Command {
  const before = tracks.map(t => ({ ...t, clips: [...t.clips] }));
  let clip: Clip | undefined;
  let trackIdx = -1;
  tracks.forEach((t, i) => {
    const c = t.clips.find(c2 => c2.id === clipId);
    if (c) { clip = c; trackIdx = i; }
  });
  if (!clip) return { type: 'split-failed', redo: () => {}, undo: () => {} };

  const rightClip: Clip = {
    ...clip, id: generateId(),
    startTime: splitTime,
    offset: clip.offset + (splitTime - clip.startTime) / clip.speed,
    duration: clip.duration - (splitTime - clip.startTime),
  };
  const leftClip = { ...clip, duration: splitTime - clip.startTime };

  return {
    type: 'split-clip',
    redo: () => setTracks(tracks.map((t, i) =>
      i === trackIdx ? {
        ...t, clips: [
          ...t.clips.filter(c => c.id !== clipId),
          leftClip, rightClip,
        ].sort((a, b) => a.startTime - b.startTime)
      } : t
    )),
    undo: () => setTracks(before),
  };
}
