import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('EXPORT_SPIKE.md verification', () => {
  it('exists and documents the required results and decisions', () => {
    const spikeDocPath = path.resolve(__dirname, '../../docs/EXPORT_SPIKE.md');
    expect(fs.existsSync(spikeDocPath)).toBe(true);

    const content = fs.readFileSync(spikeDocPath, 'utf8');
    expect(content).toContain('html-to-image');
    expect(content).toContain('modern-screenshot');
    expect(content).toContain('1080×1350');
    expect(content).toContain('jsPDF');
    expect(content).toContain('JSZip');
    expect(content).toContain('Fallback Decision');
  });
});
