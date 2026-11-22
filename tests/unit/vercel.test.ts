import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('vercel.json configuration', () => {
  it('is valid json and specifies CSP and security headers', () => {
    const vercelConfigPath = path.resolve(__dirname, '../../vercel.json');
    expect(fs.existsSync(vercelConfigPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    expect(content.framework).toBe('vite');
    expect(content.headers).toBeDefined();

    const headersList: { key: string; value: string }[] = content.headers[0].headers;
    const headerKeys = headersList.map((h) => h.key);

    expect(headerKeys).toContain('Content-Security-Policy');
    expect(headerKeys).toContain('X-Frame-Options');
    expect(headerKeys).toContain('X-Content-Type-Options');
    expect(headerKeys).toContain('Referrer-Policy');

    const csp = headersList.find((h) => h.key === 'Content-Security-Policy')?.value;
    expect(csp).toContain("'self'");
    expect(csp).toContain('data:');
    expect(csp).toContain('blob:');
    expect(csp).toContain('https://va.vercel-scripts.com');
  });
});
