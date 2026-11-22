# Rich Text Spike

**Date:** 2026-11-23  
**Task:** R0-3  
**Decision:** Use Tiptap with a deliberately small extension set as the R4 editing engine. Keep the persisted `RichText` schema from `REVISION_PLAN.md` as the application data model, and add explicit adapters between it and Tiptap JSON. Do not persist HTML or editor-internal JSON. Arabic IME acceptance stays pending the owner checks in D-09.

## Scope and method

Compared Tiptap, Lexical, and a minimal custom `contenteditable` approach against the R0-3 criteria. Built isolated prototype routes under `/tmp/richtext-clean` using React 18.3.1, Vite 5.4.11, Tiptap 3.35.0, and Lexical 0.53.0. The Tiptap probe used Document, Paragraph, Text, Bold, Underline, and TextStyle extensions. The Lexical probe used LexicalComposer, RichTextPlugin, HistoryPlugin, and OnChangePlugin. Both prototypes used the same React runtime and production minification. No candidate dependency or prototype code was added to the application.

Browser probes ran in system Chrome through Playwright on 2026-11-23. This checks desktop Chromium DOM behavior only; it cannot validate native Arabic keyboard composition on iOS or Android. Exact owner steps are in `docs/QA_CHECKLIST.md` under D-09.

## Findings

| Criterion | Tiptap | Lexical | Minimal custom `contenteditable` |
|---|---|---|---|
| Arabic composition | Not validated with native IME in this environment; requires D-09 device checks. | Not validated with native IME in this environment; requires D-09 device checks. | Browser composition events are available, but correct model updates, selection restoration, and undo around composition become app-owned. Not tested with native IME. |
| Bidi selection | Chromium range probe selected the Arabic substring `مرحبا` inside an RTL editor and returned a non-empty range rectangle. The editor root's computed direction was RTL. This is a desktop DOM check, not proof of reliable caret movement on native keyboards. | With the editor root direction set through Lexical's root node, Chromium computed `rtl` and selected the Arabic substring `مرحبا` with a non-empty range rectangle. Direction must be configured in editor state; a `dir` prop on the React contenteditable alone did not configure Lexical's model. This is a desktop DOM check, not proof of native keyboard caret behavior. | No structured selection model or bidi handling. It would need custom reconciliation with browser selection and composition behavior. |
| Marks serialization | `getJSON()` emitted a `doc → paragraph → text` tree; bold was a typed `{type:"bold"}` mark. TextStyle is an extension point for size, color, and font attributes. | `EditorState.toJSON()` emitted a root/paragraph/text tree; bold was encoded as a text `format` bit (`1`). A serializer adapter must map formats and styles into the app's marks arrays. |
| Paste | A Chromium paste probe inserted `text/plain` into the editor as unmarked text while retaining surrounding bold content. Tiptap schema/clipboard parsing supports controlled paste; configure the editor to accept plain text only per the plan. | A Chromium paste probe inserted `text/plain` as text, with the active selection's bold state retained by the insertion point. Configure plain-text-only handling and test toolbar/selection semantics in R4. |
| JSON fit | Structured schema and marks are close to the plan's doc/block/run shape, but names and supported mark attributes still need a narrow mapper. | Structured JSON is available, but Lexical's node tree and format/style fields need a more substantial mapper to the plan's run marks. |
| React and modularity | Mature React wrapper; extensions are opt-in. StarterKit is convenient but brings blocks and interactions outside this app's first rich-text scope. | Core is framework-agnostic with React bindings and separate plugins. Features are assembled as plugins/nodes. |
| License | MIT. | MIT. | No third-party license, but all editing, serialization, paste, undo, selection and accessibility behavior is custom. |

## Bundle measurement

Built both prototypes with Vite 5.4.11/esbuild minification and measured gzip output. Each entry includes a shared React client chunk (45.77 kB gzip). The total initial-route JavaScript was:

| Prototype | Feature chunk gzip | Shared React chunk gzip | Initial-route JS gzip |
|---|---:|---:|---:|
| Tiptap, small explicit extension set | 100.58 kB | 45.77 kB | 146.35 kB |
| Lexical React rich-text + history stack | 81.50 kB | 45.77 kB | 127.27 kB |

The Tiptap probe is 19.08 kB gzip (about 15%) larger for these specific integration stacks. This is an indicative prototype comparison, not an app-wide delta or a like-for-like feature tally: Lexical's probe includes its history plugin; the small Tiptap probe omits undo/history, which the app's global history system must own. As a sensitivity check, substituting Tiptap StarterKit increased its feature chunk to 131.39 kB gzip and its route total to 177.16 kB, while also including blocks and controls beyond the first editor scope. R4 should use only required extensions and lazy-load the editor route.

The npm package unpacked sizes are not used as a proxy for delivered bundle size. For reference, on this date `npm view` reported unpacked sizes of 589,605 bytes for `@tiptap/react@3.35.0`, 53,977 bytes for `@tiptap/starter-kit@3.35.0`, 3,745,927 bytes for `lexical@0.53.0`, and 929,348 bytes for `@lexical/react@0.53.0`; these include source, declarations, and package files not necessarily shipped to a browser.

## Decision and implementation constraints

Choose Tiptap because its mark-based JSON shape maps more directly to the planned `RichText` runs and because extensions can be limited to the editor's required behavior. The small measured bundle disadvantage is acceptable for the first R4 scope; avoid StarterKit unless a specific extension is required. Lexical remains a viable alternative if R4 reveals a concrete need for its update/plugin architecture or materially better interaction behavior.

R4 constraints:

1. Persist only the app `RichText` model. Implement tested conversion in both directions for paragraphs/list items and bold, underline, highlight, size, color, and font marks; keep editor JSON and HTML transient.
2. Use the same model renderer for slide preview and export; never export the editable DOM.
3. Force plain-text paste and test mixed Arabic/English insertion at both ends of a marked run.
4. Integrate editor updates with global undo/redo and coalesce composition/typing sensibly; do not let the editor's private history diverge from project history.
5. Before R9-1, complete D-09 on physical iOS Safari and Android Chrome devices with Arabic keyboards. Playwright/WebKit proxies do not satisfy that check.
6. Add automated tests for bidi selection, serialization round trips, plain-text paste, and composition event boundaries. Include owner device outcomes in the release QA record.

## Primary sources checked (2026-11-23)

- Tiptap React setup and JSON output: https://tiptap.dev/docs/editor/getting-started/install/react
- Tiptap editor JSON/HTML input, editability, and `textDirection`: https://tiptap.dev/docs/editor/api/editor
- Tiptap paste parsing and clipboard behavior: https://tiptap.dev/docs/guides/faq
- Tiptap text direction commands: https://tiptap.dev/docs/editor/api/commands/nodes-and-marks/set-text-direction
- Lexical architecture, React bindings, immutable state, and JSON serialization: https://lexical.dev/docs/intro
- Tiptap package version/license metadata: https://www.npmjs.com/package/@tiptap/react and https://github.com/ueberdosis/tiptap/blob/main/LICENSE
- Lexical package metadata and license: https://www.npmjs.com/package/lexical, https://www.npmjs.com/package/@lexical/react, and https://github.com/facebook/lexical/blob/main/LICENSE
