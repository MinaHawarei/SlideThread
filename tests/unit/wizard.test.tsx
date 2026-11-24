import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Wizard } from '../../src/ui/wizard/Wizard';
import { useProjectStore } from '../../src/store/projectStore';
import { useRecentStore } from '../../src/store/recentStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useI18nStore } from '../../src/i18n';
import type { Project } from '../../src/core/schema';

describe('Wizard component (Task P3-4)', () => {
  beforeEach(() => {
    useI18nStore.getState().setLocale('en');
    useSettingsStore.getState().resetSettings();
    useRecentStore.getState().clearRecents();
  });

  it('renders Step 1 (Select Platform) with 4 platform options and step indicator', () => {
    render(<Wizard />);

    expect(screen.getByTestId('wizard-step-indicator')).toHaveTextContent(/Step 1 of 4/i);
    expect(screen.getByTestId('platform-instagram')).toBeInTheDocument();
    expect(screen.getByTestId('platform-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('platform-facebook')).toBeInTheDocument();
    expect(screen.getByTestId('platform-custom')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-next-btn')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-live-preview')).toBeInTheDocument();
  });

  it('navigates forward and backward between steps', () => {
    render(<Wizard />);

    // Step 1 -> Step 2
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('wizard-step-indicator')).toHaveTextContent(/Step 2 of 4/i);
    expect(screen.getByTestId('type-carousel')).toBeInTheDocument();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('wizard-step-indicator')).toHaveTextContent(/Step 3 of 4/i);

    // Step 3 -> Step 4
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('wizard-step-indicator')).toHaveTextContent(/Step 4 of 4/i);
    expect(screen.getByTestId('template-tech-mesh')).toBeInTheDocument();
    expect(screen.getByTestId('template-clean-minimal')).toBeInTheDocument();
    expect(screen.getByTestId('template-bold-marketing')).toBeInTheDocument();
    expect(screen.getByTestId('template-soft-gradient')).toBeInTheDocument();
    expect(screen.getByTestId('template-heritage-geometric')).toBeInTheDocument();

    // Step 4 -> Step 3 via Back button
    fireEvent.click(screen.getByTestId('wizard-back-btn'));
    expect(screen.getByTestId('wizard-step-indicator')).toHaveTextContent(/Step 3 of 4/i);
  });

  it('enforces platform matrix: LinkedIn does not offer story content type', () => {
    render(<Wizard initialPlatform="linkedin" />);

    // Move to Step 2
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('type-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('type-post')).toBeInTheDocument();
    expect(screen.queryByTestId('type-story')).not.toBeInTheDocument();
  });

  it('reconciles content type when switching to a platform that does not support it', () => {
    render(<Wizard initialPlatform="instagram" initialContentType="story" />);

    // Switch platform to LinkedIn (which does not support story)
    fireEvent.click(screen.getByTestId('platform-linkedin'));

    // Move to Step 2: Content type should have reconciled to carousel or post
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.queryByTestId('type-story')).not.toBeInTheDocument();
    // Carousel should be selected by default
    expect(screen.getByTestId('type-carousel')).toHaveClass('border-cyan-500');
  });

  it('enforces format matrix: Instagram Carousel only allows 4:5 and 1:1', () => {
    render(<Wizard initialPlatform="instagram" initialContentType="carousel" />);

    // Step 1 -> Step 2 -> Step 3
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));

    expect(screen.getByTestId('format-r_4_5')).toBeInTheDocument();
    expect(screen.getByTestId('format-r_1_1')).toBeInTheDocument();
    expect(screen.queryByTestId('format-r_16_9')).not.toBeInTheDocument();
    expect(screen.queryByTestId('format-r_9_16')).not.toBeInTheDocument();
  });

  it('enforces format matrix: LinkedIn Carousel allows 4:5, 1:1, and 16:9 document', () => {
    render(<Wizard initialPlatform="linkedin" initialContentType="carousel" />);

    // Move to Step 3
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));

    expect(screen.getByTestId('format-r_4_5')).toBeInTheDocument();
    expect(screen.getByTestId('format-r_1_1')).toBeInTheDocument();
    expect(screen.getByTestId('format-r_16_9')).toBeInTheDocument();
    expect(screen.queryByTestId('format-r_9_16')).not.toBeInTheDocument();
  });

  it('shows orientation toggle for orientable 16:9 format and updates orientation', () => {
    render(<Wizard initialPlatform="linkedin" initialContentType="carousel" initialFormatId="r_16_9" />);

    // Move to Step 3
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));

    expect(screen.getByTestId('orientation-landscape')).toBeInTheDocument();
    expect(screen.getByTestId('orientation-portrait')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('orientation-portrait'));
    expect(screen.getByTestId('orientation-portrait')).toHaveClass('bg-cyan-600');
  });

  it('completes wizard for carousel and creates project with 2 initial slides', async () => {
    const handleComplete = vi.fn();
    render(<Wizard initialPlatform="linkedin" initialContentType="carousel" onComplete={handleComplete} />);

    // Move through steps 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));

    // Step 4: Pick Clean template
    fireEvent.click(screen.getByTestId('template-clean-minimal'));

    // Click Create Carousel
    fireEvent.click(screen.getByTestId('wizard-create-btn'));

    await waitFor(() => expect(handleComplete).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const created = handleComplete.mock.calls[0]![0] as Project;
    expect(created.contentType).toBe('carousel');
    expect(created.templateId).toBe('clean-minimal');
    expect(created.slides.length).toBe(2);
    expect(created.slides[0]!.type).toBe('cover');
    expect(created.slides[1]!.type).toBe('explain');
    expect(useProjectStore.getState().project.id).toBe(created.id);
    expect(useRecentStore.getState().getProject(created.id)).toBeDefined();
  });

  it('completes wizard for post and creates project with exactly 1 slide (Spec §4.4)', async () => {
    const handleComplete = vi.fn();
    render(<Wizard initialPlatform="instagram" initialContentType="post" onComplete={handleComplete} />);

    // Move through steps 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));

    // Create post
    expect(screen.getByTestId('wizard-create-btn')).toHaveTextContent('Create Post');
    fireEvent.click(screen.getByTestId('wizard-create-btn'));

    await waitFor(() => expect(handleComplete).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const created = handleComplete.mock.calls[0]![0] as Project;
    expect(created.contentType).toBe('post');
    expect(created.slides.length).toBe(1);
    expect(created.slides[0]!.type).toBe('cover');
  });

  it('completes wizard for story and creates project with safe zones active', async () => {
    const handleComplete = vi.fn();
    render(<Wizard initialPlatform="instagram" initialContentType="story" onComplete={handleComplete} />);

    // Move through steps
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-next-btn'));

    expect(screen.getByTestId('wizard-create-btn')).toHaveTextContent('Create Story');
    fireEvent.click(screen.getByTestId('wizard-create-btn'));

    await waitFor(() => expect(handleComplete).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const created = handleComplete.mock.calls[0]![0] as Project;
    expect(created.contentType).toBe('story');
    expect(created.formatId).toBe('r_9_16');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(<Wizard onCancel={handleCancel} />);

    fireEvent.click(screen.getByTestId('wizard-cancel-btn'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('renders correctly in Arabic mode with RTL text direction', () => {
    useI18nStore.getState().setLocale('ar');
    render(<Wizard />);

    expect(screen.getByTestId('wizard-step-indicator')).toHaveTextContent(/الخطوة 1 من 4/i);
    expect(screen.getByTestId('platform-instagram')).toHaveTextContent('إنستجرام');
    expect(screen.getByTestId('wizard-next-btn')).toHaveTextContent('التالي');
  });
});
