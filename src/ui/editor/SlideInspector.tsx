import React from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import type { SlideType } from '../../core/schema';
import { richTextFieldsToPlainText } from '../../core/schema';
import { hasManualTextSize } from '../../core/richText';
import { ShapesPicker } from './ShapesPicker';
import { IconsPicker } from './IconsPicker';

const ALL_SLIDE_TYPES: SlideType[] = [
  'cover',
  'explain',
  'rule',
  'compare',
  'code',
  'stat',
  'quote',
  'image',
  'cta',
];

export const SlideInspector: React.FC = () => {
  const { t } = useT();
  const activeSlide = useActiveSlide();
  const updateSlideFields = useProjectStore((state) => state.updateSlideFields);
  const setSlideType = useProjectStore((state) => state.setSlideType);
  const toggleHideSignature = useProjectStore((state) => state.toggleHideSignature);
  const splitSlide = useProjectStore((state) => state.splitSlide);

  if (!activeSlide) {
    return (
      <div className="p-4 text-xs text-slate-500">
        No slide selected.
      </div>
    );
  }

  const fields = richTextFieldsToPlainText(activeSlide.fields || {});

  const handleFieldChange = (key: string, value: string) => {
    updateSlideFields(activeSlide.id, { [key]: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value as SlideType;
    setSlideType(activeSlide.id, nextType);
  };

  // Check for overflow warning on slides (Spec §5.3)
  const isExplain = activeSlide.type === 'explain';
  const rawBody = activeSlide.fields.body;
  const hasManual = hasManualTextSize(rawBody) || hasManualTextSize(activeSlide.fields.title);
  const bodyText = fields.body || '';
  const bodyLines = bodyText.split('\n').filter((l) => l.trim().length > 0);
  const hasMultipleBlocks = Boolean(rawBody && rawBody.blocks && rawBody.blocks.length >= 2);
  const isOverflowing =
    (bodyLines.length >= 4 || bodyText.length > 240 || (hasManual && bodyText.length > 120)) &&
    (isExplain || hasMultipleBlocks);

  return (
    <div data-testid="slide-inspector" className="p-4 space-y-6">
      {/* Slide Type Selector */}
      <div className="space-y-1.5">
        <label
          htmlFor="slide-type-select"
          className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Slide Type
        </label>
        <select
          id="slide-type-select"
          data-testid="slide-type-select"
          value={activeSlide.type}
          onChange={handleTypeChange}
          className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        >
          {ALL_SLIDE_TYPES.map((type) => {
            const key = `slideType.${type}` as const;
            return (
              <option key={type} value={type}>
                {t(key)}
              </option>
            );
          })}
        </select>
      </div>

      {/* Overflow Warning & Split Action (Spec §5.3 & §10.2) */}
      {isOverflowing && (
        <div
          data-testid="overflow-warning-box"
          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 space-y-2"
        >
          <div className="flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <p className="text-xs font-medium leading-relaxed">
              {t('editor.overflowWarning')}
            </p>
          </div>
          <button
            type="button"
            data-testid="split-slide-btn"
            onClick={() => splitSlide(activeSlide.id)}
            className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            {t('editor.splitAction')}
          </button>
        </div>
      )}

      {/* Dynamic Slide Fields */}
      <div className="space-y-4">
        {/* COVER SLIDE */}
        {activeSlide.type === 'cover' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.tag')}
              </label>
              <input
                data-testid="field-tag"
                type="text"
                value={fields.tag || ''}
                onChange={(e) => handleFieldChange('tag', e.target.value)}
                placeholder="ARCHITECTURE"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.title')}
              </label>
              <textarea
                data-testid="field-title"
                rows={3}
                value={fields.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Main hook title..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.subtitle')}
              </label>
              <textarea
                data-testid="field-sub"
                rows={2}
                value={fields.sub || ''}
                onChange={(e) => handleFieldChange('sub', e.target.value)}
                placeholder="Subtitle explaining the value..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.ruleLine')}
              </label>
              <input
                data-testid="field-rule"
                type="text"
                value={fields.rule || ''}
                onChange={(e) => handleFieldChange('rule', e.target.value)}
                placeholder="npx create-slidethread@latest"
                className="w-full py-2 px-3 rounded-lg font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* EXPLAIN SLIDE */}
        {activeSlide.type === 'explain' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.title')}
              </label>
              <input
                data-testid="field-title"
                type="text"
                value={fields.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Key Concept or Header"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t('field.body')}
                </label>
              </div>
              <textarea
                data-testid="field-body"
                rows={6}
                value={fields.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                placeholder="- Point 1: Key concept&#10;- Point 2: Second concept&#10;- Point 3: Takeaway"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                {t('field.bodyHint')}
              </p>
            </div>
          </>
        )}

        {/* RULE SLIDE (IF/THEN) */}
        {activeSlide.type === 'rule' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.title')}
              </label>
              <input
                data-testid="field-title"
                type="text"
                value={fields.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Core Rule"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.cond')}
              </label>
              <textarea
                data-testid="field-cond"
                rows={2}
                value={fields.cond || ''}
                onChange={(e) => handleFieldChange('cond', e.target.value)}
                placeholder="When you encounter this challenge..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.res')}
              </label>
              <textarea
                data-testid="field-res"
                rows={2}
                value={fields.res || ''}
                onChange={(e) => handleFieldChange('res', e.target.value)}
                placeholder="Apply this concrete pattern..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.note')}
              </label>
              <input
                data-testid="field-note"
                type="text"
                value={fields.note || ''}
                onChange={(e) => handleFieldChange('note', e.target.value)}
                placeholder="Why this rule works..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* COMPARE SLIDE */}
        {activeSlide.type === 'compare' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.title')}
              </label>
              <input
                data-testid="field-title"
                type="text"
                value={fields.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Do This, Not That"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-red-500">
                  {t('field.leftLabel')}
                </label>
                <input
                  data-testid="field-l1"
                  type="text"
                  value={fields.l1 || ''}
                  onChange={(e) => handleFieldChange('l1', e.target.value)}
                  placeholder="Don't"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-emerald-500">
                  {t('field.rightLabel')}
                </label>
                <input
                  data-testid="field-l2"
                  type="text"
                  value={fields.l2 || ''}
                  onChange={(e) => handleFieldChange('l2', e.target.value)}
                  placeholder="Do"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-red-500">
                {t('field.leftText')}
              </label>
              <textarea
                data-testid="field-t1"
                rows={2}
                value={fields.t1 || ''}
                onChange={(e) => handleFieldChange('t1', e.target.value)}
                placeholder="Bad / anti-pattern practice..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-emerald-500">
                {t('field.rightText')}
              </label>
              <textarea
                data-testid="field-t2"
                rows={2}
                value={fields.t2 || ''}
                onChange={(e) => handleFieldChange('t2', e.target.value)}
                placeholder="Recommended solution..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* CODE SLIDE */}
        {activeSlide.type === 'code' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.title')}
              </label>
              <input
                data-testid="field-title"
                type="text"
                value={fields.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Code Snippet Title"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.code')}
              </label>
              <textarea
                data-testid="field-code"
                rows={6}
                value={fields.code || ''}
                onChange={(e) => handleFieldChange('code', e.target.value)}
                placeholder="const app = createApp();"
                className="w-full py-2 px-3 rounded-lg font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.note')}
              </label>
              <input
                data-testid="field-note"
                type="text"
                value={fields.note || ''}
                onChange={(e) => handleFieldChange('note', e.target.value)}
                placeholder="Note about code behavior..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* STAT SLIDE */}
        {activeSlide.type === 'stat' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.statValue')}
              </label>
              <input
                data-testid="field-value"
                type="text"
                value={fields.value || ''}
                onChange={(e) => handleFieldChange('value', e.target.value)}
                placeholder="100% or 0ms"
                className="w-full py-2 px-3 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.statLabel')}
              </label>
              <textarea
                data-testid="field-label"
                rows={2}
                value={fields.label || ''}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                placeholder="Client-side processing speed"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.note')}
              </label>
              <input
                data-testid="field-note"
                type="text"
                value={fields.note || ''}
                onChange={(e) => handleFieldChange('note', e.target.value)}
                placeholder="Context or measurement source"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* QUOTE SLIDE */}
        {activeSlide.type === 'quote' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.quoteText')}
              </label>
              <textarea
                data-testid="field-text"
                rows={4}
                value={fields.text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                placeholder="The best quote to inspire..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.quoteAuthor')}
              </label>
              <input
                data-testid="field-author"
                type="text"
                value={fields.author || ''}
                onChange={(e) => handleFieldChange('author', e.target.value)}
                placeholder="Author Name"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* IMAGE SLIDE */}
        {activeSlide.type === 'image' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('field.caption')}
            </label>
            <input
              data-testid="field-caption"
              type="text"
              value={fields.caption || ''}
              onChange={(e) => handleFieldChange('caption', e.target.value)}
              placeholder="Descriptive image caption..."
              className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {/* CTA SLIDE */}
        {activeSlide.type === 'cta' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.title')}
              </label>
              <input
                data-testid="field-title"
                type="text"
                value={fields.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Liked this presentation?"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.body')}
              </label>
              <textarea
                data-testid="field-body"
                rows={3}
                value={fields.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                placeholder="Follow for weekly deep-dives..."
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('field.action')}
              </label>
              <input
                data-testid="field-action"
                type="text"
                value={fields.action || ''}
                onChange={(e) => handleFieldChange('action', e.target.value)}
                placeholder="Follow & Share"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}
      </div>

      {/* Shapes, Lines & Arrows Pack (R6-2) */}
      <ShapesPicker />

      {/* Presentation Icons Pack (R6-3) */}
      <IconsPicker />

      {/* Slide-Level Signature Visibility Override */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
          <input
            data-testid="hide-signature-checkbox"
            type="checkbox"
            checked={Boolean(activeSlide.hideSignature)}
            onChange={() => toggleHideSignature(activeSlide.id)}
            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
          />
          <span>Hide signature bar on this slide</span>
        </label>
      </div>
    </div>
  );
};
