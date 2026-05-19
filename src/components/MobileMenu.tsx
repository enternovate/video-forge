interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    onClick: () => void;
  }[];
  title?: string;
}

export function MobileMenu({ open, onClose, items, title }: MobileMenuProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Slide-out drawer from left */}
      <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-gray-900 border-r border-gray-800 shadow-2xl flex flex-col safe-top safe-bottom animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-200">{title || "Menu"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { item.onClick(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors touch-target"
            >
              <span className="w-5 h-5 flex items-center justify-center text-gray-400">{item.icon}</span>
              <span className="text-sm text-gray-300 flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <span className="text-[10px] text-gray-600 font-mono bg-gray-800 px-1.5 py-0.5 rounded">{item.shortcut}</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-[10px] text-gray-600">Developed by Enternovate · MIT License</p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slideIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
