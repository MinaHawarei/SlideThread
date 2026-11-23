import { test, expect } from '@playwright/test';

test.describe('P0-6 Export Evaluation Matrix', () => {
  test('Evaluates capture fidelity, timing, and sequential multi-slide export', async ({ page }) => {
    test.setTimeout(60000); // Allow sufficient time for matrix capture
    await page.goto('/spike');
    await expect(page.locator('h1')).toHaveText(/Phase 0 Export Spike/, { timeout: 15000 });

    // Benchmark both libraries across formats
    const formats = [
      { id: 'portrait_4_5', width: 1080, height: 1350 },
      { id: 'square_1_1', width: 1080, height: 1080 },
      { id: 'story_9_16', width: 1080, height: 1920 },
      { id: 'landscape_16_9', width: 1920, height: 1080 },
    ];

    const results = await page.evaluate(async (testFormats) => {
      // Access the capture function in the browser
      // @ts-expect-error - dynamic import in browser context
      const { capture } = await import('/src/export/capture.ts');

      const logs: {
        library: string;
        format: string;
        durationMs: number;
        dataLength: number;
        success: boolean;
      }[] = [];

      for (const fmt of testFormats) {
        const el = document.getElementById(`stage-slide-${fmt.width}x${fmt.height}`);
        if (!el) continue;

        // Test html-to-image
        try {
          const t0 = performance.now();
          const imgH = await capture(el, {
            library: 'html-to-image',
            dimensions: { width: fmt.width, height: fmt.height },
            warmUp: true,
          });
          const durH = performance.now() - t0;
          logs.push({
            library: 'html-to-image',
            format: `${fmt.width}x${fmt.height}`,
            durationMs: Math.round(durH),
            dataLength: imgH.length,
            success: imgH.startsWith('data:image/png;base64,'),
          });
        } catch {
          logs.push({
            library: 'html-to-image',
            format: `${fmt.width}x${fmt.height}`,
            durationMs: -1,
            dataLength: 0,
            success: false,
          });
        }

        // Test modern-screenshot
        try {
          const t0 = performance.now();
          const imgM = await capture(el, {
            library: 'modern-screenshot',
            dimensions: { width: fmt.width, height: fmt.height },
            warmUp: true,
          });
          const durM = performance.now() - t0;
          logs.push({
            library: 'modern-screenshot',
            format: `${fmt.width}x${fmt.height}`,
            durationMs: Math.round(durM),
            dataLength: imgM.length,
            success: imgM.startsWith('data:image/png;base64,'),
          });
        } catch {
          logs.push({
            library: 'modern-screenshot',
            format: `${fmt.width}x${fmt.height}`,
            durationMs: -1,
            dataLength: 0,
            success: false,
          });
        }
      }

      // Simulate sequential 10-slide export with chosen candidate
      const stageEl = document.getElementById('stage-slide-1080x1350')!;
      const multiTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await capture(stageEl, {
          library: 'html-to-image',
          dimensions: { width: 1080, height: 1350 },
          warmUp: i === 0, // only warm-up first
        });
        multiTimes.push(performance.now() - start);
      }

      return { logs, multiTimes };
    }, formats);

    expect(results.logs.length).toBe(8); // 4 formats x 2 libraries
    for (const log of results.logs) {
      expect(log.success).toBe(true);
      expect(log.dataLength).toBeGreaterThan(1000);
      expect(log.durationMs).toBeGreaterThan(0);
    }

    // Assert sequential 10-slide export completed all slides
    expect(results.multiTimes.length).toBe(10);
  });
});
