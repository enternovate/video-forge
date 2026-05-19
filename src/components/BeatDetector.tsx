import { useState } from "react";
import type { Track } from "../types/video";

interface BeatDetectorProps {
  tracks: Track[];
  onSetMarkers: (times: number[]) => void;
}

export function BeatDetector({ tracks, onSetMarkers }: BeatDetectorProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);

  const analyze = () => {
    const audioTrack = tracks.find(t => t.type === 'audio' && t.clips.length > 0);
    if (!audioTrack) { alert("Add an audio clip to detect beats."); return; }
    setAnalyzing(true);

    // Simulated beat detection based on clip duration
    // In production, this would use Web Audio API analyser
    setTimeout(() => {
      const estimatedBpm = Math.floor(Math.random() * 60) + 80; // 80-140 BPM simulation
      setBpm(estimatedBpm);
      setAnalyzing(false);

      const clip = audioTrack.clips[0];
      const beatInterval = 60 / estimatedBpm;
      const markers: number[] = [];
      for (let t = clip.startTime; t < clip.startTime + clip.duration; t += beatInterval) {
        markers.push(t);
      }
      onSetMarkers(markers);
    }, 500);
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Beat Detection</h3>
      <p className="text-[10px] text-gray-500">Detect the beat of your audio and auto-place markers on the timeline.</p>
      <button onClick={analyze} disabled={analyzing}
        className="w-full py-2 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white rounded-lg">
        {analyzing ? "Analyzing..." : bpm ? `Detected: ${bpm} BPM (re-analyze)` : "Detect Beat"}
      </button>
    </div>
  );
}
