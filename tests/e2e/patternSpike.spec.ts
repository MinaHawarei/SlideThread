import { expect, test } from '@playwright/test';
import { createMeshTiles, renderMeshTileSvg, type MeshOptions } from '../fixtures/meshPatternPrototype';

const options: MeshOptions = { tileWidth: 360, height: 640, seed: 7 };

test('tile mesh preserves prior exported crops and connects at slide boundaries', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/spike');

  const captureTiles = async (svgs: string[]) =>
    page.evaluate(async ({ tileSvgs, width, height }) => {
      // @ts-expect-error Vite resolves this browser import; Node typechecking cannot resolve it.
      const { capture } = await import('/src/export/capture.ts');
      const urls: string[] = [];

      for (const svg of tileSvgs) {
        const tile = document.createElement('div');
        Object.assign(tile.style, {
          position: 'fixed',
          inset: '0 auto auto 0',
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          lineHeight: '0',
          background: '#F2F6FB',
        });
        tile.innerHTML = svg;
        document.body.append(tile);
        urls.push(await capture(tile, { dimensions: { width, height }, warmUp: false }));
        tile.remove();
      }

      return urls;
    }, { tileSvgs: svgs, width: options.tileWidth, height: options.height });

  const threeSlideExports = await captureTiles(createMeshTiles(3, options).map(renderMeshTileSvg));
  const fiveSlideExports = await captureTiles(createMeshTiles(5, options).map(renderMeshTileSvg));

  const result = await page.evaluate(async ({ previous, appended, width, height, seamY }) => {
    const imagePixels = async (url: string) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context unavailable');
      context.drawImage(image, 0, 0);
      return Array.from(context.getImageData(0, 0, width, height).data);
    };

    const prefixPixels = await Promise.all(previous.map(imagePixels));
    const appendedPixels = await Promise.all(appended.slice(0, previous.length).map(imagePixels));
    const prefixMatches = prefixPixels.map((before, index) => {
      const after = appendedPixels[index]!;
      return before.length === after.length && before.every((value, pixel) => value === after[pixel]);
    });

    const first = new Image();
    first.src = appended[0]!;
    const second = new Image();
    second.src = appended[1]!;
    await Promise.all([first.decode(), second.decode()]);
    const combined = document.createElement('canvas');
    combined.width = width * 2;
    combined.height = height;
    const combinedContext = combined.getContext('2d');
    if (!combinedContext) throw new Error('Combined canvas context unavailable');
    combinedContext.drawImage(first, 0, 0);
    combinedContext.drawImage(second, width, 0);

    let seamPixelCount = 0;
    for (let y = Math.floor(seamY) - 2; y <= Math.floor(seamY) + 2; y += 1) {
      for (const x of [width - 1, width]) {
        const [red, green, blue, alpha] = combinedContext.getImageData(x, y, 1, 1).data;
        if (alpha! > 0 && red! < 100 && green! > 60 && green! < 180 && blue! > 100) {
          seamPixelCount += 1;
        }
      }
    }

    return {
      prefixMatches,
      outputDimensions: [first.width, first.height],
      seamPixelCount,
    };
  }, {
    previous: threeSlideExports,
    appended: fiveSlideExports,
    width: options.tileWidth,
    height: options.height,
    seamY: (() => {
      const connector = createMeshTiles(1, options)[0]!.rightBoundary;
      return (
        connector.leftY +
        ((connector.rightY - connector.leftY) * connector.leftOffset) /
          (connector.leftOffset + connector.rightOffset)
      );
    })(),
  });

  expect(threeSlideExports).toHaveLength(3);
  expect(fiveSlideExports).toHaveLength(5);
  expect(result.prefixMatches).toEqual([true, true, true]);
  expect(result.outputDimensions).toEqual([options.tileWidth, options.height]);
  expect(result.seamPixelCount).toBeGreaterThan(0);
});
