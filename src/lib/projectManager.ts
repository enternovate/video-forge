import type { VideoProject } from "../types/video";

export function saveProject(project: VideoProject): string {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, "-")}.vfproj`;
  a.click();
  URL.revokeObjectURL(url);
  return data;
}

export async function loadProject(): Promise<VideoProject | null> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const path = await open({
      filters: [{ name: "Video Forge Project", extensions: ["vfproj", "json"] }],
    });
    if (!path) return null;
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const text = await readTextFile(path);
    return JSON.parse(text) as VideoProject;
  } catch {
    // Browser fallback
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".vfproj,.json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const text = await file.text();
        resolve(JSON.parse(text) as VideoProject);
      };
      input.click();
    });
  }
}

export async function saveProjectNative(project: VideoProject): Promise<void> {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({
      filters: [{ name: "Video Forge Project", extensions: ["vfproj"] }],
      defaultPath: `${project.name}.vfproj`,
    });
    if (!path) return;
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    await writeTextFile(path, JSON.stringify(project, null, 2));
  } catch {
    saveProject(project); // fallback to browser download
  }
}
