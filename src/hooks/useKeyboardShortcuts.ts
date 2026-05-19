import { useEffect } from "react";

interface ShortcutActions {
  togglePlay: () => void;
  seekFwd: () => void;
  seekBwd: () => void;
  stepFwd: () => void;
  stepBwd: () => void;
  splitClip: () => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleSnap: () => void;
  setTool: (t: string) => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions, tool: string) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      const ctrl = e.ctrlKey || e.metaKey;

      switch (true) {
        case e.code === "Space":
          e.preventDefault();
          actions.togglePlay();
          break;
        case e.key === "ArrowRight" && !ctrl:
          actions.stepFwd();
          break;
        case e.key === "ArrowLeft" && !ctrl:
          actions.stepBwd();
          break;
        case e.key === "ArrowRight" && ctrl:
          actions.seekFwd();
          break;
        case e.key === "ArrowLeft" && ctrl:
          actions.seekBwd();
          break;
        case e.key === "c" || e.key === "C":
          actions.setTool("razor");
          break;
        case e.key === "v" || e.key === "V":
          actions.setTool("select");
          break;
        case e.key === "Delete" || e.key === "Backspace":
          actions.deleteSelected();
          break;
        case e.key === "s" || e.key === "S":
          actions.splitClip();
          break;
        case ctrl && e.key === "z":
          e.preventDefault();
          actions.undo();
          break;
        case ctrl && e.key === "Z" && e.shiftKey:
          e.preventDefault();
          actions.redo();
          break;
        case e.key === "=" || e.key === "+":
          actions.zoomIn();
          break;
        case e.key === "-":
          actions.zoomOut();
          break;
        case e.key === "n" || e.key === "N":
          actions.toggleSnap();
          break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [actions, tool]);
}
