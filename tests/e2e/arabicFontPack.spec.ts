import { test, expect } from '@playwright/test';

const FONTS: Array<[string, string]> = [
  ['marhey', 'Marhey'], ['noto-naskh-arabic', 'Noto Naskh Arabic'], ['amiri', 'Amiri'], ['markazi-text', 'Markazi Text'],
  ['el-messiri', 'El Messiri'], ['scheherazade-new', 'Scheherazade New'], ['harmattan', 'Harmattan'], ['aref-ruqaa', 'Aref Ruqaa'],
  ['rakkas', 'Rakkas'], ['lalezar', 'Lalezar'], ['lemonada', 'Lemonada'], ['changa', 'Changa'], ['reem-kufi', 'Reem Kufi'], ['vazirmatn', 'Vazirmatn'],
];

test('each added Arabic font is in the picker, loads lazily, and renders Arabic and Latin', async ({ page }) => {
  test.setTimeout(110000);
  await page.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.setViewportSize({ width: 1280, height: 900 });
  const fontRequests: string[] = [];
  page.on('request', (req) => { if (/\.woff2?(\?|$)/.test(req.url())) fontRequests.push(req.url()); });
  await page.goto('/editor');
  await expect(page.getByTestId('editor-desktop')).toBeVisible();
  await page.getByTestId('rail-tool-media').click();
  await page.getByTestId('add-text-btn').click();
  await page.getByTestId('rich-text-contenteditable').fill('مرحبا بالعالم SlideThread 123');
  await expect(page.getByTestId('sidebar-element-typography')).toBeVisible();
  const select = page.getByTestId('sidebar-typography-font');
  await page.getByTestId('sidebar-typography-size').fill('44');
  await page.getByTestId('sidebar-x-position').fill('4');
  await page.getByTestId('sidebar-element-width').fill('92');
  for (const [id] of FONTS) await expect(select.locator(`option[value="${id}"]`)).toHaveCount(1);
  expect(fontRequests.filter((u) => /marhey|amiri|vazirmatn/i.test(u))).toHaveLength(0); // lazy: nothing loaded before selection
  const extra = page.getByTestId('main-canvas').locator('[data-testid^="text-extra-"]').last();
  for (const [id, family] of FONTS) {
    await select.selectOption(id);
    await expect.poll(async () => extra.evaluate((n) => (n as HTMLElement).style.fontFamily)).toContain(family);
    await expect.poll(async () => page.evaluate((f) => document.fonts.check(`400 44px "${f}"`, 'مرحبا') && document.fonts.check(`400 44px "${f}"`, 'SlideThread'), family), { timeout: 15000 }).toBe(true);
  }
  expect(fontRequests.length).toBeGreaterThan(0);
  // Specimen sheet: every added family (now loaded) with Arabic and Latin lines, for visual inspection.
  await page.evaluate((fonts) => {
    const o = document.createElement('div');
    o.setAttribute('data-testid', 'font-specimen');
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;color:#111;padding:16px 24px;display:grid;grid-template-columns:1fr 1fr;gap:6px 28px;align-content:start;overflow:hidden';
    for (const [, family] of fonts) {
      const c = document.createElement('div');
      c.style.cssText = `font-family:"${family}";border-bottom:1px solid #ddd;padding:4px 0`;
      c.innerHTML = `<div style="font:11px sans-serif;color:#666">${family}</div><div style="font-size:26px;line-height:1.5" dir="rtl">اكتب شريحتك الأولى بخط جميل ١٢٣</div><div style="font-size:24px">Design scroll-stopping carousels 123</div>`;
      o.appendChild(c);
    }
    document.body.appendChild(o);
  }, FONTS);
  await page.screenshot({ path: 'test-results/arabic-font-specimen.png' });
});
