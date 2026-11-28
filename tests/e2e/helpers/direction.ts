import { expect, type Page } from '@playwright/test';

/**
 * Switch the UI language the way a user does since Settings v5: the language
 * buttons live in /settings only, not in the editor. Returns to the page the
 * test was on. No-op if already in the wanted language.
 * 'rtl' means Arabic. The layout never mirrors: html dir stays ltr in both
 * languages, so the html lang attribute is the signal to wait on.
 */
export async function setDirection(page: Page, direction: 'ltr' | 'rtl'): Promise<void> {
  const locale = direction === 'rtl' ? 'ar' : 'en';
  if ((await page.locator('html').getAttribute('lang')) === locale) return;
  const url = new URL(page.url());
  const back = url.pathname + url.search;
  await page.goto('/settings');
  await page.getByTestId(direction === 'rtl' ? 'settings-lang-ar-btn' : 'settings-lang-en-btn').click();
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await page.goto(back);
}
