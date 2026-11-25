import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide, useEffectiveBrand } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { mergeTemplateSlotFrames, resolveSlideElements } from '../../core/elementModel';
import { aspectClass as calcAspectClass, getDimensions } from '../../core/formats';
import { RichTextEditor } from './RichTextEditor';
import { parsePlainTextToRichText } from '../../core/richText';
import { processUserUpload } from '../../core/uploads';
import { getAssetUrl } from '../../core/assetStore';
import type { RichText } from '../../core/schema';
import { BrandOverrideControls } from './BrandOverridePopover';

export interface ElementPropertiesPanelProps {
  onClose?: () => void;
  inlineBrandOverride?: boolean;
}

export const ElementPropertiesPanel: React.FC<ElementPropertiesPanelProps> = ({
  onClose,
  inlineBrandOverride = false,
}) => {
  const { t } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();
  const slide = activeSlide || project.slides[0];
  const selectedId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);

  const updateSlotOverride = useProjectStore((state) => state.updateSlotOverride);
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const deleteExtraElement = useProjectStore((state) => state.deleteExtraElement);
  const updateSlideFields = useProjectStore((state) => state.updateSlideFields);
  const updateSlideMedia = useProjectStore((state) => state.updateSlideMedia);

  const effectiveBrand = useEffectiveBrand();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | undefined>();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const layout = getLayoutArchetype(`${slide?.type || 'cover'}-centered`);
  const variant = mergeTemplateSlotFrames(layout?.variants[aspect], project.templateSnapshot?.composition[slide?.type ?? 'cover']?.[aspect]?.slots);

  const elements = useMemo(() => {
    if (!slide || !variant) return [];
    return resolveSlideElements(slide, variant, aspect);
  }, [slide, variant, aspect]);

  const element = elements.find((el) => el.id === selectedId);

  // Check element capabilities
  const isImageElement = Boolean(
    element && (
      (element.kind === 'slot' && element.id === 'media') ||
      element.extra?.kind === 'image'
    )
  );

  const isTextElement = Boolean(
    element && (
      element.extra?.kind === 'text' ||
      (element.kind === 'slot' && (
        element.id === 'title' ||
        element.id === 'body' ||
        element.id === 'caption' ||
        element.id === 'code' ||
        element.id === 'value' ||
        element.id === 'source' ||
        element.id === 'left' ||
        element.id === 'right' ||
        (slide && slide.fields[element.id] !== undefined)
      ))
    )
  );

  // Load preview URL for image element
  useEffect(() => {
    let active = true;
    if (!isImageElement || !slide || !element) {
      setResolvedImageUrl(undefined);
      return;
    }

    if (element.extra?.kind === 'image') {
      const assetId = element.extra.media?.assetId;
      if (assetId) {
        if (/^(data:|blob:|https?:)/i.test(assetId)) {
          setResolvedImageUrl(assetId);
        } else {
          getAssetUrl(assetId).then((url) => {
            if (active) setResolvedImageUrl(url);
          });
        }
      } else {
        setResolvedImageUrl(undefined);
      }
    } else if (element.kind === 'slot' && element.id === 'media') {
      if (slide.media?.assetId) {
        getAssetUrl(slide.media.assetId).then((url) => {
          if (active) setResolvedImageUrl(url);
        });
      } else if (typeof slide.fields.imageUrl === 'string' && slide.fields.imageUrl) {
        setResolvedImageUrl(slide.fields.imageUrl);
      } else if (slide.type === 'cta' && effectiveBrand?.photoDataUrl) {
        setResolvedImageUrl(effectiveBrand.photoDataUrl);
      } else {
        setResolvedImageUrl(undefined);
      }
    }

    return () => {
      active = false;
    };
  }, [isImageElement, slide, element, effectiveBrand?.photoDataUrl]);

  // Reset confirmation state if selected element changes
  useEffect(() => {
    setConfirmDelete(false);
    setUploadError(null);
  }, [selectedId]);

  // P1: Rich text resolution
  const textContent: RichText = useMemo(() => {
    if (!element || !slide) {
      return { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] };
    }
    if (element.extra?.kind === 'text') {
      return element.extra.text || { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] };
    }
    const raw = slide.fields[element.id];
    if (typeof raw === 'string') {
      return parsePlainTextToRichText(raw);
    }
    if (raw && typeof raw === 'object' && raw.type === 'doc') {
      return raw as RichText;
    }
    return { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] };
  }, [element, slide]);

  if (!slide || !element) {
    return (
      <div className="p-4 text-center text-xs text-stone-500">
        <span>{t('editor.deselect')}</span>
      </div>
    );
  }

  const currentScale = Math.round(
    element.kind === 'slot'
      ? (element.w / (element.frame?.inlineSize ?? element.w)) * 100
      : 100
  );
  const currentOpacity = Math.round((element.opacity ?? 1) * 100);

  const handleCommit = (field: 'x' | 'y' | 'w' | 'scale' | 'rotation' | 'opacity', val: number) => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      const baseOverride = {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...(prior?.w !== undefined ? { w: prior.w } : {}),
        ...(prior?.h !== undefined ? { h: prior.h } : {}),
        ...(prior?.rotation !== undefined ? { rotation: prior.rotation } : {}),
        ...(prior?.opacity !== undefined ? { opacity: prior.opacity } : {}),
        locked: prior?.locked ?? element.locked,
        hidden: prior?.hidden ?? element.hidden,
        z: prior?.z ?? element.z,
      };

      if (field === 'x') {
        const naturalX = element.frame?.inlineStart ?? (element.x - (prior?.dx ?? 0));
        const newDx = (val / 100) - naturalX;
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, dx: newDx });
      } else if (field === 'y') {
        const naturalY = element.frame?.blockStart ?? (element.y - (prior?.dy ?? 0));
        const newDy = (val / 100) - naturalY;
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, dy: newDy });
      } else if (field === 'w') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, w: val / 100 });
      } else if (field === 'scale') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, scale: val / 100 });
      } else if (field === 'rotation') {
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, rotation: val });
      } else if (field === 'opacity') {
        const opVal = Math.max(0, Math.min(1, val / 100));
        updateSlotOverride(slide.id, aspect, element.id, { ...baseOverride, opacity: opVal });
      }
    } else if (element.extra) {
      const nextExtra = { ...element.extra };
      if (field === 'x') nextExtra.x = val / 100;
      else if (field === 'y') nextExtra.y = val / 100;
      else if (field === 'w') nextExtra.w = val / 100;
      else if (field === 'rotation') nextExtra.rotation = val;
      else if (field === 'opacity') {
        const opVal = Math.max(0, Math.min(1, val / 100));
        nextExtra.opacity = opVal;
      }
      updateExtraElement(slide.id, nextExtra);
    }
  };

  const handleToggleLock = () => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
        locked: !element.locked,
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, locked: !element.extra.locked });
    }
  };

  const handleToggleHide = () => {
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
        hidden: !element.hidden,
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, hidden: !element.extra.hidden });
    }
  };

  const handleLayerOrder = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? 1 : -1;
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
        z: Math.max(0, element.z + delta),
      });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, z: Math.max(0, element.extra.z + delta) });
    }
  };

  const handleReset = () => {
    if (element.kind === 'slot') {
      const existing = { ...(slide.overrides?.[aspect] || {}) };
      delete existing[element.id];
      const allOverrides = { ...(slide.overrides || {}) };
      allOverrides[aspect] = existing;
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          slides: state.project.slides.map((s) => s.id === slide.id ? { ...s, overrides: allOverrides } : s),
        },
      }));
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, rotation: 0, opacity: 1 });
    }
  };

  // P2: Delete Element Action (Works for every element type)
  const handleDeleteElement = () => {
    if (element.extra) {
      deleteExtraElement(slide.id, element.id);
      selectElement(undefined);
    } else if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      updateSlotOverride(slide.id, aspect, element.id, {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
        ...prior,
        hidden: true,
      });
      selectElement(undefined);
    }
    setConfirmDelete(false);
    onClose?.();
  };

  // P4: Image replacement and upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const processed = await processUserUpload(file);
      const opVal = element.opacity ?? 1;

      if (element.kind === 'slot' && element.id === 'media') {
        updateSlideMedia(slide.id, {
          assetId: processed.assetId,
          fit: slide.media?.fit || 'cover',
          placement: slide.media?.placement || 'top',
        });
        const prior = slide.overrides?.[aspect]?.[element.id];
        updateSlotOverride(slide.id, aspect, element.id, {
          dx: prior?.dx ?? 0,
          dy: prior?.dy ?? 0,
          scale: prior?.scale ?? 1,
          ...prior,
          opacity: opVal,
        });
      } else if (element.extra && element.extra.kind === 'image') {
        updateExtraElement(slide.id, {
          ...element.extra,
          opacity: opVal,
          media: {
            assetId: processed.assetId,
            fit: element.extra.media?.fit || 'cover',
            placement: element.extra.media?.placement || 'top',
          },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setUploadError(msg);
      console.error('Image upload failed:', err);
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // P4: Remove image / reset to default
  const handleRemoveImage = () => {
    if (element.kind === 'slot' && element.id === 'media') {
      updateSlideMedia(slide.id, undefined);
      if (typeof slide.fields.imageUrl === 'string' && slide.fields.imageUrl) {
        updateSlideFields(slide.id, { imageUrl: '' });
      }
    } else if (element.extra && element.extra.kind === 'image') {
      updateExtraElement(slide.id, {
        ...element.extra,
        media: undefined,
      });
    }
    setResolvedImageUrl(undefined);
  };

  const handleTextChange = (doc: RichText) => {
    if (element.kind === 'slot') {
      updateSlideFields(slide.id, { [element.id]: doc });
    } else if (element.extra) {
      updateExtraElement(slide.id, { ...element.extra, text: doc });
    }
  };

  return (
    <div
      data-testid="element-properties-panel"
      className="p-4 space-y-5 flex-1 overflow-y-auto font-sans text-stone-900 dark:text-stone-100"
    >
      {/* 1. Header with Title and Deselect / Close */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
            {t('editor.elementProperties')}
          </span>
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <span>{element.id}</span>
            <span className="text-[11px] font-mono text-stone-400 font-normal">({element.kind})</span>
          </h3>
        </div>

        <button
          type="button"
          data-testid="properties-deselect-btn"
          onClick={() => {
            selectElement(undefined);
            onClose?.();
          }}
          aria-label={t('editor.deselect')}
          title={t('editor.deselect')}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* 1b. Branding Override Controls (inline in Edit panel for mobile) */}
      {inlineBrandOverride && element.id === 'signature' && (
        <BrandOverrideControls inline />
      )}

      {/* 2. Position & Size ("Settings first") */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          Position & Size
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="text-xs text-stone-500 dark:text-stone-400 flex flex-col gap-1">
            <span>{t('editor.xPosition')}</span>
            <input
              type="number"
              data-testid="sidebar-x-position"
              aria-label={`Sidebar ${t('editor.xPosition')}`}
              value={Math.round(element.x * 100)}
              onChange={(e) => handleCommit('x', parseFloat(e.target.value) || 0)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
          <label className="text-xs text-stone-500 dark:text-stone-400 flex flex-col gap-1">
            <span>{t('editor.yPosition')}</span>
            <input
              type="number"
              data-testid="sidebar-y-position"
              aria-label={`Sidebar ${t('editor.yPosition')}`}
              value={Math.round(element.y * 100)}
              onChange={(e) => handleCommit('y', parseFloat(e.target.value) || 0)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
          <label className="text-xs text-stone-500 dark:text-stone-400 flex flex-col gap-1">
            <span>{t('editor.elementWidth')}</span>
            <input
              type="number"
              data-testid="sidebar-element-width"
              aria-label={`Sidebar ${t('editor.elementWidth')}`}
              value={Math.round(element.w * 100)}
              onChange={(e) => handleCommit('w', parseFloat(e.target.value) || 10)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
          <label className="text-xs text-stone-500 dark:text-stone-400 flex flex-col gap-1">
            <span>{t('editor.elementScale')}</span>
            <input
              type="number"
              data-testid="sidebar-element-scale"
              aria-label={`Sidebar ${t('editor.elementScale')}`}
              value={currentScale}
              onChange={(e) => handleCommit('scale', parseFloat(e.target.value) || 100)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
            />
          </label>
        </div>
      </div>

      {/* 3. Rotation & Opacity */}
      <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          Rotation & Opacity
        </label>
        <div className="space-y-3">
          <label className="text-xs text-stone-500 dark:text-stone-400 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span>{t('editor.elementRotation')}</span>
              <span className="font-mono text-xs text-stone-700 dark:text-stone-300">{Math.round(element.rotation)}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                data-testid="sidebar-rotation-slider"
                aria-label={`Sidebar slider ${t('editor.elementRotation')}`}
                value={Math.round(element.rotation)}
                onChange={(e) => handleCommit('rotation', parseFloat(e.target.value) || 0)}
                className="flex-1 accent-amber-600"
              />
              <input
                type="number"
                data-testid="sidebar-rotation-input"
                aria-label={`Sidebar ${t('editor.elementRotation')}`}
                value={Math.round(element.rotation)}
                onChange={(e) => handleCommit('rotation', parseFloat(e.target.value) || 0)}
                className="w-16 py-1 px-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs text-center"
              />
            </div>
          </label>

          <label className="text-xs text-stone-500 dark:text-stone-400 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span>{t('editor.elementOpacity')}</span>
              <span className="font-mono text-xs text-stone-700 dark:text-stone-300">{currentOpacity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                data-testid="sidebar-opacity-slider"
                aria-label={`Sidebar slider ${t('editor.elementOpacity')}`}
                value={currentOpacity}
                onChange={(e) => handleCommit('opacity', parseFloat(e.target.value) || 0)}
                className="flex-1 accent-amber-600"
              />
              <input
                type="number"
                data-testid="sidebar-opacity-input"
                aria-label={`Sidebar ${t('editor.elementOpacity')}`}
                value={currentOpacity}
                onChange={(e) => handleCommit('opacity', parseFloat(e.target.value) || 0)}
                className="w-16 py-1 px-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs text-center"
              />
            </div>
          </label>
        </div>
      </div>

      {/* 4. Image Settings (P4: Replace Image, Remove Image, Opacity for images/placeholders) */}
      {isImageElement && (
        <div data-testid="sidebar-image-controls" className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            {t('editor.imageSettings')}
          </label>

          {/* Hidden File Picker Input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            data-testid="sidebar-image-file-input"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Thumbnail preview / Status */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            {resolvedImageUrl ? (
              <img
                src={resolvedImageUrl}
                alt="Selected element thumbnail"
                data-testid="sidebar-image-thumbnail"
                className="w-14 h-14 object-cover rounded-lg border border-stone-300 dark:border-stone-600 shrink-0 bg-white"
                style={{ opacity: (element.opacity ?? 1) }}
              />
            ) : (
              <div
                data-testid="sidebar-image-placeholder-badge"
                className="w-14 h-14 rounded-lg border border-dashed border-stone-300 dark:border-stone-600 flex items-center justify-center text-stone-400 font-mono text-xs shrink-0 bg-stone-100 dark:bg-stone-900"
              >
                📷
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-700 dark:text-stone-200 truncate">
                {resolvedImageUrl ? `${element.id} (${t('assets.replaceImage')})` : t('editor.emptyPlaceholder')}
              </p>
              <p className="text-[11px] text-stone-400">
                {resolvedImageUrl ? `${currentOpacity}% ${t('editor.elementOpacity').toLowerCase()}` : t('editor.addImage')}
              </p>
            </div>
          </div>

          {uploadError && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
              {uploadError}
            </div>
          )}

          {/* Image Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              data-testid="sidebar-replace-image-btn"
              onClick={() => imageInputRef.current?.click()}
              className="w-full min-h-[40px] py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>🖼️</span>
              <span>{resolvedImageUrl ? t('editor.replaceImage') : t('editor.addImage')}</span>
            </button>

            {resolvedImageUrl && (
              <button
                type="button"
                data-testid="sidebar-remove-image-btn"
                onClick={handleRemoveImage}
                className="w-full min-h-[36px] py-1.5 px-3 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors cursor-pointer"
              >
                {t('editor.removeImage')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Text Editing & Formatting (P1: "Settings first, editing below") */}
      {isTextElement && (
        <div data-testid="sidebar-text-formatting-section" className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            {t('editor.textFormatting')}
          </label>
          <RichTextEditor
            content={textContent}
            onChange={handleTextChange}
            embedded={true}
            autoFocus={false}
          />
        </div>
      )}

      {/* 6. Layer Actions: Lock, Hide, Layer Order, Duplicate, Reset */}
      <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          {t('editor.layers')}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {/* Lock / Unlock */}
          <button
            type="button"
            data-testid="sidebar-lock-btn"
            aria-label={t(element.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: element.id })}
            title={t(element.locked ? 'editor.unlockLayer' : 'editor.lockLayer', { id: element.id })}
            onClick={handleToggleLock}
            className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${element.locked
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
          >
            <span>{element.locked ? '🔒' : '🔓'}</span>
            <span>{element.locked ? t('editor.unlockLayer', { id: '' }).trim() : t('editor.lockLayer', { id: '' }).trim()}</span>
          </button>

          {/* Hide / Show */}
          <button
            type="button"
            data-testid="sidebar-hide-btn"
            aria-label={t(element.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: element.id })}
            title={t(element.hidden ? 'editor.showLayer' : 'editor.hideLayer', { id: element.id })}
            onClick={handleToggleHide}
            className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${element.hidden
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
          >
            <span>{element.hidden ? '👁️‍🗨️' : '👁️'}</span>
            <span>{element.hidden ? t('editor.showLayer', { id: '' }).trim() : t('editor.hideLayer', { id: '' }).trim()}</span>
          </button>

          {/* Layer order up/down */}
          <button
            type="button"
            data-testid="sidebar-layer-up"
            aria-label={t('editor.layerMoveUp', { id: element.id })}
            title={t('editor.layerMoveUp', { id: element.id })}
            onClick={() => handleLayerOrder('up')}
            className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
          >
            ▲
          </button>
          <button
            type="button"
            data-testid="sidebar-layer-down"
            aria-label={t('editor.layerMoveDown', { id: element.id })}
            title={t('editor.layerMoveDown', { id: element.id })}
            onClick={() => handleLayerOrder('down')}
            className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
          >
            ▼
          </button>

          {/* Duplicate (for extras) */}
          {element.extra && (
            <button
              type="button"
              data-testid="sidebar-duplicate-btn"
              aria-label={t('editor.duplicateElement')}
              title={t('editor.duplicateElement')}
              onClick={() => {
                const duplicate = {
                  ...element.extra!,
                  id: `${element.id}_copy_${Date.now().toString(36)}`,
                  x: Math.min(0.9, element.x + 0.03),
                  y: Math.min(0.9, element.y + 0.03),
                  z: element.extra!.z + 1,
                };
                addExtraElement(slide.id, duplicate);
                selectElement(duplicate.id);
              }}
              className="min-h-[40px] px-3 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 flex items-center gap-1 cursor-pointer"
            >
              <span>＋</span>
              <span>{t('editor.duplicateElement')}</span>
            </button>
          )}

          {/* Reset element geometry */}
          <button
            type="button"
            data-testid={`sidebar-reset-${element.id}`}
            aria-label={t('editor.resetElement')}
            title={t('editor.resetElement')}
            onClick={handleReset}
            className="min-h-[40px] px-3 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 flex items-center gap-1 cursor-pointer"
          >
            <span>↺</span>
            <span>{t('editor.resetElement')}</span>
          </button>
        </div>
      </div>

      {/* 7. Destructive Delete Element (P2: Works for all elements, danger style, confirmation dialog) */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
        <label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
          {t('editor.deleteElement')}
        </label>
        {confirmDelete ? (
          <div
            data-testid="delete-confirmation-dialog"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2.5"
          >
            <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
              {t('editor.confirmDeleteElement')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="sidebar-confirm-delete-btn"
                onClick={handleDeleteElement}
                className="flex-1 min-h-[38px] py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {t('editor.confirmDelete')}
              </button>
              <button
                type="button"
                data-testid="sidebar-cancel-delete-btn"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[38px] py-1.5 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                {t('editor.cancelDelete')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            data-testid="sidebar-delete-btn"
            onClick={() => setConfirmDelete(true)}
            aria-label={t('editor.deleteElement')}
            title={t('editor.deleteElement')}
            className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>🗑️</span>
            <span>{t('editor.deleteElement')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
