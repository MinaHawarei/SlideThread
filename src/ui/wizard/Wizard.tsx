import React, { useState, useMemo } from 'react';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useProjectStore, createDefaultSlide } from '../../store/projectStore';
import { useRecentStore } from '../../store/recentStore';
import {
  PLATFORMS,
  PLATFORM_LIST,
  getAllowedFormatIds,
  getAllowedFormats,
} from '../../core/platforms';
import {
  FormatId,
  getDimensions,
  aspectClass as calcAspectClass,
} from '../../core/formats';
import { getAllTemplates, getTemplate } from '../../templates';
import { generatePalette } from '../../core/palette';
import { loadTemplateProjectSnapshot } from '../../templates/projectSnapshot';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { Footer } from '../common/Footer';
import { APP_NAME } from '../../config/site';
import type {
  PlatformId,
  ContentType,
  Orientation,
  TemplateId,
  Project,
  Slide,
} from '../../core/schema';
import { CURRENT_SCHEMA_VERSION, DEFAULT_COUNTER_CONFIG, DEFAULT_SIGNATURE_CONFIG, plainTextFieldsToRichText } from '../../core/schema';

export interface WizardProps {
  initialPlatform?: PlatformId;
  initialContentType?: ContentType;
  initialFormatId?: FormatId;
  initialTemplateId?: TemplateId;
  onComplete?: (project: Project) => void;
  onCancel?: () => void;
}

export const Wizard: React.FC<WizardProps> = ({
  initialPlatform = 'linkedin',
  initialContentType = 'carousel',
  initialFormatId = 'r_4_5',
  initialTemplateId = 'network',
  onComplete,
  onCancel,
}) => {
  const { t, locale } = useT();
  const settings = useSettingsStore((state) => state.settings);
  const setProject = useProjectStore((state) => state.setProject);
  const saveProject = useRecentStore((state) => state.saveProject);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [platform, setPlatform] = useState<PlatformId>(initialPlatform);
  const [contentType, setContentType] = useState<ContentType>(() => {
    const supported = PLATFORMS[initialPlatform]?.supportedContentTypes || ['carousel'];
    if (supported.includes(initialContentType)) return initialContentType;
    return supported.includes('carousel') ? 'carousel' : supported[0] || 'carousel';
  });
  const [formatId, setFormatId] = useState<FormatId>(() => {
    const resolvedType = (PLATFORMS[initialPlatform]?.supportedContentTypes || []).includes(initialContentType)
      ? initialContentType
      : 'carousel';
    const allowed = getAllowedFormatIds(initialPlatform, resolvedType);
    if (allowed.includes(initialFormatId)) return initialFormatId;
    return allowed[0] || 'r_4_5';
  });
  const [orientation, setOrientation] = useState<Orientation>(() =>
    initialFormatId === 'r_16_9' ? 'landscape' : 'portrait'
  );
  const [templateId, setTemplateId] = useState<TemplateId>(
    getTemplate((settings.defaultTemplateId as TemplateId) || initialTemplateId).id
  );

  // Platform selection handler with matrix reconciliation
  const handleSelectPlatform = (nextPlatform: PlatformId) => {
    setPlatform(nextPlatform);
    const supportedTypes = PLATFORMS[nextPlatform]?.supportedContentTypes || ['carousel'];

    // Reconcile contentType if not supported by new platform (prefer carousel if available)
    let nextContentType = contentType;
    if (!supportedTypes.includes(contentType)) {
      nextContentType = supportedTypes.includes('carousel') ? 'carousel' : supportedTypes[0] || 'post';
      setContentType(nextContentType);
    }

    // Reconcile formatId if not allowed for (nextPlatform, nextContentType)
    const allowed = getAllowedFormatIds(nextPlatform, nextContentType);
    if (!allowed.includes(formatId)) {
      const fallbackFormat = allowed[0] || 'r_4_5';
      setFormatId(fallbackFormat);
      if (fallbackFormat === 'r_16_9') {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    }
  };

  // ContentType selection handler with matrix reconciliation
  const handleSelectContentType = (nextType: ContentType) => {
    setContentType(nextType);
    const allowed = getAllowedFormatIds(platform, nextType);
    if (!allowed.includes(formatId)) {
      const fallbackFormat = allowed[0] || 'r_4_5';
      setFormatId(fallbackFormat);
      if (fallbackFormat === 'r_16_9') {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    }
  };

  // Format selection handler
  const handleSelectFormat = (nextFormatId: FormatId) => {
    setFormatId(nextFormatId);
    if (nextFormatId === 'r_16_9') {
      setOrientation((prev) => (prev ? prev : 'landscape'));
    } else {
      setOrientation('portrait');
    }
  };

  // Calculate canvas dimensions and aspectClass
  const dims = useMemo(() => {
    return getDimensions(formatId, orientation);
  }, [formatId, orientation]);

  const aspect = useMemo(() => {
    return calcAspectClass(dims.width, dims.height);
  }, [dims.width, dims.height]);

  // Palette for live preview
  const primaryColor = settings.defaultPrimaryColor || '#35D0E6';
  const theme = settings.defaultTheme || 'dark';
  const palette = useMemo(() => {
    return generatePalette(primaryColor, theme);
  }, [primaryColor, theme]);

  // Live preview slide sample
  const previewSlide: Slide = useMemo(() => {
    const isArabic = locale === 'ar';
    return {
      id: 'wizard_preview_slide',
      type: 'cover',
      fields: plainTextFieldsToRichText({
        tag: platform.toUpperCase(),
        title: isArabic
          ? 'بناء محتوى بصري عالي التأثير'
          : 'High-Impact Multi-Slide Content',
        sub: isArabic
          ? 'تصميم احترافي للمنصات الاجتماعية مع دعم ثنائي اللغة بالكامل.'
          : 'Clean typography, deterministic layouts, and zero-telemetry client execution.',
        rule: 'slidethread.app',
      }),
    };
  }, [platform, locale]);

  // Final project creation
  const handleCreateProject = async () => {
    const isSinglePost = contentType === 'post';
    const isStory = contentType === 'story';

    const defaultTitle = isSinglePost
      ? 'Untitled Post'
      : isStory
      ? 'Untitled Story'
      : 'Untitled Carousel';

    let initialSlides: Slide[];
    if (isSinglePost) {
      initialSlides = [createDefaultSlide('cover', 0)];
    } else {
      initialSlides = [
        createDefaultSlide('cover', 0),
        createDefaultSlide('explain', 1),
      ];
    }

    const templateSnapshot = await loadTemplateProjectSnapshot(templateId, primaryColor);
    const dimensions = getDimensions(formatId, orientation);
    const aspect = calcAspectClass(dimensions.width, dimensions.height);
    initialSlides = initialSlides.map((slide) => ({
      ...slide,
      extras: (templateSnapshot.composition[slide.type]?.[aspect]?.elements ?? []).map((element) => structuredClone(element)),
    }));
    const newProject: Project = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: defaultTitle,
      platform,
      contentType,
      formatId,
      orientation,
      templateId,
      templateSnapshot,
      primaryColor,
      theme,
      textDir: locale === 'ar' ? 'rtl' : 'ltr',
      slides: initialSlides,
      counter: { ...DEFAULT_COUNTER_CONFIG, show: contentType === 'carousel' },
      signature: { ...DEFAULT_SIGNATURE_CONFIG },
      pattern: { enabled: templateId === 'network', intensity: 1 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveProject(newProject);
    setProject(newProject);

    if (onComplete) {
      onComplete(newProject);
    }
  };

  // Allowed content types for current platform
  const supportedContentTypes = PLATFORMS[platform]?.supportedContentTypes || ['carousel'];

  // Allowed formats for current platform and content type
  const allowedFormats = getAllowedFormats(platform, contentType);

  // All 3 templates
  const allTemplates = getAllTemplates();

  // Create button label
  const createButtonLabel =
    contentType === 'post'
      ? t('wizard.btn.createPost')
      : contentType === 'story'
      ? t('wizard.btn.createStory')
      : t('wizard.btn.create');

  // Preview container scale factor
  // Fit 1080 short side into ~260px container
  const previewScale = Math.min(260 / dims.width, 340 / dims.height);
  const scaledWidth = dims.width * previewScale;
  const scaledHeight = dims.height * previewScale;

  return (
    <div data-testid="wizard-screen" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              S
            </div>
            <span className="font-bold tracking-tight text-lg">
              {APP_NAME} <span className="text-slate-400 font-normal">| Wizard</span>
            </span>
          </div>

          <button
            type="button"
            data-testid="wizard-cancel-btn"
            onClick={onCancel}
            aria-label={t('wizard.btn.cancel')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            {t('wizard.btn.cancel')}
          </button>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Steps Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step Progress Tracker */}
          <div
            data-testid="wizard-step-indicator"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuetext={`Step ${step} of 4: ${
              step === 1 ? t('wizard.step1Title') :
              step === 2 ? t('wizard.step2Title') :
              step === 3 ? t('wizard.step3Title') :
              t('wizard.step4Title')
            }`}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>{t('wizard.stepIndicator', { current: step, total: 4 })}</span>
              <span>
                {step === 1 && t('wizard.step1Title')}
                {step === 2 && t('wizard.step2Title')}
                {step === 3 && t('wizard.step3Title')}
                {step === 4 && t('wizard.step4Title')}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: Platform Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('wizard.step1Title')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('wizard.step1Desc')}
                </p>
              </div>

              <div role="radiogroup" aria-label={t('wizard.step1Title')} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLATFORM_LIST.map((p) => {
                  const isSelected = platform === p.id;
                  const platformKey = `wizard.platform.${p.id}` as const;
                  const label = t(platformKey);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-testid={`platform-${p.id}`}
                      onClick={() => handleSelectPlatform(p.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3 focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-slate-900 dark:text-white">
                          {label}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.supportedContentTypes.map((type) => (
                          <span
                            key={type}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Content Type Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('wizard.step2Title')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('wizard.step2Desc')}
                </p>
              </div>

              <div role="radiogroup" aria-label={t('wizard.step2Title')} className="grid grid-cols-1 gap-4">
                {supportedContentTypes.map((type) => {
                  const isSelected = contentType === type;
                  const typeKey = `wizard.type.${type}` as const;
                  const label = t(typeKey);

                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-testid={`type-${type}`}
                      onClick={() => handleSelectContentType(type)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {type === 'carousel' && 'Multi-slide presentation with signature, counter, and swipe navigation.'}
                          {type === 'post' && 'Single high-impact post slide (no additional slides).'}
                          {type === 'story' && 'Full-screen 9:16 vertical story frame with safe zone boundaries.'}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ml-4">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Format & Size Selection (+ Orientation if 16:9) */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('wizard.step3Title')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('wizard.step3Desc')}
                </p>
              </div>

              <div role="radiogroup" aria-label={t('wizard.step3Title')} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allowedFormats.map((f) => {
                  const isSelected = formatId === f.id;
                  let formatKey: 'wizard.format.portrait' | 'wizard.format.square' | 'wizard.format.landscape' | 'wizard.format.tall';
                  if (f.id === 'r_4_5') formatKey = 'wizard.format.portrait';
                  else if (f.id === 'r_1_1') formatKey = 'wizard.format.square';
                  else if (f.id === 'r_16_9') formatKey = 'wizard.format.landscape';
                  else formatKey = 'wizard.format.tall';

                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-testid={`format-${f.id}`}
                      onClick={() => handleSelectFormat(f.id as FormatId)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-2 focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {t(formatKey)}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {f.width} × {f.height} px
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Orientation toggle for orientable formats (16:9) */}
              {formatId === 'r_16_9' && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('wizard.orientation')}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      data-testid="orientation-landscape"
                      onClick={() => setOrientation('landscape')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        orientation === 'landscape'
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {t('wizard.orientation.landscape')} (1920 × 1080)
                    </button>
                    <button
                      type="button"
                      data-testid="orientation-portrait"
                      onClick={() => setOrientation('portrait')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        orientation === 'portrait'
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {t('wizard.orientation.portrait')} (1080 × 1920)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Template Selection */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('wizard.step4Title')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('wizard.step4Desc')}
                </p>
              </div>

              <div role="radiogroup" aria-label={t('wizard.step4Title')} className="grid grid-cols-1 gap-4">
                {allTemplates.map((tmpl) => {
                  const isSelected = templateId === tmpl.id;
                  const templateNameKey = `wizard.template.${tmpl.id}` as const;
                  const templateDescKey = `wizard.templateDesc.${tmpl.id}` as const;

                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-testid={`template-${tmpl.id}`}
                      onClick={() => setTemplateId(tmpl.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900 dark:text-white capitalize">
                            {t(templateNameKey as Parameters<typeof t>[0])}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {tmpl.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(templateDescKey as Parameters<typeof t>[0])}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ml-4">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                data-testid="wizard-back-btn"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
                className="py-2.5 px-5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors"
              >
                ← {t('wizard.btn.back')}
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                data-testid="wizard-next-btn"
                onClick={() => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s))}
                className="py-2.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <span>{t('wizard.btn.next')}</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                data-testid="wizard-create-btn"
                onClick={handleCreateProject}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2"
              >
                <span>{createButtonLabel}</span>
                <span>✨</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Mini-Preview Panel */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('wizard.previewTitle')}
              </h3>
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                {dims.width} × {dims.height}
              </span>
            </div>

            {/* Scaled Preview Stage */}
            <div
              data-testid="wizard-live-preview"
              className="flex items-center justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden"
              style={{ minHeight: '340px' }}
            >
              <div
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                  background: palette.bg,
                }}
              >
                <div
                  style={{
                    width: `${dims.width}px`,
                    height: `${dims.height}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  <SlideRenderer
                    slide={previewSlide}
                    palette={palette}
                    aspectClass={aspect}
                    textDir={locale === 'ar' ? 'rtl' : 'ltr'}
                    brand={settings}
                    slideIndex={0}
                    totalSlides={contentType === 'post' ? 1 : 7}
                    showCounter={contentType !== 'post'}
                    showSafeZones={contentType === 'story' || formatId === 'r_9_16'}
                    isStory={contentType === 'story' || formatId === 'r_9_16'}
                    templateId={templateId}
                    themeMode={theme}
                    dimensions={dims}
                  />
                </div>
              </div>
            </div>

            {/* Spec summary badges */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium capitalize">
                {platform} • {contentType}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                {templateId}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Unobtrusive Footer per Spec §10.3 */}
      <Footer />
    </div>
  );
};
