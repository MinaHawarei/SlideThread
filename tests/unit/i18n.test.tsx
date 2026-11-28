import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { en, ar, translate, useT, useI18nStore } from '../../src/i18n';
import { LanguageSwitcher } from '../../src/ui/common/LanguageSwitcher';

describe('i18n Module & Typed Dictionaries (Spec §5.5, §14, Task P3-1)', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'en' });
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  it('both English (en.ts) and Arabic (ar.ts) dictionaries have identical key sets', () => {
    const enKeys = Object.keys(en).sort();
    const arKeys = Object.keys(ar).sort();

    expect(enKeys).toEqual(arKeys);
    expect(enKeys.length).toBeGreaterThan(50);
  });

  it('all translation values in both dictionaries are non-empty strings', () => {
    Object.values(en).forEach((val) => {
      expect(typeof val).toBe('string');
      expect(val.trim().length).toBeGreaterThan(0);
    });

    Object.values(ar).forEach((val) => {
      expect(typeof val).toBe('string');
      expect(val.trim().length).toBeGreaterThan(0);
    });
  });

  it('translate() correctly returns English and Arabic strings', () => {
    expect(translate('en', 'app.name')).toBe('SlideThread');
    expect(translate('ar', 'app.name')).toBe('SlideThread');

    expect(translate('en', 'wizard.platform.instagram')).toBe('Instagram');
    expect(translate('ar', 'wizard.platform.instagram')).toBe('إنستجرام');

    expect(translate('en', 'design.theme.dark')).toBe('Dark');
    expect(translate('ar', 'design.theme.dark')).toBe('داكن');
  });

  it('translate() interpolates parameters correctly', () => {
    const enResult = translate('en', 'editor.slideCounter', { current: 3, total: 10 });
    expect(enResult).toBe('Slide 3 of 10');

    const arResult = translate('ar', 'editor.slideCounter', { current: 3, total: 10 });
    expect(arResult).toBe('شريحة 3 من 10');
  });

  it('useT hook returns correct locale and direction', () => {
    let hookResult: ReturnType<typeof useT> | undefined;

    const TestComponent = () => {
      hookResult = useT();
      return <div>{hookResult.t('common.save')}</div>;
    };

    render(<TestComponent />);

    expect(hookResult?.locale).toBe('en');
    expect(hookResult?.dir).toBe('ltr');
    expect(screen.getByText('Save')).toBeInTheDocument();

    // Switch to Arabic
    hookResult?.setLocale('ar');
    expect(document.documentElement.lang).toBe('ar');
    // Layout never mirrors: the document stays LTR; only text follows the language.
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.classList.contains('rtl')).toBe(false);
  });

  it('LanguageSwitcher component toggles locale and updates document attributes', () => {
    render(<LanguageSwitcher />);

    const btn = screen.getByTestId('language-switcher');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('EN | عربي');
    expect(btn.querySelector('b')?.textContent).toBe('EN');
    expect(btn.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);

    // Click to switch to Arabic
    fireEvent.click(btn);
    expect(useI18nStore.getState().locale).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('ltr');
    expect(btn.querySelector('b')?.textContent).toBe('عربي');

    // Click again to switch back to English
    fireEvent.click(btn);
    expect(useI18nStore.getState().locale).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
