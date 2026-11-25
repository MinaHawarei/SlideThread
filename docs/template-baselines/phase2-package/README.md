# Phase 2 package render comparison

Captured after migrating the five starters to package data. The 20 matrix PNGs come from the app's `/preview?template=<id>` page, with all nine slide types and four aspect classes (36 canvases per page), at 1600×1000 viewport and device scale factor 1. The five 1080×1350 exports were produced through the editor's **Single PNG Image → Current Slide** UI path for the cover in English, dark mode, portrait format.

`manifest.json` records SHA-256 hashes and pixel comparison results against [`../phase2-legacy`](../phase2-legacy). Mean absolute RGB differences are small across all templates and export samples. The legacy baseline remains separate and unchanged.
