/**
 * Release Feature Flags.
 *
 * All revision features are fully implemented, verified across test suites,
 * and enabled for production release.
 * The owner may toggle any feature flag here to disable specific capabilities if desired.
 */
export const FEATURES = {
  /** Schema v2 data-only template platform and starter registry */
  templatePlatform: true,
  /** Direct canvas element manipulation (drag, resize, rotate, snap guides) */
  elementManipulation: true,
  /** In-place rich-text formatting (bold, italic, size, color) */
  richTextEditing: true,
  /** Full undo / redo history tracking across all user mutations */
  undoRedo: true,
  /** Asset library (shapes, presentation icons, emojis, stickers, uploads) */
  assetLibrary: true,
  /** Animated slide reordering with keyboard, touch, and reduced-motion fallback */
  animatedSlideReordering: true,
  /** Global settings page and project-level layout/branding overrides */
  settingsPage: true,
  /** Direction A (Atelier) redesigned desktop and mobile app shell */
  redesignedAppShell: true,
} as const satisfies Record<string, boolean>;

export type FeatureName = keyof typeof FEATURES;
