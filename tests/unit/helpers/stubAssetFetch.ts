import fs from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const TYPES: Record<string, string> = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };

/** jsdom has no dev server: serve Vite `?url` asset paths straight from the repo so binary template assets can be read. */
export function stubAssetFetch(): void {
  const real = globalThis.fetch;
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, 'http://localhost/');
    const file = path.join(ROOT, decodeURIComponent(url.pathname).replace(/^\/@fs/, ''));
    if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      const bytes = new Uint8Array(fs.readFileSync(file));
      const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
      // jsdom's FileReader only accepts jsdom Blobs; vitest's jsdom environment exposes its window as globalThis.jsdom.
      return { ok: true, status: 200, blob: async () => new ((globalThis as unknown as { jsdom: { window: { Blob: typeof Blob } } }).jsdom.window.Blob)([bytes], { type }) } as unknown as Response;
    }
    return real(input, init);
  });
}
