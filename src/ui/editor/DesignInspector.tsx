import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getTemplate } from '../../templates';
import { currentAccent, recolorTemplateSnapshot } from '../../templates/accent';
import { ChangeFormatDialog } from './ChangeFormatDialog';
import { SaveDesignDialog } from './SaveDesignDialog';
import type { ThemeMode, TextDir, Anchor } from '../../core/schema';

const PRESET_COLORS = [
  { name: 'Cyan (Network)', hex: '#35D0E6' },
  { name: 'Teal Blue', hex: '#0B7FA6' },
  { name: 'Indigo Violet', hex: '#6366F1' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Deep Ink', hex: '#000000' },
];

export const DesignInspector: React.FC = () => {
  const { t } = useT();
  const project = useProjectStore((state) => state.project);
  const updateProjectMeta = useProjectStore((state) => state.updateProjectMeta);
  const updateCounterConfig = useProjectStore((state) => state.updateCounterConfig);
  const settings = useSettingsStore((state) => state.settings);
  const [isChangeFormatOpen, setIsChangeFormatOpen] = useState(false);
  const [isSaveDesignOpen, setIsSaveDesignOpen] = useState(false);

  let starterCounterStyles: ('number' | 'bar' | 'dots')[] | undefined;
  if (!project.templateSnapshot?.counter?.styles) {
    try {
      starterCounterStyles = getTemplate(project.templateId).counter?.styles;
    } catch {
      // Unknown or user-imported template without snapshot.
    }
  }
  const allowedStyles = project.templateSnapshot?.counter?.styles ?? starterCounterStyles ?? ['number', 'bar', 'dots'];
  const counter = project.counter ?? {
    show: true,
    anchor: 'br',
    style: 'number',
    format: 'nn/nn',
    hideOnFirst: false,
    hideOnLast: false,
  };
  const signatureAnchor = project.signature?.anchor || settings.defaultSignature?.anchor || 'br';
  const isSignatureVisible = (settings.showSignature !== false) && (project.signature?.show !== false);
  const hasCollision = counter.show && isSignatureVisible && counter.anchor === signatureAnchor;

  const handleColorChange = async (primaryColor: string) => {
    try {
      const templateSnapshot = await recolorTemplateSnapshot(project.templateId, project.templateSnapshot, primaryColor);
      updateProjectMeta({ primaryColor, templateSnapshot });
    } catch {
      updateProjectMeta({ primaryColor });
    }
  };
  const accent = currentAccent(project.templateSnapshot, project.theme, project.primaryColor);

  const handleThemeChange = (theme: ThemeMode) => {
    updateProjectMeta({ theme });
  };

  const handleDirChange = (textDir: TextDir) => {
    updateProjectMeta({ textDir });
  };

  return (
    <div data-testid="design-inspector" className="p-4 space-y-6">
      {/* Free Color Picker & Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('design.primaryColor')}
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase font-semibold text-slate-600 dark:text-slate-300">
              {accent}
            </span>
            <input
              data-testid="design-color-picker"
              type="color"
              value={/^#[\da-f]{6}$/i.test(accent) ? accent : project.primaryColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
              title="Pick any hex color"
            />
          </div>
        </div>

        {/* Color Chips */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => {
            const isSelected = accent.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                data-testid={`design-preset-${c.hex.replace('#', '')}`}
                onClick={() => handleColorChange(c.hex)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  isSelected ? 'border-white ring-2 ring-cyan-500 scale-110' : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            );
          })}
        </div>
      </div>

      {/* Theme Mode Toggle (Dark / Light) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('design.themeMode')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="design-theme-dark"
            onClick={() => handleThemeChange('dark')}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              project.theme === 'dark'
                ? 'border-cyan-500 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>🌙</span>
            <span>{t('design.theme.dark')}</span>
          </button>
          <button
            type="button"
            data-testid="design-theme-light"
            onClick={() => handleThemeChange('light')}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              project.theme === 'light'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>☀️</span>
            <span>{t('design.theme.light')}</span>
          </button>
        </div>
      </div>

      {/* Text Direction Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('design.textDir')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['auto', 'ltr', 'rtl'] as TextDir[]).map((dir) => {
            const isSelected = project.textDir === dir;
            const dirKey = `design.textDir.${dir}` as const;

            return (
              <button
                key={dir}
                type="button"
                data-testid={`design-dir-${dir}`}
                onClick={() => handleDirChange(dir)}
                className={`py-2 px-1 rounded-xl border text-xs font-semibold uppercase transition-all min-h-[44px] flex items-center justify-center ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
                title={t(dirKey)}
              >
                {dir}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slide Counter System (§5.4) */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label htmlFor="counter-toggle-input" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer">
            {t('counter.title')}
          </label>
          <input
            id="counter-toggle-input"
            type="checkbox"
            data-testid="counter-toggle"
            checked={counter.show}
            onChange={(e) => updateCounterConfig({ show: e.target.checked })}
            className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
        </div>

        {counter.show && (
          <div className="space-y-4 rounded-xl bg-slate-50 dark:bg-slate-850 p-3 border border-slate-200 dark:border-slate-750">
            {/* Anchor Selector (6 physical anchors) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {t('counter.anchor')}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['tl', 'tc', 'tr', 'bl', 'bc', 'br'] as Anchor[]).map((a) => {
                  const isSelected = counter.anchor === a;
                  const labelKey = `counter.anchor.${a}` as const;
                  return (
                    <button
                      key={a}
                      type="button"
                      data-testid={`counter-anchor-${a}`}
                      onClick={() => updateCounterConfig({ anchor: a })}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t(labelKey as Parameters<typeof t>[0])}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collision warning banner */}
            {hasCollision && (
              <div
                data-testid="counter-collision-warning"
                className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1"
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <span>⚠️</span>
                  <span>{t('counter.collisionWarning')}</span>
                </div>
              </div>
            )}

            {/* Style Selector (filtered by template) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {t('counter.style')}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['number', 'bar', 'dots'] as const)
                  .filter((style) => allowedStyles.includes(style))
                  .map((style) => {
                    const isSelected = counter.style === style;
                    const styleKey = `counter.style.${style}` as const;
                    return (
                      <button
                        key={style}
                        type="button"
                        data-testid={`counter-style-${style}`}
                        onClick={() => updateCounterConfig({ style })}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t(styleKey as Parameters<typeof t>[0])}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Format Selector (only when style is number) */}
            {counter.style === 'number' && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {t('counter.format')}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['nn/nn', 'n', 'n/nn'] as const).map((fmt) => {
                    const isSelected = counter.format === fmt;
                    const fmtKey = `counter.format.${fmt === 'nn/nn' ? 'nn_nn' : fmt === 'n/nn' ? 'n_nn' : 'n'}` as const;
                    return (
                      <button
                        key={fmt}
                        type="button"
                        data-testid={`counter-format-${fmt}`}
                        onClick={() => updateCounterConfig({ format: fmt })}
                        className={`py-1.5 px-1 rounded-lg border text-[11px] font-mono font-semibold transition-all ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={t(fmtKey as Parameters<typeof t>[0])}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hide on First / Last Checkboxes */}
            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  data-testid="counter-hide-first"
                  checked={counter.hideOnFirst}
                  onChange={(e) => updateCounterConfig({ hideOnFirst: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <span>{t('counter.hideOnFirst')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  data-testid="counter-hide-last"
                  checked={counter.hideOnLast}
                  onChange={(e) => updateCounterConfig({ hideOnLast: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <span>{t('counter.hideOnLast')}</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Change Format Dialog Trigger */}
      <div className="pt-2">
        <button
          type="button"
          data-testid="design-change-format-btn"
          onClick={() => setIsChangeFormatOpen(true)}
          className="w-full min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-cyan-500 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <span>📐</span>
          <span>{t('design.changeFormat')}</span>
        </button>
      </div>

      <div>
        <button
          type="button"
          data-testid="design-save-template-btn"
          onClick={() => setIsSaveDesignOpen(true)}
          className="w-full min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-cyan-500 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <span>💾</span>
          <span>Save design as template</span>
        </button>
      </div>
      {isSaveDesignOpen && <SaveDesignDialog onClose={() => setIsSaveDesignOpen(false)} />}

      <ChangeFormatDialog
        isOpen={isChangeFormatOpen}
        onClose={() => setIsChangeFormatOpen(false)}
      />
    </div>
  );
};
