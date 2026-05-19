import { formatTime } from "../lib/utils";

interface StatusBarProps {
  currentTime: number;
  duration: number;
  fps: number;
  clipCount: number;
  trackCount: number;
  isMobile?: boolean;
}

export function StatusBar({ currentTime, duration, fps, clipCount, trackCount, isMobile }: StatusBarProps) {
  return (
    <div className="h-7 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4 text-xs text-gray-500 shrink-0 safe-bottom">
      <div className="flex items-center gap-4">
        <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
        {!isMobile && (
          <>
            <span className="text-gray-700">|</span>
            <span>{fps} fps</span>
            <span className="text-gray-700">|</span>
            <span>{clipCount} clip{clipCount !== 1 ? 's' : ''}</span>
            <span className="text-gray-700">|</span>
            <span>{trackCount} tracks</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-green-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
          {isMobile ? "" : "Local only"}
        </span>
        {!isMobile && (
          <>
            <span className="text-gray-700">|</span>
            <span className="text-gray-600">Enternovate</span>
          </>
        )}
      </div>
    </div>
  );
}
