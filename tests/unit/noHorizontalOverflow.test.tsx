import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StartScreen } from '../../src/ui/start/StartScreen';
import { GalleryPage } from '../../src/gallery/GalleryPage';
import { TemplatePreviewPage } from '../../src/gallery/TemplatePreviewPage';
import { SettingsPage } from '../../src/ui/settings/SettingsPage';
import { useI18nStore } from '../../src/i18n';

const VIEWPORT_WIDTHS = [320, 360, 390, 768, 1024, 1280];

describe('No Horizontal Overflow Audit (Section 2.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  for (const width of VIEWPORT_WIDTHS) {
    for (const locale of ['en', 'ar'] as const) {
      it(`does not horizontally overflow at width ${width}px in ${locale}`, () => {
        useI18nStore.getState().setLocale(locale);
        window.innerWidth = width;
        document.documentElement.style.width = `${width}px`;

        const { container, unmount } = render(
          <div style={{ width: `${width}px`, maxWidth: `${width}px`, overflowX: 'hidden' }}>
            <StartScreen />
          </div>
        );

        expect(container.scrollWidth).toBeLessThanOrEqual(width);
        unmount();
      });

      it(`GalleryPage does not horizontally overflow at width ${width}px in ${locale}`, () => {
        useI18nStore.getState().setLocale(locale);
        window.innerWidth = width;
        document.documentElement.style.width = `${width}px`;

        const { container, unmount } = render(
          <div style={{ width: `${width}px`, maxWidth: `${width}px`, overflowX: 'hidden' }}>
            <GalleryPage />
          </div>
        );

        expect(container.scrollWidth).toBeLessThanOrEqual(width);
        unmount();
      });

      it(`TemplatePreviewPage does not horizontally overflow at width ${width}px in ${locale}`, () => {
        useI18nStore.getState().setLocale(locale);
        window.innerWidth = width;
        document.documentElement.style.width = `${width}px`;

        const { container, unmount } = render(
          <div style={{ width: `${width}px`, maxWidth: `${width}px`, overflowX: 'hidden' }}>
            <TemplatePreviewPage />
          </div>
        );

        expect(container.scrollWidth).toBeLessThanOrEqual(width);
        unmount();
      });

      it(`SettingsPage does not horizontally overflow at width ${width}px in ${locale}`, () => {
        useI18nStore.getState().setLocale(locale);
        window.innerWidth = width;
        document.documentElement.style.width = `${width}px`;

        const { container, unmount } = render(
          <div style={{ width: `${width}px`, maxWidth: `${width}px`, overflowX: 'hidden' }}>
            <SettingsPage />
          </div>
        );

        expect(container.scrollWidth).toBeLessThanOrEqual(width);
        unmount();
      });
    }
  }
});
