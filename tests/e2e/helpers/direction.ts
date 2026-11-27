import { expect, type Page } from '@playwright/test';

/**
 * Switch the UI language (and therefore direction) the way a user does since
 * Settings v5: the language buttons live in /settings only, not in the editor.
 * Returns to the page the test was on. No-op if already in the wanted direction.
 */
export async function setDirection(page: Page, direction: 'ltr' | 'rtl'): Promise<void> {
  if ((await page.locator('html').getAttribute('dir')) === direction) return;
  const url = new URL(page.url());
  const back = url.pathname + url.search;
  await page.goto('/settings');
  await page.getByTestId(direction === 'rtl' ? 'settings-lang-ar-btn' : 'settings-lang-en-btn').click();
  await expect(page.locator('html')).toHaveAttribute('dir', direction);
  await page.goto(back);
}
