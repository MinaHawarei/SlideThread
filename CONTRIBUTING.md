# Contributing to SlideThread

Thank you for your interest in contributing to **SlideThread**!

SlideThread is a free, open-source, client-side web application for creating multi-slide social carousels, posts, and stories for Instagram, LinkedIn, and Facebook. It runs entirely in the browser with zero backend and strict data privacy.

---

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, background, or identity. Please treat everyone with respect and empathy.

---

## Architecture & Principles

Before submitting code, keep these core principles in mind:

1. **Client-Side Only:** No backend, databases, server-side queues, or external tracking beyond privacy-friendly, cookieless Vercel Analytics. All project state, images, and export generation happen in the client's browser.
2. **First-Class Bi-Directional Support:** Every slide template and component must render symmetrically in LTR and RTL. Always use CSS logical properties (`margin-inline`, `padding-inline`, `border-inline-start`, etc.) rather than physical directions (`left`/`right`).
3. **No Viewport Units on Slides:** Slides render to fixed virtual canvases (e.g., 1080×1350) and scale via transform matrices. Never use `vw`, `vh`, `dvh`, or `rem` in slide styling.
4. **Strict Type Safety:** TypeScript is configured in `strict` mode. Avoid `any` types; all stores, props, and schemas must have explicit types or Zod runtime validation.
5. **Internationalization:** All user-facing copy belongs in `src/i18n/en.ts` and `src/i18n/ar.ts`. Do not hardcode literal text inside React components.

---

## Getting Started

### Prerequisites

- **Node.js**: version 20 LTS or newer
- **npm**: version 9 or newer
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/minahawarei/SlideThread.git
cd SlideThread

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Development Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Starts the local Vite development server with hot module replacement. |
| `npm run build` | Compiles TypeScript and runs Vite production build. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint across the codebase. |
| `npm run typecheck` | Runs `tsc --noEmit` to verify type safety. |
| `npm test` | Runs the Vitest test suite. |
| `npm run test:e2e` | Runs end-to-end browser tests with Playwright. |

---

## Branching & Pull Requests

1. Fork or branch from `main`. Name your branch using standard prefixes:
   - `feature/<name>` for new capabilities
   - `fix/<name>` for bug fixes
   - `docs/<name>` for documentation updates
   - `refactor/<name>` for code improvements
2. Make atomic, well-tested commits. Follow conventional commit messages:
   - `feat: add new slide template`
   - `fix: resolve Arabic text wrapping in compare slide`
   - `test: add unit tests for OKLCH color generator`
3. Ensure all automated checks pass locally before opening a pull request:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
4. Open a Pull Request on GitHub with a clear description of your changes, screenshots or screen recordings (for UI changes), and references to any relevant issues.

---

## Questions or Ideas?

Feel free to open an issue or start a discussion. We're excited to build SlideThread together!
