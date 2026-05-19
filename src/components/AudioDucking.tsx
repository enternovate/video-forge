import type { Track, Clip } from "../types/video";
import { generateId } from "../lib/utils";

interface AudioDuckingProps {
  tracks: Track[];
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
}

export function AudioDucking({ tracks, onUpdateClip }: AudioDuckingProps) {
  const applyDucking = () => {
    const voiceTracks = tracks.filter(t => t.type === 'audio' && t.clips.some(c => c.name.toLowerCase().includes('voice')));
    const musicTracks = tracks.filter(t => t.type === 'audio' && t.clips.some(c => !c.name.toLowerCase().includes('voice')));
    if (musicTracks.length === 0) { alert("No music tracks found. Name audio clips with 'voice' for voiceover detection."); return; }

    let count = 0;
    for (const music of musicTracks) {
      for (const clip of music.clips) {
        // Reduce volume to 20% during voiceover
        for (const voice of voiceTracks) {
          for (const vc of voice.clips) {
            if (clipsOverlap(clip, vc)) {
              onUpdateClip(clip.id, { volume: 0.2 });
              count++;
            }
          }
        }
      }
    }
    alert(`Applied ducking to ${count} music clip(s). Voiceover clips will cause background music to lower to 20% volume.`);
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audio Ducking</h3>
      <p className="text-[10px] text-gray-500">Automatically lower background music volume when voiceover clips are active. Name audio clips with 'voice' in their name for detection.</p>
      <button onClick={applyDucking}
        className="w-full py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg">
        Apply Audio Ducking
      </button>
    </div>
  );
}

function clipsOverlap(a: { startTime: number; duration: number }, b: { startTime: number; duration: number }): boolean {
  return a.startTime < b.startTime + b.duration && a.startTime + a.duration > b.startTime;
}
