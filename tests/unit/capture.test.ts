import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { capture, imagesReady } from '@/export/capture';
import * as htmlToImage from 'html-to-image';
import * as modernScreenshot from 'modern-screenshot';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock-html-to-image'),
}));

vi.mock('modern-screenshot', () => ({
  domToPng: vi.fn().mockResolvedValue('data:image/png;base64,mock-modern-screenshot'),
}));

describe('capture interface', () => {
  const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
  });

  it('captures using html-to-image by default with warm-up', async () => {
    const div = document.createElement('div');
    const result = await capture(div, { library: 'html-to-image', warmUp: true });

    expect(result).toBe('data:image/png;base64,mock-html-to-image');
    // Warm-up + real capture = 2 calls
    expect(htmlToImage.toPng).toHaveBeenCalledTimes(2);
  });

  it('captures using modern-screenshot when selected', async () => {
    const div = document.createElement('div');
    const result = await capture(div, { library: 'modern-screenshot', warmUp: true });

    expect(result).toBe('data:image/png;base64,mock-modern-screenshot');
    expect(modernScreenshot.domToPng).toHaveBeenCalledTimes(2);
  });

  it('loads the mono face used by slide counters before capturing', async () => {
    const loadMock = vi.fn().mockResolvedValue([]);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve(), load: loadMock },
    });
    const div = document.createElement('div');
    div.innerHTML = '<span class="sig-counter-badge">02</span>';
    await capture(div, { warmUp: false });
    expect(loadMock).toHaveBeenCalledWith('normal 400 16px "JetBrains Mono"', 'SlideThread');
    expect(htmlToImage.toPng).toHaveBeenCalledTimes(1);
  });

  it('does not capture until the requested font face has loaded', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<FontFace[]>((resolve) => {
      release = () => resolve([]);
    });
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve(), load: () => gate },
    });
    const div = document.createElement('div');
    div.textContent = 'Hello';
    let settled = false;
    const pending = capture(div, { warmUp: false }).then((value) => {
      settled = true;
      return value;
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(settled).toBe(false);
    expect(htmlToImage.toPng).not.toHaveBeenCalled();
    release?.();
    await expect(pending).resolves.toBe('data:image/png;base64,mock-html-to-image');
    expect(htmlToImage.toPng).toHaveBeenCalledTimes(1);
  });

  it('loads both Arabic and Latin font faces when mixed font runs are present (R4-5)', async () => {
    const loadMock = vi.fn().mockResolvedValue([]);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve(), load: loadMock },
    });
    const div = document.createElement('div');
    div.innerHTML = '<span style="font-family: IBM Plex Sans">SlideThread</span> <span style="font-family: IBM Plex Sans Arabic">للشرائح</span>';
    await capture(div, { warmUp: false });

    const fontDescs = loadMock.mock.calls.map((c) => c[0]);
    expect(fontDescs.some((d: string) => d.includes('IBM Plex Sans Arabic'))).toBe(true);
    expect(fontDescs.some((d: string) => d.includes('IBM Plex Sans"') && !d.includes('Arabic'))).toBe(true);
  });

  it('detects explicit inline font-family styles from rich-text runs (R4-5)', async () => {
    const loadMock = vi.fn().mockResolvedValue([]);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve(), load: loadMock },
    });
    const div = document.createElement('div');
    div.innerHTML = '<span style="font-family: JetBrains Mono">custom code</span>';
    await capture(div, { warmUp: false });

    const fontDescs = loadMock.mock.calls.map((c) => c[0]);
    expect(fontDescs.some((d: string) => d.includes('JetBrains Mono'))).toBe(true);
  });

  it('imagesReady handles images with and without decode method', async () => {
    const container = document.createElement('div');
    const img1 = document.createElement('img');
    img1.decode = vi.fn().mockResolvedValue(undefined);
    container.appendChild(img1);

    await expect(imagesReady(container)).resolves.not.toThrow();
    expect(img1.decode).toHaveBeenCalled();
  });
});
