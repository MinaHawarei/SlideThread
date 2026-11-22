import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('imagesReady handles images with and without decode method', async () => {
    const container = document.createElement('div');
    const img1 = document.createElement('img');
    img1.decode = vi.fn().mockResolvedValue(undefined);
    container.appendChild(img1);

    await expect(imagesReady(container)).resolves.not.toThrow();
    expect(img1.decode).toHaveBeenCalled();
  });
});
