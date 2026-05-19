import { formatTime } from "../lib/utils";

interface ToolbarProps {
  playing: boolean; onTogglePlay: () => void;
  onImport: () => void; onExport: () => void;
  currentTime: number; duration: number; onSeek: (t: number) => void;
  onUndo: () => void; onRedo: () => void;
  snapEnabled: boolean; onToggleSnap: () => void;
  zoom: number; onZoomChange: (z: number) => void;
  onSplit: () => void; tool: string; onSetTool: (t: string) => void;
  onSave: () => void; onLoad: () => Promise<void>;
  onAddText: () => void;
  canUndo: boolean; canRedo: boolean;
}

export function Toolbar({
  playing, onTogglePlay, onImport, onExport,
  currentTime, duration, onSeek,
  onUndo, onRedo, snapEnabled, onToggleSnap,
  zoom, onZoomChange, onSplit, tool, onSetTool,
  onSave, onLoad, onAddText, canUndo, canRedo,
}: ToolbarProps) {
  return (
    <div className="h-11 bg-gray-900 border-b border-gray-800 flex items-center px-2 gap-1 shrink-0 overflow-x-auto">
      <ToolBtn onClick={onImport} label="Import" shortcut="Ctrl+I">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </ToolBtn>
      <ToolBtn onClick={onSave} label="Save Project" shortcut="Ctrl+S">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
      </ToolBtn>
      <ToolBtn onClick={onLoad} label="Open Project" shortcut="Ctrl+O">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
      </ToolBtn>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <ToolBtn onClick={onTogglePlay} label={playing ? "Pause" : "Play"} shortcut="Space">
        {playing ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        )}
      </ToolBtn>

      <div className="text-xs font-mono text-gray-300 px-2 min-w-[100px] text-center select-none">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      <input type="range" min={0} max={duration || 1} step={0.01} value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="flex-1 max-w-[200px] h-1 accent-blue-500 cursor-pointer" />

      <div className="w-px h-5 bg-gray-700 mx-1" />

      {/* Tools */}
      <ToolBtn onClick={() => onSetTool("select")} active={tool === "select"} label="Select" shortcut="V">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>
      </ToolBtn>
      <ToolBtn onClick={onSplit} active={tool === "razor"} label="Razor (split)" shortcut="S">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="21" /><line x1="3" y1="3" x2="6" y2="3" /><line x1="18" y1="21" x2="21" y2="21" /><line x1="9" y1="9" x2="12" y2="9" /></svg>
      </ToolBtn>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <ToolBtn onClick={onUndo} label="Undo" shortcut="Ctrl+Z" disabled={!canUndo}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
      </ToolBtn>
      <ToolBtn onClick={onRedo} label="Redo" shortcut="Ctrl+Shift+Z" disabled={!canRedo}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
      </ToolBtn>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <ToolBtn onClick={onToggleSnap} active={snapEnabled} label="Snap" shortcut="N">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><circle cx="12" cy="12" r="4" /></svg>
      </ToolBtn>

      <ToolBtn onClick={() => onZoomChange(zoom - 20)} label="Zoom out">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
      </ToolBtn>
      <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
      <ToolBtn onClick={() => onZoomChange(zoom + 20)} label="Zoom in">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
      </ToolBtn>

      <div className="ml-auto flex items-center gap-1">
        <ToolBtn onClick={onAddText} label="Add text/title">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
        </ToolBtn>
        <ToolBtn onClick={onExport} label="Export video">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
        </ToolBtn>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, active, label, shortcut, disabled }: {
  children: React.ReactNode; onClick?: () => void; active?: boolean;
  label?: string; shortcut?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label + (shortcut ? ` (${shortcut})` : '')}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
        disabled ? 'opacity-30 cursor-not-allowed' :
        active ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
