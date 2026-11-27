import React, { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useT } from '../../i18n';
import { useCreateDialogStore } from '../../store/createDialogStore';
import { useProjectStore } from '../../store/projectStore';
import { useRecentStore } from '../../store/recentStore';
import { buildNewProject } from '../../store/newProject';
import {
  CUSTOM_SIZE_MAX,
  CUSTOM_SIZE_MIN,
  FORMAT_LIST,
  customFormatId,
  getDimensions,
  getFormat,
  isValidCustomSize,
} from '../../core/formats';
import { PLATFORMS, getAllowedFormatIds } from '../../core/platforms';
import { CloseIcon, SwapIcon } from '../common/icons';
import '../common/editorial.css';
import type { ContentType, Orientation, PlatformId, Project } from '../../core/schema';
import { TEMPLATE_GALLERY_INDEX, getTemplatePreviewUrl } from '../../gallery/data';
import { useUserTemplateLibrary } from '../../templates/useUserTemplateLibrary';

const PLATFORM_CHOICES: PlatformId[] = ['instagram', 'linkedin', 'facebook'];
const CONTENT_TYPES: ContentType[] = ['post', 'carousel', 'story'];
/** The Blank choice: no template styling, built on the plainest starter (Clean Minimal). */
const BLANK_BASE_TEMPLATE_ID = 'clean-minimal';
const QUICK_SIZES: Array<[number, number]> = [[1200, 628], [1080, 1080], [1280, 720], [1500, 500]];

const sectionLabel = 'text-[11px] font-bold tracking-[0.18em] uppercase text-[color:var(--ed-mut)] mb-2';
const choiceBase = 'rounded-xl border bg-transparent px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-35 disabled:cursor-not-allowed';
const choiceOn = 'border-2 border-[color:var(--ed-acc)] bg-[color-mix(in_srgb,var(--ed-acc)_9%,transparent)] font-bold text-[color:var(--ed-fg)]';
const choiceOff = 'border-[color:var(--ed-card2)] text-[color:var(--ed-fg)] hover:border-[color:var(--ed-acc)]';

function shapeStyle(width: number, height: number, box: number): React.CSSProperties {
  const scale = box / Math.max(width, height);
  return { width: Math.max(10, Math.round(width * scale)), height: Math.max(10, Math.round(height * scale)) };
}

export interface CreateDialogProps {
  onCreated?: (project: Project) => void;
}

export const CreateDialog: React.FC<CreateDialogProps> = ({ onCreated }) => {
  const open = useCreateDialogStore((state) => state.open);
  const request = useCreateDialogStore((state) => state.request);
  const closeDialog = useCreateDialogStore((state) => state.closeDialog);
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) closeDialog(); }}>
      {open && <CreateDialogBody key={`${request.templateId ?? 'blank'}`} onCreated={onCreated} />}
    </Dialog.Root>
  );
};

const CreateDialogBody: React.FC<CreateDialogProps> = ({ onCreated }) => {
  const { t, locale } = useT();
  const request = useCreateDialogStore((state) => state.request);
  const closeDialog = useCreateDialogStore((state) => state.closeDialog);
  const setProject = useProjectStore((state) => state.setProject);
  const saveProject = useRecentStore((state) => state.saveProject);
  const { templates: importedTemplates } = useUserTemplateLibrary();

  const isBlank = !request.templateId;
  const templateId = request.templateId ?? BLANK_BASE_TEMPLATE_ID;
  const blankSelected = isBlank;

  const [platform, setPlatform] = useState<PlatformId>(request.platform ?? 'linkedin');
  const [contentType, setContentType] = useState<ContentType>(request.contentType ?? 'carousel');
  const [formatId, setFormatId] = useState<string>(request.formatId && getFormat(request.formatId) ? request.formatId : 'r_4_5');
  // No default orientation: the user has to pick one for every non-square size.
  const [orientation, setOrientation] = useState<Orientation | null>(null);
  const [customWidth, setCustomWidth] = useState('1080');
  const [customHeight, setCustomHeight] = useState('1350');
  const [lockRatio, setLockRatio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const isCustom = platform === 'custom';
  const cw = Number(customWidth);
  const ch = Number(customHeight);
  const customValid = isValidCustomSize(cw, ch);
  const customTouchedInvalid = isCustom && !customValid;

  const imported = importedTemplates.find((item) => item.id === templateId);
  const gallery = TEMPLATE_GALLERY_INDEX.templates.find((item) => item.id === templateId);
  const templateName = blankSelected ? t('create.blank') : (imported?.manifest.name[locale] ?? gallery?.name[locale] ?? templateId);
  const previewUrl = getTemplatePreviewUrl(templateId);

  const allowedFormats = useMemo(() => getAllowedFormatIds(platform, contentType), [platform, contentType]);
  const effectiveFormatId = isCustom ? (customValid ? customFormatId(cw, ch) : '') : formatId;
  const format = effectiveFormatId ? getFormat(effectiveFormatId) : undefined;
  const needsOrientation = !isCustom && Boolean(format?.orientable);
  const canCreate = !busy && (isCustom ? customValid : format !== undefined && (!needsOrientation || orientation !== null));

  useEffect(() => {
    if (isCustom) return;
    if (!(allowedFormats as readonly string[]).includes(formatId)) {
      setFormatId(allowedFormats[0] ?? 'r_4_5');
      setOrientation(null);
    }
  }, [allowedFormats, formatId, isCustom]);

  const selectPlatform = (next: PlatformId) => {
    setPlatform(next);
    const supported = PLATFORMS[next].supportedContentTypes;
    if (!supported.includes(contentType)) setContentType(supported.includes('carousel') ? 'carousel' : supported[0] ?? 'post');
  };

  const selectFormat = (next: string) => {
    if (next === formatId) return;
    setFormatId(next);
    setOrientation(null);
  };

  const onWidth = (value: string) => {
    const digits = value.replace(/[^\d]/g, '').slice(0, 4);
    setCustomWidth(digits);
    if (lockRatio && cw > 0 && ch > 0 && digits) setCustomHeight(String(Math.round((Number(digits) * ch) / cw)));
  };
  const onHeight = (value: string) => {
    const digits = value.replace(/[^\d]/g, '').slice(0, 4);
    setCustomHeight(digits);
    if (lockRatio && cw > 0 && ch > 0 && digits) setCustomWidth(String(Math.round((Number(digits) * cw) / ch)));
  };

  const previewDims = isCustom
    ? (customValid ? { width: cw, height: ch } : undefined)
    : format && (!needsOrientation || orientation) ? getDimensions(format.id, orientation ?? undefined) : undefined;
  const sizeLabel = isCustom
    ? (customValid ? `${cw} × ${ch}` : t('create.customSize'))
    : format ? `${format.aspectRatio}${needsOrientation && orientation ? ` ${t(orientation === 'portrait' ? 'create.portrait' : 'create.landscape')}` : ''}` : '';
  const platformLabel = isCustom ? t('create.customSize') : PLATFORMS[platform].label;

  const handleCreate = async () => {
    if (!canCreate || !format) return;
    setBusy(true);
    setFailed(false);
    try {
      const resolvedOrientation: Orientation = isCustom
        ? (ch >= cw ? 'portrait' : 'landscape')
        : needsOrientation ? (orientation as Orientation) : 'portrait';
      const project = await buildNewProject({
        templateId,
        platform,
        contentType,
        formatId: format.id,
        orientation: resolvedOrientation,
        textDir: locale === 'ar' ? 'rtl' : 'ltr',
        importedModes: imported ? Object.keys(imported.manifest.theme.modes ?? {}) : undefined,
      });
      saveProject(project);
      setProject(project);
      closeDialog();
      onCreated?.(project);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  const submitLabel = isBlank
    ? t('create.createBlank')
    : contentType === 'post' ? t('wizard.btn.createPost') : contentType === 'story' ? t('wizard.btn.createStory') : t('wizard.btn.create');

  const typeLabel = (type: ContentType) => type === 'post' ? t('wizard.type.post') : type === 'story' ? t('wizard.type.story') : t('wizard.type.carousel');
  const shortType = (type: ContentType) => typeLabel(type).split(' (')[0] ?? typeLabel(type);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <Dialog.Content
        data-testid="create-dialog"
        aria-describedby="create-dialog-lead"
        className="fixed left-1/2 top-1/2 z-50 w-[min(1040px,calc(100vw-1rem))] max-h-[calc(100dvh-1rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-[color:var(--ed-card2)] bg-[color:var(--ed-card)] p-5 text-[color:var(--ed-fg)] shadow-2xl sm:p-8 grid gap-6 md:grid-cols-[300px_1fr] md:gap-9"
      >
        <div className="space-y-3">
          <div
            data-testid="create-preview"
            className="flex h-56 items-center justify-center rounded-2xl bg-[color:var(--ed-bg)] p-4 md:h-[360px]"
          >
            {previewDims ? (
              <div
                data-testid="create-preview-frame"
                className="overflow-hidden rounded-lg bg-[color:var(--ed-card2)] shadow-xl"
                style={shapeStyle(previewDims.width, previewDims.height, 300)}
              >
                {previewUrl && <img src={previewUrl} alt={templateName} className="h-full w-full object-cover object-top" />}
              </div>
            ) : (
              <div
                data-testid="create-preview-neutral"
                className="flex h-40 w-32 items-center justify-center rounded-lg border-2 border-dashed border-[color:var(--ed-mut)] px-3 text-center text-xs font-semibold text-[color:var(--ed-mut)]"
              >
                {t('create.chooseOrientation')}
              </div>
            )}
          </div>
          <div className="flex justify-between gap-2 text-xs text-[color:var(--ed-mut)]" data-testid="create-preview-caption">
            <span>{platformLabel} · {shortType(contentType)} · {sizeLabel}</span>
            <span dir="ltr">{previewDims ? `${previewDims.width} × ${previewDims.height}` : t('create.chooseOrientation')}</span>
          </div>
          <p className="text-[11px] leading-snug text-[color:var(--ed-mut)]">{t('create.previewNote')}</p>
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="ed-serif text-[34px] font-normal leading-tight">
                {isBlank ? t('create.newTitle') : t('create.useTitle', { name: templateName })}
              </Dialog.Title>
              <Dialog.Description id="create-dialog-lead" className="mt-1 text-sm text-[color:var(--ed-mut)]">
                {isBlank ? t('create.leadBlank') : t('create.lead')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t('create.close')}
              data-testid="create-close"
              className="rounded-lg p-2 text-[color:var(--ed-mut)] hover:text-[color:var(--ed-fg)]"
            >
              <CloseIcon size={16} />
            </Dialog.Close>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className={sectionLabel}>{t('create.platform')}</div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('create.platform')}>
                {PLATFORM_CHOICES.map((id) => (
                  <button key={id} type="button" role="radio" aria-checked={platform === id} data-testid={`platform-${id}`}
                    onClick={() => selectPlatform(id)} className={`${choiceBase} ${platform === id ? choiceOn : choiceOff}`}>
                    {PLATFORMS[id].label}
                  </button>
                ))}
                <button type="button" role="radio" aria-checked={isCustom} data-testid="platform-custom"
                  onClick={() => selectPlatform('custom')} className={`${choiceBase} ${isCustom ? choiceOn : choiceOff}`}>
                  {t('create.customSize')}
                </button>
              </div>
            </div>

            <div>
              <div className={sectionLabel}>{t('create.contentType')}</div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('create.contentType')}>
                {CONTENT_TYPES.map((type) => {
                  const supported = PLATFORMS[platform].supportedContentTypes.includes(type);
                  return (
                    <button key={type} type="button" role="radio" aria-checked={contentType === type} disabled={!supported}
                      data-testid={`type-${type}`} onClick={() => setContentType(type)}
                      className={`${choiceBase} ${contentType === type ? choiceOn : choiceOff}`}>
                      {supported ? shortType(type) : `${shortType(type)} (${t('create.notOnPlatform', { platform: PLATFORMS[platform].label })})`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className={sectionLabel}>{t('create.size')}</div>
              {isCustom ? (
                <div data-testid="create-custom-size" className="space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="block text-xs text-[color:var(--ed-mut)]">
                      {t('create.width')}
                      <input data-testid="custom-width" inputMode="numeric" dir="ltr" value={customWidth} onChange={(e) => onWidth(e.target.value)}
                        aria-invalid={customTouchedInvalid} className="mt-1 block w-28 rounded-xl border border-[color:var(--ed-card2)] bg-[color:var(--ed-card)] px-3 py-2.5 text-sm text-[color:var(--ed-fg)]" />
                    </label>
                    <button type="button" data-testid="custom-swap" aria-label={t('create.swap')} title={t('create.swap')}
                      onClick={() => { setCustomWidth(customHeight); setCustomHeight(customWidth); }}
                      className={`${choiceBase} ${choiceOff}`}><SwapIcon size={16} /></button>
                    <label className="block text-xs text-[color:var(--ed-mut)]">
                      {t('create.height')}
                      <input data-testid="custom-height" inputMode="numeric" dir="ltr" value={customHeight} onChange={(e) => onHeight(e.target.value)}
                        aria-invalid={customTouchedInvalid} className="mt-1 block w-28 rounded-xl border border-[color:var(--ed-card2)] bg-[color:var(--ed-card)] px-3 py-2.5 text-sm text-[color:var(--ed-fg)]" />
                    </label>
                    <label className="flex items-center gap-2 pb-3 text-xs text-[color:var(--ed-fg)]">
                      <input data-testid="custom-lock" type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
                      {t('create.lockRatio')}
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SIZES.map(([w, h]) => (
                      <button key={`${w}x${h}`} type="button" data-testid={`quick-${w}x${h}`}
                        onClick={() => { setCustomWidth(String(w)); setCustomHeight(String(h)); }}
                        className={`${choiceBase} px-3 py-1.5 text-xs ${choiceOff}`}>{w}×{h}</button>
                    ))}
                  </div>
                  <p data-testid="custom-range" role={customTouchedInvalid ? 'alert' : undefined}
                    className={`text-xs ${customTouchedInvalid ? 'text-red-500' : 'text-[color:var(--ed-mut)]'}`}>
                    {customTouchedInvalid ? t('create.rangeError', { min: CUSTOM_SIZE_MIN, max: CUSTOM_SIZE_MAX }) : t('create.range', { min: CUSTOM_SIZE_MIN, max: CUSTOM_SIZE_MAX })}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t('create.size')}>
                  {FORMAT_LIST.map((item) => {
                    const allowed = (allowedFormats as readonly string[]).includes(item.id);
                    const dims = item.id === 'r_16_9' ? { width: 16, height: 9 } : { width: item.width, height: item.height };
                    return (
                      <button key={item.id} type="button" role="radio" aria-checked={formatId === item.id} disabled={!allowed}
                        data-testid={`format-${item.id}`} onClick={() => selectFormat(item.id)}
                        className={`${choiceBase} flex flex-col items-center gap-1.5 px-2 py-3 ${formatId === item.id ? choiceOn : choiceOff}`}>
                        <span aria-hidden="true" className="rounded-[3px] border-2 border-[color:var(--ed-acc)]" style={shapeStyle(dims.width, dims.height, 38)} />
                        <span className="text-sm font-semibold">{item.aspectRatio}</span>
                        <span className="text-[11px] font-normal text-[color:var(--ed-mut)]">
                          {item.orientable ? t('create.sizeFree') : `${item.width}×${item.height}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {needsOrientation && format && (
              <div data-testid="create-orientation" className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-[color:var(--ed-mut)]">{t('create.orientation')}</span>
                <div
                  role="radiogroup"
                  aria-label={t('create.orientation')}
                  aria-required="true"
                  className={`flex gap-2 rounded-2xl p-1 ${orientation === null ? 'outline-2 outline-dashed outline-offset-2 outline-red-500' : ''}`}
                >
                  {(['portrait', 'landscape'] as const).map((value) => {
                    const dims = getDimensions(format.id, value);
                    return (
                      <button key={value} type="button" role="radio" aria-checked={orientation === value}
                        data-testid={`orientation-${value}`} onClick={() => setOrientation(value)}
                        className={`${choiceBase} px-3 py-2 text-xs ${orientation === value ? choiceOn : choiceOff}`}>
                        {t(value === 'portrait' ? 'create.portrait' : 'create.landscape')} <span dir="ltr">{dims.width}×{dims.height}</span>
                      </button>
                    );
                  })}
                </div>
                {orientation === null && <span data-testid="orientation-required" className="text-[11px] font-bold uppercase tracking-wide text-red-500">{t('create.orientationRequired')}</span>}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--ed-line)] pt-5">
            <span data-testid="create-summary" className="text-xs text-[color:var(--ed-mut)]">
              {canCreate
                ? t('create.ready', { platform: platformLabel, type: shortType(contentType), size: sizeLabel, template: templateName })
                : isCustom ? t('create.rangeError', { min: CUSTOM_SIZE_MIN, max: CUSTOM_SIZE_MAX }) : t('create.pickOrientation')}
            </span>
            <div className="flex items-center gap-2">
              {failed && <span role="alert" className="text-xs text-red-500">{t('create.failed')}</span>}
              <Dialog.Close data-testid="create-cancel" className="rounded-xl border border-[color:var(--ed-card2)] px-5 py-3 text-sm font-semibold hover:border-[color:var(--ed-acc)]">
                {t('wizard.btn.cancel')}
              </Dialog.Close>
              <button type="button" data-testid="create-submit" disabled={!canCreate} aria-disabled={!canCreate}
                onClick={() => void handleCreate()}
                className="rounded-xl bg-[color:var(--ed-acc)] px-6 py-3 text-sm font-bold text-[color:var(--ed-accfg)] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ed-acc)] disabled:cursor-not-allowed disabled:bg-[color:var(--ed-card2)] disabled:text-[color:var(--ed-mut)]">
                {submitLabel} →
              </button>
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
};
