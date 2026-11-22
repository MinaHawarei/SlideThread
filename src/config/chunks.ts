/**
 * Rollup manual chunk assignment for production builds (Spec §12 & Task P4-6).
 * Splits heavy export and framework dependencies into separate cacheable chunks.
 */
export function getManualChunk(id: string): string | undefined {
  if (id.includes('node_modules')) {
    if (
      id.includes('jspdf') ||
      id.includes('html-to-image') ||
      id.includes('modern-screenshot') ||
      id.includes('jszip')
    ) {
      return 'vendor-export';
    }
    if (id.includes('react') || id.includes('react-dom') || id.includes('@vercel/analytics')) {
      return 'vendor-react';
    }
    if (id.includes('culori') || id.includes('zod') || id.includes('idb-keyval') || id.includes('zustand')) {
      return 'vendor-core';
    }
  }
  return undefined;
}
