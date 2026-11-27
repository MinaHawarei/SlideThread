import { getShapeSvg, getIconSvg } from '../../assets';
import { extraToPath } from '../../core/convertToPath';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide, useEffectiveBrand } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { getLayoutArchetype } from '../../templates/layouts/registry';
import { NON_TEXT_SLOT_IDS, mergeTemplateSlotFrames, resolveSlideElements, slotFieldKey } from '../../core/elementModel';
import { aspectClass as calcAspectClass, getDimensions } from '../../core/formats';
import { RichTextEditor } from './RichTextEditor';
import { PathEditor } from './PathEditor';
import { parsePlainTextToRichText } from '../../core/richText';
import { processUserUpload } from '../../core/uploads';
import { getAssetUrl } from '../../core/assetStore';
import type { RichText, TextStyleOverride } from '../../core/schema';
import { BrandOverrideControls } from './BrandOverridePopover';
import { FONT_REGISTRY, type FontId } from '../../fonts/registry';
import { loadFont } from '../../fonts/loader';
import { SHAPE_PALETTE_COLORS } from './shapePalette';
import { ImageExtraControls } from './ImageExtraControls';

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
    return resolveSlideElements(slide, variant, aspect, project.templateSnapshot?.composition[slide.type]?.[aspect]?.hiddenSlots);
  }, [slide, variant, aspect, project.templateSnapshot]);

  const element = elements.find((el) => el.id === selectedId);
  const currentTextStyle: TextStyleOverride = element?.extra?.textStyle ?? (element?.kind === 'slot' ? slide?.overrides?.[aspect]?.[element.id]?.textStyle : undefined) ?? {};
  const snapshotFont = element?.id === 'title' || element?.id === 'tag' ? project.templateSnapshot?.fonts.display : element?.id === 'code' ? project.templateSnapshot?.fonts.mono : project.templateSnapshot?.fonts.body;
  const snapshotFontName = snapshotFont?.split(',')[0]?.replace(/["']/g, '').trim().toLowerCase();
  const inheritedFontId: FontId = (Object.values(FONT_REGISTRY).find((font) => font.family.toLowerCase() === snapshotFontName)?.id as FontId | undefined) ?? 'ibm-plex-sans';
  const activeFontId = (currentTextStyle.font ?? inheritedFontId) as FontId;
  const activeFontDefinition = FONT_REGISTRY[activeFontId];

  useEffect(() => {
    const weight = currentTextStyle.weight ?? activeFontDefinition.weights[0]!;
    const style = currentTextStyle.italic ? 'italic' : 'normal';
    void loadFont(activeFontId, weight as 400 | 500 | 600 | 700, style).catch(() => {});
  }, [activeFontId, activeFontDefinition, currentTextStyle.weight, currentTextStyle.italic]);

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
      (element.kind === 'slot' && !NON_TEXT_SLOT_IDS.has(element.id))
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
      const bound = element.extra.binding ? slide.fields[element.extra.binding] : undefined;
      return bound ?? element.extra.text ?? { type: 'doc', blocks: [{ type: 'p', runs: [{ text: '' }] }] };
    }
    const raw = slide.fields[slotFieldKey(slide.type, element.id)];
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
  const extra = element.extra;
  const radiusSupported = Boolean(extra && ((extra.kind === 'shape' && (!extra.assetId && (!extra.shape || extra.shape === 'rectangle'))) || extra.kind === 'image' || (extra.kind === 'text' && Boolean(extra.backgroundColor))));
  const strokeSupported = Boolean(extra && ((extra.kind === 'image') || (extra.kind === 'text' && Boolean(extra.backgroundColor)) || (extra.kind === 'shape' && !extra.assetId && ['rectangle', 'ellipse', 'arrow', 'line', 'path'].includes(extra.shape ?? 'rectangle'))));
  const updateExtra = (patch: Partial<NonNullable<typeof extra>>) => {
    if (element.locked) return;
    if (extra) updateExtraElement(slide.id, { ...extra, ...patch });
  };
  const radiusDefault = extra?.kind === 'image' ? (extra.shape === 'rectangle' ? 16 : 0) : 8;
  const radiusValue = extra?.cornerRadius ?? radiusDefault;

  const handleCommit = (field: 'x' | 'y' | 'w' | 'scale' | 'rotation' | 'opacity', val: number) => {
    if (element.locked) return;
    if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      const baseOverride = {
        dx: prior?.dx ?? 0,
        dy: prior?.dy ?? 0,
        scale: prior?.scale ?? 1,
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
        // Slot size is stored as a scale factor: the renderer ignores width/height overrides on slots.
        const natural = element.frame?.inlineSize ?? element.w;
        const { w: _w, h: _h, ...scaled } = baseOverride as typeof baseOverride & { w?: number; h?: number };
        void _w; void _h;
        updateSlotOverride(slide.id, aspect, element.id, { ...scaled, scale: Math.max(0.1, Math.min(10, (val / 100) / natural)) });
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

  const handleTextStyleChange = (patch: Partial<TextStyleOverride>) => {
    if (element.locked) return;
    if (!element) return;
    const next: TextStyleOverride = { ...currentTextStyle, ...patch };
    for (const [key, value] of Object.entries(next)) if (value === undefined) delete (next as Record<string, unknown>)[key];
    const textStyle = Object.keys(next).length ? next : undefined;
    if (element.extra?.kind === 'text') {
      const base = { ...element.extra };
      delete base.textStyle;
      updateExtraElement(slide.id, { ...base, ...(textStyle ? { textStyle } : {}) });
    } else if (element.kind === 'slot') {
      const prior = slide.overrides?.[aspect]?.[element.id];
      const base = { ...(prior ?? { dx: 0, dy: 0, scale: 1 }) };
      delete base.textStyle;
      updateSlotOverride(slide.id, aspect, element.id, { ...base, dx: prior?.dx ?? 0, dy: prior?.dy ?? 0, scale: prior?.scale ?? 1, ...(textStyle ? { textStyle } : {}) });
    }
  };

  const handleFontChange = async (font: FontId | undefined) => {
    const def = font ? FONT_REGISTRY[font] : undefined;
    const weight = def && def.weights.includes(currentTextStyle.weight ?? 400) ? (currentTextStyle.weight ?? 400) : (def?.weights[0] ?? 400);
    const italic = Boolean(currentTextStyle.italic && def?.styles.includes('italic'));
    if (font && def) await loadFont(font, weight as 400 | 500 | 600 | 700, italic ? 'italic' : 'normal');
    handleTextStyleChange({ font, ...(def && currentTextStyle.weight !== undefined && !def.weights.includes(currentTextStyle.weight) ? { weight: undefined } : {}), ...(currentTextStyle.italic && !def?.styles.includes('italic') ? { italic: undefined } : {}) });
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
      const defaults = project.templateSnapshot?.composition[slide.type]?.[aspect]?.elements;
      const templateDefault = defaults?.find((candidate) => candidate.id === element.id);
      if (templateDefault) {
        updateExtraElement(slide.id, structuredClone(templateDefault));
        if (templateDefault.binding && templateDefault.text) updateSlideFields(slide.id, { [templateDefault.binding]: templateDefault.text });
      } else {
        updateExtraElement(slide.id, { ...element.extra, rotation: 0, opacity: 1 });
      }
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
    if (element.locked) return;
    if (element.kind === 'slot') {
      updateSlideFields(slide.id, { [slotFieldKey(slide.type, element.id)]: doc });
    } else if (element.extra?.binding) {
      updateSlideFields(slide.id, { [element.extra.binding]: doc });
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

      {element.locked && <p data-testid="sidebar-locked-notice" className="text-xs text-amber-700 dark:text-amber-400">{t('editor.unlockLayer', { id: '' }).trim()} 🔒</p>}
      <fieldset disabled={element.locked} className="contents">
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
      {extra && (radiusSupported || strokeSupported || extra.kind === 'text') && (
        <div data-testid="sidebar-style-controls" className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          {extra.kind === 'text' && <label className="flex items-center justify-between text-xs">{t('editor.chipBackground')}<input aria-label={t('editor.chipBackground')} type="color" value={extra.backgroundColor?.startsWith('#') ? extra.backgroundColor : '#000000'} onChange={(event) => updateExtra({ backgroundColor: event.target.value })} /></label>}
          {radiusSupported && <label className="block text-xs text-stone-600 dark:text-stone-300">{t('editor.radius')} <span className="font-mono">{Math.round(radiusValue)}px</span>
            <input data-testid="sidebar-corner-radius" aria-label={t('editor.radius')} type="range" min="0" max="250" value={radiusValue} onChange={(e) => updateExtra({ cornerRadius: Number(e.target.value) === radiusDefault ? undefined : Number(e.target.value) })} className="w-full accent-amber-600" />
            <button type="button" onClick={() => updateExtra({ cornerRadius: undefined })} className="text-xs text-cyan-700">{t('editor.radiusReset')}</button>
          </label>}
          {strokeSupported && <div className="space-y-2">
            <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">{t('editor.stroke')}</div>
            {extra.kind !== 'shape' || extra.shape !== 'line' ? <label className="flex items-center justify-between text-xs">{t('editor.stroke')}<input aria-label={t('editor.stroke')} type="color" value={extra.strokeColor?.startsWith('#') ? extra.strokeColor : '#000000'} onChange={(e) => updateExtra({ strokeColor: e.target.value, strokeWidth: extra.strokeWidth || 2 })} /></label> : null}
            <label className="block text-xs">{t('editor.strokeWidth')} <span className="font-mono">{extra.strokeWidth ?? (extra.kind === 'shape' && extra.shape === 'line' ? 4 : 0)}px</span>
              <input aria-label={t('editor.strokeWidth')} type="range" min={extra.kind === 'shape' && extra.shape === 'line' ? 1 : 0} max="30" value={extra.strokeWidth ?? (extra.kind === 'shape' && extra.shape === 'line' ? 4 : 0)} onChange={(e) => updateExtra({ strokeWidth: Number(e.target.value) || undefined })} className="w-full accent-amber-600" />
            </label>
            <select aria-label={t('editor.strokeStyle')} value={extra.strokeStyle ?? 'solid'} onChange={(e) => updateExtra({ strokeStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })} className="w-full rounded border p-1 text-xs"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select>
            <button type="button" onClick={() => updateExtra({ strokeColor: undefined, strokeWidth: undefined, strokeStyle: undefined })} className="text-xs text-cyan-700">{t('editor.resetElement')}</button>
          </div>}
        </div>
      )}
      {extra?.kind === 'shape' && (
        <div data-testid="selected-shape-controls" className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-800">
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">{extra.assetId && Boolean(getShapeSvg(extra.assetId) || getIconSvg(extra.assetId)) ? 'Quick colors (outline)' : t('assets.shapeColor')}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SHAPE_PALETTE_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                data-testid={`shape-palette-color-${hex}`}
                onClick={() => updateExtra({ fill: hex })}
                style={{ backgroundColor: hex }}
                className={`w-7 h-7 rounded-md border transition-transform cursor-pointer ${extra.fill === hex ? 'scale-110 border-cyan-500 ring-2 ring-cyan-400/50' : 'border-stone-300 dark:border-stone-700 hover:scale-105'}`}
                aria-label={hex}
              />
            ))}
            <input
              type="color"
              data-testid="shape-color-input"
              aria-label={t('assets.shapeColor')}
              value={extra.fill?.startsWith('#') ? extra.fill : '#0891b2'}
              onChange={(e) => updateExtra({ fill: e.target.value })}
              className="w-7 h-7 p-0 rounded-md border border-stone-300 dark:border-stone-700 cursor-pointer"
            />
          </div>
        </div>
      )}
      {extra?.kind === 'shape' && extra.shape !== 'path' && (() => {
        const converted = extraToPath(extra, (id) => getShapeSvg(id));
        if (!converted) return null;
        return (
          <div data-testid="convert-to-path-controls" className="space-y-1 pt-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              data-testid="convert-to-path"
              onClick={() => {
                if (element.locked) return;
                const { assetId: _assetId, ...rest } = extra;
                void _assetId;
                const outline = extra.strokeColor ?? extra.fill;
                updateExtraElement(slide.id, {
                  ...rest,
                  shape: 'path',
                  path: converted,
                  ...(extra.assetId ? { fill: outline, strokeColor: outline, strokeWidth: extra.strokeWidth ?? 4, innerFill: extra.innerFill ?? 'none' } : {}),
                });
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-cyan-600 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
            >
              Convert to editable path (anchor points)
            </button>
            <p className="text-[11px] text-stone-500">Turns this shape into a path so you can move its points and pull curve handles. You can undo this with Undo.</p>
          </div>
        );
      })()}
      {extra?.kind === 'shape' && extra.shape === 'path' && extra.path?.closed && (
        <div data-testid="path-fill-controls" className="flex items-center justify-between text-xs pt-2 border-t border-stone-200 dark:border-stone-800">
          <span>Fill</span>
          <span className="flex items-center gap-1.5">
            <button type="button" data-testid="path-fill-none" aria-pressed={extra.innerFill === 'none'} onClick={() => updateExtra({ innerFill: 'none', strokeWidth: extra.strokeWidth || 4 })} className={`px-2 py-1 rounded border text-[11px] ${extra.innerFill === 'none' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' : 'border-stone-300 dark:border-stone-700'}`}>No fill</button>
            <input data-testid="path-fill-color" aria-label="Fill color" type="color" value={(extra.innerFill ?? extra.fill)?.startsWith('#') ? (extra.innerFill ?? extra.fill) : '#0891b2'} onChange={(e) => updateExtra({ innerFill: e.target.value, fill: e.target.value })} className="w-7 h-7 p-0 rounded-md border border-stone-300 dark:border-stone-700 cursor-pointer" />
          </span>
        </div>
      )}
      {extra?.kind === 'shape' && extra.assetId && Boolean(getShapeSvg(extra.assetId) || getIconSvg(extra.assetId)) && (
        <div data-testid="asset-style-controls" className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">Fill and outline</div>
          <div className="flex items-center justify-between text-xs">
            <span>Fill</span>
            <span className="flex items-center gap-1.5">
              <button type="button" data-testid="asset-fill-none" aria-pressed={extra.innerFill === 'none'} onClick={() => updateExtra({ innerFill: 'none' })} className={`px-2 py-1 rounded border text-[11px] ${extra.innerFill === 'none' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' : 'border-stone-300 dark:border-stone-700'}`}>No fill</button>
              <input data-testid="asset-fill-color" aria-label="Fill color" type="color" value={extra.innerFill?.startsWith('#') ? extra.innerFill : '#0891b2'} onChange={(e) => updateExtra({ innerFill: e.target.value })} className="w-7 h-7 p-0 rounded-md border border-stone-300 dark:border-stone-700 cursor-pointer" />
            </span>
          </div>
          <label className="flex items-center justify-between text-xs">Outline color
            <input data-testid="asset-stroke-color" aria-label="Outline color" type="color" value={(extra.strokeColor ?? extra.fill)?.startsWith('#') ? (extra.strokeColor ?? extra.fill) : '#0891b2'} onChange={(e) => updateExtra({ strokeColor: e.target.value })} />
          </label>
          <label className="block text-xs">Outline width <span className="font-mono">{extra.strokeWidth ?? 4}</span>
            <input data-testid="asset-stroke-width" aria-label="Outline width" type="range" min="1" max="16" value={extra.strokeWidth ?? 4} onChange={(e) => updateExtra({ strokeWidth: Number(e.target.value) })} className="w-full accent-amber-600" />
          </label>
        </div>
      )}
      {extra?.kind === 'image' && <ImageExtraControls />}
      {extra?.kind === 'shape' && extra.shape === 'path' && extra.path && <PathEditor path={extra.path} color={extra.fill ?? '#0891b2'} onChange={(path) => updateExtra({ path })} />}
      {extra?.kind === 'image' && <div data-testid="sidebar-image-filters" className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
        <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">{t('editor.filters')}</div>
        {([['brightness', 0, 200, 100, 'editor.filterBrightness'], ['contrast', 0, 200, 100, 'editor.filterContrast'], ['saturation', 0, 200, 100, 'editor.filterSaturation'], ['grayscale', 0, 100, 0, 'editor.filterGrayscale'], ['blur', 0, 20, 0, 'editor.filterBlur']] as const).map(([key, min, max, base, label]) => {
          const value = extra.filters?.[key] ?? base;
          return <label key={key} className="block text-xs text-stone-600 dark:text-stone-300">{t(label)} <span className="font-mono">{value}{key === 'blur' ? 'px' : '%'}</span><input aria-label={t(label)} type="range" min={min} max={max} value={value} onChange={(e) => { const next = Number(e.target.value); const filters = { ...extra.filters, [key]: next === base ? undefined : next }; if (Object.values(filters).every((item) => item === undefined)) updateExtra({ filters: undefined }); else updateExtra({ filters }); }} className="w-full accent-amber-600" /></label>;
        })}
        <button type="button" onClick={() => updateExtra({ filters: undefined })} className="text-xs text-cyan-700">{t('editor.filtersReset')}</button>
      </div>}
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
        <>
        <div data-testid="sidebar-element-typography" className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">{t('editor.elementTypography')}</label>
          <label className="block text-xs text-stone-500 dark:text-stone-400">{t('editor.font')}<select data-testid="sidebar-typography-font" aria-label={t('editor.font')} value={currentTextStyle.font ?? ''} onChange={(e) => void handleFontChange((e.target.value || undefined) as FontId | undefined)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs dark:bg-stone-900">
            <option value="">{t('editor.inheritTypography')}</option>
            {Object.values(FONT_REGISTRY).map((font) => <option key={font.id} value={font.id}>{font.family}</option>)}
          </select></label>
          <label className="block text-xs text-stone-500 dark:text-stone-400">{t('editor.fontWeight')}<select data-testid="sidebar-typography-weight" aria-label={t('editor.fontWeight')} value={currentTextStyle.weight ?? ''} onChange={(e) => handleTextStyleChange({ weight: e.target.value ? Number(e.target.value) as 400 | 500 | 600 | 700 : undefined })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs dark:bg-stone-900">
            <option value="">{t('editor.inheritTypography')}</option>
            {activeFontDefinition.weights.filter((weight) => currentTextStyle.font || weight !== 600).map((weight) => <option key={weight} value={weight}>{weight}</option>)}
          </select></label>
          <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300"><input data-testid="sidebar-typography-italic" type="checkbox" checked={currentTextStyle.italic ?? false} disabled={!activeFontDefinition.styles.includes('italic')} onChange={(e) => handleTextStyleChange({ font: currentTextStyle.font ?? inheritedFontId, italic: e.target.checked })} />{t('editor.italic')}{!activeFontDefinition.styles.includes('italic') && <span className="text-stone-400">{t('editor.italicUnavailable')}</span>}</label>
          {([['size', 'editor.fontSize', 8, 240], ['letterSpacing', 'editor.letterSpacing', -2, 20], ['lineHeight', 'editor.lineHeight', 0.8, 3]] as const).map(([key, labelKey, min, max]) => <label key={key} className="block text-xs text-stone-500 dark:text-stone-400">{t(labelKey)}<input data-testid={`sidebar-typography-${key}`} type="number" min={min} max={max} step={key === 'size' ? 1 : 0.1} value={currentTextStyle[key] ?? ''} placeholder={t('editor.inheritTypography')} onChange={(e) => handleTextStyleChange({ [key]: e.target.value === '' ? undefined : Number(e.target.value) } as Partial<TextStyleOverride>)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 font-mono text-xs dark:bg-stone-900" /></label>)}
          <label className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">{t('editor.textColor')}<input data-testid="sidebar-typography-color" type="color" aria-label={t('editor.textColor')} value={currentTextStyle.color?.startsWith('#') ? currentTextStyle.color : '#000000'} onChange={(e) => handleTextStyleChange({ color: e.target.value })} /></label>
          <button type="button" data-testid="sidebar-typography-reset" onClick={() => handleTextStyleChange({ font: undefined, size: undefined, weight: undefined, italic: undefined, letterSpacing: undefined, lineHeight: undefined, color: undefined })} className="text-xs text-cyan-700 dark:text-cyan-300">{t('editor.resetTypography')}</button>
        </div>
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
        </>
      )}

      </fieldset>

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
