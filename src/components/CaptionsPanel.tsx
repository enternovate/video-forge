import { useState, useRef, useCallback } from "react";
import type { Clip, Track } from "../types/video";
import { generateId } from "../lib/utils";

interface CaptionsPanelProps {
  tracks: Track[];
  onAddClip: (trackId: string, clip: Clip) => void;
  currentTime: number;
}

export function CaptionsPanel({ tracks, onAddClip, currentTime }: CaptionsPanelProps) {
  const [transcribing, setTranscribing] = useState(false);
  const [captions, setCaptions] = useState<{ text: string; start: number; end: number }[]>([]);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not available in this browser. Try Chrome or Edge."); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let captionStart = currentTime;
    let currentCaption = "";

    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) {
        setCaptions(prev => [...prev, { text: final, start: captionStart, end: currentTime + 1 }]);
        currentCaption = "";
        captionStart = currentTime + 1;
      }
    };

    recognition.onerror = () => setTranscribing(false);
    recognition.start();
    recognitionRef.current = recognition;
    setTranscribing(true);
  }, [currentTime]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setTranscribing(false);
  }, []);

  const applyToTimeline = useCallback(() => {
    const textTrack = tracks.find(t => t.type === 'text');
    if (!textTrack || captions.length === 0) return;

    captions.forEach((cap, idx) => {
      const clip: Clip = {
        id: generateId(), type: 'text', name: `Caption ${idx + 1}`, locked: false, enabled: true,
        startTime: cap.start, duration: Math.max(1, cap.end - cap.start), offset: 0,
        speed: 1, volume: 1, opacity: 1, x: 0, y: 200, scale: 1, rotation: 0,
        effects: [], transitions: {}, keyframes: [],
        textContent: cap.text, textFont: "Arial", textSize: 32, textColor: "#ffffff",
        textStroke: "#000000", textStrokeWidth: 3,
      };
      onAddClip(textTrack.id, clip);
    });
  }, [tracks, captions, onAddClip]);

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Auto Captions</h3>
      <p className="text-[10px] text-gray-500">Speak into your microphone. Captions are generated locally using the Web Speech API — no data sent anywhere.</p>

      <div className="flex gap-2">
        {!transcribing ? (
          <button onClick={startRecording} className="flex-1 py-2 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="flex-1 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
            Stop Recording ({captions.length} captions)
          </button>
        )}
      </div>

      {captions.length > 0 && (
        <>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {captions.map((c, i) => (
              <div key={i} className="text-[10px] bg-gray-800 rounded p-2">
                <span className="text-gray-500 font-mono">{c.start.toFixed(1)}s</span>
                <span className="text-gray-300 ml-2">{c.text}</span>
              </div>
            ))}
          </div>
          <button onClick={applyToTimeline} className="w-full py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
            Add {captions.length} Caption(s) to Timeline
          </button>
        </>
      )}
    </div>
  );
}
