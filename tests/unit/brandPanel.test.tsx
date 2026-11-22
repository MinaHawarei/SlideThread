import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrandInspector } from '../../src/ui/editor/BrandInspector';
import { calculateSquareCrop } from '../../src/core/media';
import { useSettingsStore, DEFAULT_BRAND_SETTINGS } from '../../src/store/settingsStore';
import { useI18nStore } from '../../src/i18n';
import { SignatureBar } from '../../src/slides/SignatureBar';

describe('Brand Panel & Settings (Spec §6.2, §8.1, Task P3-8)', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
    useI18nStore.getState().setLocale('en');
  });

  describe('calculateSquareCrop pure helper', () => {
    it('center-crops landscape image to square', () => {
      const { srcX, srcY, side } = calculateSquareCrop(1920, 1080);
      expect(side).toBe(1080);
      expect(srcX).toBe(420);
      expect(srcY).toBe(0);
    });

    it('center-crops portrait image to square', () => {
      const { srcX, srcY, side } = calculateSquareCrop(1080, 1350);
      expect(side).toBe(1080);
      expect(srcX).toBe(0);
      expect(srcY).toBe(135);
    });

    it('returns original dimensions for square image', () => {
      const { srcX, srcY, side } = calculateSquareCrop(800, 800);
      expect(side).toBe(800);
      expect(srcX).toBe(0);
      expect(srcY).toBe(0);
    });

    it('gracefully handles invalid dimensions', () => {
      expect(calculateSquareCrop(0, 500).side).toBe(0);
      expect(calculateSquareCrop(-100, 500).side).toBe(0);
      expect(calculateSquareCrop(NaN, 500).side).toBe(0);
    });
  });

  describe('BrandInspector Component', () => {
    it('renders avatar placeholder, name, handle, toggles, language, and reset button', () => {
      render(<BrandInspector />);

      expect(screen.getByTestId('brand-inspector')).toBeInTheDocument();
      expect(screen.getByTestId('brand-avatar-placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('brand-upload-photo-btn')).toBeInTheDocument();
      expect(screen.getByTestId('brand-name-input')).toHaveValue(DEFAULT_BRAND_SETTINGS.displayName);
      expect(screen.getByTestId('brand-handle-input')).toHaveValue(DEFAULT_BRAND_SETTINGS.handle);

      expect(screen.getByTestId('brand-signature-toggle')).toBeChecked();
      expect(screen.getByTestId('brand-counter-toggle')).toBeChecked();
      expect(screen.getByTestId('brand-socials-toggle')).not.toBeChecked();

      expect(screen.getByTestId('brand-lang-en')).toBeInTheDocument();
      expect(screen.getByTestId('brand-lang-ar')).toBeInTheDocument();
      expect(screen.getByTestId('brand-reset-btn')).toBeInTheDocument();
    });

    it('updates display name and handle on input', () => {
      render(<BrandInspector />);

      const nameInput = screen.getByTestId('brand-name-input');
      fireEvent.change(nameInput, { target: { value: 'Alex Developer' } });
      expect(useSettingsStore.getState().settings.displayName).toBe('Alex Developer');

      const handleInput = screen.getByTestId('brand-handle-input');
      fireEvent.change(handleInput, { target: { value: '@alexdev' } });
      expect(useSettingsStore.getState().settings.handle).toBe('@alexdev');
    });

    it('toggles signature bar, slide counter, and socials visibility', () => {
      render(<BrandInspector />);

      // Toggle signature off
      const sigToggle = screen.getByTestId('brand-signature-toggle');
      fireEvent.click(sigToggle);
      expect(useSettingsStore.getState().settings.showSignature).toBe(false);

      // Toggle counter off
      const counterToggle = screen.getByTestId('brand-counter-toggle');
      fireEvent.click(counterToggle);
      expect(useSettingsStore.getState().settings.showCounter).toBe(false);

      // Toggle socials on
      const socialsToggle = screen.getByTestId('brand-socials-toggle');
      fireEvent.click(socialsToggle);
      expect(useSettingsStore.getState().settings.showSocials).toBe(true);
    });

    it('manages social accounts list (add and remove)', () => {
      act(() => {
        useSettingsStore.getState().toggleSocials(true);
      });

      render(<BrandInspector />);

      expect(screen.getByTestId('brand-socials-section')).toBeInTheDocument();
      expect(screen.getByTestId('social-item-linkedin')).toBeInTheDocument();

      // Remove linkedin
      const removeLinkedinBtn = screen.getByTestId('remove-social-linkedin');
      fireEvent.click(removeLinkedinBtn);
      expect(screen.queryByTestId('social-item-linkedin')).not.toBeInTheDocument();

      // Add a new platform
      const select = screen.getByTestId('add-social-platform-select');
      fireEvent.change(select, { target: { value: 'youtube' } });

      const handleInput = screen.getByTestId('add-social-handle-input');
      fireEvent.change(handleInput, { target: { value: '@alexchannel' } });

      const addBtn = screen.getByTestId('add-social-btn');
      fireEvent.click(addBtn);

      expect(screen.getByTestId('social-item-youtube')).toBeInTheDocument();
      expect(useSettingsStore.getState().settings.socials.some((s) => s.platform === 'youtube')).toBe(true);
    });

    it('switches UI language between English and Arabic', () => {
      render(<BrandInspector />);

      // Switch to Arabic
      const arBtn = screen.getByTestId('brand-lang-ar');
      fireEvent.click(arBtn);
      expect(useSettingsStore.getState().settings.language).toBe('ar');
      expect(useI18nStore.getState().locale).toBe('ar');

      // Switch to English
      const enBtn = screen.getByTestId('brand-lang-en');
      fireEvent.click(enBtn);
      expect(useSettingsStore.getState().settings.language).toBe('en');
      expect(useI18nStore.getState().locale).toBe('en');
    });

    it('removes brand photo when Remove Photo is clicked', () => {
      act(() => {
        useSettingsStore.getState().setPhotoDataUrl('data:image/png;base64,fake');
      });

      render(<BrandInspector />);

      expect(screen.getByTestId('brand-avatar-preview')).toBeInTheDocument();

      const removeBtn = screen.getByTestId('brand-remove-photo-btn');
      fireEvent.click(removeBtn);

      expect(useSettingsStore.getState().settings.photoDataUrl).toBeUndefined();
      expect(screen.queryByTestId('brand-avatar-preview')).not.toBeInTheDocument();
    });

    it('resets settings to default on clicking reset button', () => {
      act(() => {
        useSettingsStore.getState().setDisplayName('Custom User');
        useSettingsStore.getState().toggleSignature(false);
      });

      render(<BrandInspector />);

      const resetBtn = screen.getByTestId('brand-reset-btn');
      fireEvent.click(resetBtn);

      expect(useSettingsStore.getState().settings.displayName).toBe(DEFAULT_BRAND_SETTINGS.displayName);
      expect(useSettingsStore.getState().settings.showSignature).toBe(true);
    });

    it('suppresses counter in SignatureBar when showCounter is false in brand settings', () => {
      const { rerender } = render(
        <SignatureBar
          brand={{ ...DEFAULT_BRAND_SETTINGS, showCounter: true }}
          slideIndex={0}
          totalSlides={5}
          showCounter={true}
        />
      );
      expect(screen.getByTestId('slide-counter')).toBeInTheDocument();

      rerender(
        <SignatureBar
          brand={{ ...DEFAULT_BRAND_SETTINGS, showCounter: false }}
          slideIndex={0}
          totalSlides={5}
          showCounter={true}
        />
      );
      expect(screen.queryByTestId('slide-counter')).not.toBeInTheDocument();
    });
  });
});
