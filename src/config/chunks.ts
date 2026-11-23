/**
 * Rollup manual chunk assignment for production builds (Spec §12 & Task P4-6).
 * Keep the framework and core state cacheable; export libraries stay in the
 * route chunks that request them so Vite's dynamic-import loader stays small.
 */
export function getManualChunk(id: string): string | undefined {
  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom') || id.includes('@vercel/analytics')) {
      return 'vendor-react';
    }
    if (id.includes('culori') || id.includes('zod') || id.includes('idb-keyval') || id.includes('zustand')) {
      return 'vendor-core';
    }
  }
  return undefined;
}
