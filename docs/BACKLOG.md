# SlideThread Backlog

This document records future expansion ideas, non-blocking enhancements, and design decisions deferred for future releases per `docs/REVISION_PLAN.md`.

---

## 1. Asset Packs & Illustrations (D-08, §5.6)
- **Status:** Shipped curated canonical packs for shapes (MIT, 16 items), presentation icons (ISC/Lucide, 20 items), reaction emojis (CC-BY-4.0/Twemoji, 8 items), and badges/stickers (MIT, 6 items).
- **Opportunity:** When additional illustration styles (such as multi-figure character spots or hand-drawn scene illustrations) are desired, acquire or commission an exclusive or verified permissive set (e.g. unDraw under open terms or commissioned MIT artwork).
- **Non-blocking:** The shipped shapes, icons, emoji, and callout stickers fully satisfy presentation workflows without legal risk.

---

## 2. Video & Animated GIF Export (P5 / Post-v1 Backlog)
- **Status:** Deferred to post-v1. Current engine delivers crisp multi-scale PNG, ZIP, and PDF vector/raster carousels.
- **Opportunity:** Add slide transition video rendering (MP4 / WebM via WebCodecs or client-side Canvas recording) and animated GIF generation for social feeds.
- **Implementation path:** Use browser-native `MediaRecorder` or lightweight WebAssembly FFmpeg worker to render slide transition animations at 30/60fps.

---

## 3. Cloud Sync, Collaborative Editing & Team Workspaces
- **Status:** Local-first architecture (IndexedDB / LocalStorage) ensures zero data collection, privacy, and offline capability.
- **Opportunity:** Optional opt-in sync to Google Drive or custom WebDAV / S3 bucket, enabling teams to share slide decks, custom brand presets, and starter templates.
- **Non-blocking:** Local-first workflow satisfies 100% of standalone creator requirements.

---

## 4. Custom Web Font Upload & WOFF2 Subsetting
- **Status:** Bundles verified open-source Google fonts (Inter, Playfair Display, Space Grotesk, Plus Jakarta Sans, JetBrains Mono, IBM Plex Sans, IBM Plex Sans Arabic, Cairo, Tajawal, Amiri, Noto Sans Arabic, Noto Serif Arabic, Rubik, Alexandria) with comprehensive Latin & Arabic ligature support.
- **Opportunity:** Allow creators to upload custom `.woff2` files into browser IndexedDB storage with local CSS `@font-face` injection and security sanitization.

---

## 5. AI Copywriting & Layout Suggestions (Opt-in Assistant)
- **Status:** Architecture supports pure client-side deterministic templating.
- **Opportunity:** Optional bring-your-own-key (BYOK) Gemini / OpenAI integration to rephrase carousel headlines, suggest slide breakdowns for long articles, or generate bilingual Arabic/English translations.

---

## 6. Extended Transition Animations & Slide Deck Presenter Mode
- **Status:** Slide preview offers smooth CSS transitions and swipe interactions.
- **Opportunity:** Fullscreen presenter view with speaker notes, slide timer, and laser pointer overlay for webinars and live workshops.
