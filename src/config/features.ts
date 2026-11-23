/** Revision features stay off until their complete implementation is ready. */
export const FEATURES = {
  templatePlatform: false,
  elementManipulation: false,
  richTextEditing: false,
  undoRedo: false,
  assetLibrary: false,
  animatedSlideReordering: false,
  settingsPage: false,
  redesignedAppShell: false,
} as const satisfies Record<string, boolean>;

export type FeatureName = keyof typeof FEATURES;
