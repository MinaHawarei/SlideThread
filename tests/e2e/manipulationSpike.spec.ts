import { expect, test } from '@playwright/test';

test('native pointer translation is physical in RTL and survives PNG capture', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/spike');
  await page.evaluate(() => {
    const stage = document.createElement('div');
    Object.assign(stage.style, {
      position: 'fixed',
      inset: '0 auto auto 0',
      width: '360px',
      height: '640px',
      background: '#fff',
      overflow: 'hidden',
      direction: 'rtl',
      zIndex: '99999',
      touchAction: 'none',
    });
    stage.id = 'manipulation-spike-stage';

    const target = document.createElement('div');
    Object.assign(target.style, {
      position: 'absolute',
      left: '40px',
      top: '40px',
      width: '100px',
      height: '60px',
      background: '#e02020',
      transform: 'translate(0px, 0px)',
      touchAction: 'none',
    });
    target.id = 'manipulation-spike-target';
    stage.append(target);
    document.body.append(stage);

    let start: { x: number; y: number } | null = null;
    target.addEventListener('pointerdown', (event) => {
      start = { x: event.clientX, y: event.clientY };
      target.setPointerCapture(event.pointerId);
    });
    target.addEventListener('pointermove', (event) => {
      if (!start || !(event.buttons || event.pointerType === 'touch')) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      target.style.transform = `translate(${dx}px, ${dy}px)`;
      target.dataset.dx = String(dx);
      target.dataset.dy = String(dy);
    });
    target.addEventListener('pointerup', () => {
      start = null;
    });
  });

  await page.mouse.move(60, 60);
  await page.mouse.down();
  await page.mouse.move(150, 310, { steps: 12 });
  await page.mouse.up();

  const moved = await page.locator('#manipulation-spike-target').evaluate((element) => ({
    transform: getComputedStyle(element).transform,
    direction: getComputedStyle(element.parentElement!).direction,
    dx: element.getAttribute('data-dx'),
    dy: element.getAttribute('data-dy'),
  }));
  expect(moved.direction).toBe('rtl');
  expect(moved.transform).toBe('matrix(1, 0, 0, 1, 90, 250)');

  const dataUrl = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves this URL in the browser; Node typechecking cannot resolve it.
    const { capture } = await import('/src/export/capture.ts');
    const stage = document.querySelector<HTMLElement>('#manipulation-spike-stage');
    if (!stage) throw new Error('Spike stage not found');
    return capture(stage, { dimensions: { width: 360, height: 640 }, pixelRatio: 1, warmUp: false });
  });
  expect(dataUrl).toMatch(/^data:image\/png;base64,/);

  const pixels = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 640;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context unavailable');
    context.drawImage(image, 0, 0);
    const read = (x: number, y: number) => Array.from(context.getImageData(x, y, 1, 1).data);
    return { moved: read(180, 320), original: read(50, 50) };
  }, dataUrl);

  expect(pixels.moved).toEqual([224, 32, 32, 255]);
  expect(pixels.original).toEqual([255, 255, 255, 255]);
});
