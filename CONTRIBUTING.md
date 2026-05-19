# Contributing to Video Forge

🎬 **Video Forge is an open-source project.** We welcome contributors of all skill levels — whether you're fixing a typo, adding a feature, or building the next great video editing tool.

## Code of Conduct

Be respectful, inclusive, and constructive. Everyone is welcome.

## How to Contribute

### 🐛 Report Bugs
1. Search [issues](https://github.com/enternovate/video-forge/issues) first
2. Open a new issue with: OS version, steps to reproduce, expected vs actual behavior
3. Attach a sample project file if relevant

### 💡 Suggest Features
1. Open a [feature request](https://github.com/enternovate/video-forge/issues/new)
2. Describe the problem, not just the feature
3. Include examples from other tools (no trademarked names in issue titles)

### 🛠️ Submit Code

```bash
# Fork & clone
git clone https://github.com/YOUR-USERNAME/video-forge
cd video-forge
npm install

# Run dev
npm run tauri dev
```

#### Prerequisites
- Node.js 20+
- Rust 1.70+ (rustup.rs)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

#### Guidelines
- **TypeScript**: Strict mode. No `any` where possible.
- **React**: Functional components + hooks only.
- **CSS**: Tailwind v4. No plain CSS files.
- **Rust**: Standard idioms. No `unsafe`.
- Keep PRs focused on one feature/fix.
- Update README if public behavior changes.
- All builds must pass (`npm run tauri build`).

### 📝 Documentation
Docs improvements are always welcome: README, inline comments, tooltips.

## Architecture

```
src/
  App.tsx            State hub
  components/        UI components (16 files)
  hooks/             React hooks
  lib/               Utilities + color pipeline + undo/redo
  types/             TypeScript types

src-tauri/
  Rust backend with Tauri + file dialog, filesystem, shell plugins
```

## Legal Note

Video Forge uses only royalty-free codecs (VP9/WebM). No patent-encumbered formats (H.264/H.265) are bundled. See SECURITY.md for details.

## Recognition

Contributors are listed in release notes. Significant contributions may lead to maintainer access.

---

*Thank you for contributing to open-source video editing!*
