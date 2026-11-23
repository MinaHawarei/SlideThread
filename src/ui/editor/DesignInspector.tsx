import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore } from '../../store/projectStore';
import { getAllTemplates, getTemplate } from '../../templates';
import { ChangeFormatDialog } from './ChangeFormatDialog';
import type { TemplateId, ThemeMode, TextDir } from '../../core/schema';

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
  const [isChangeFormatOpen, setIsChangeFormatOpen] = useState(false);

  const allTemplates = getAllTemplates();

  const handleTemplateChange = (templateId: TemplateId) => {
    updateProjectMeta({ templateId });
  };

  const handleColorChange = (primaryColor: string) => {
    updateProjectMeta({ primaryColor });
  };

  const handleThemeChange = (theme: ThemeMode) => {
    updateProjectMeta({ theme });
  };

  const handleDirChange = (textDir: TextDir) => {
    updateProjectMeta({ textDir });
  };

  return (
    <div data-testid="design-inspector" className="p-4 space-y-6">
      {/* Template Picker */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('design.template')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {allTemplates.map((tmpl) => {
            const isSelected = getTemplate(project.templateId).id === tmpl.id;
            const nameKey = `wizard.template.${tmpl.id}` as const;

            return (
              <button
                key={tmpl.id}
                type="button"
                data-testid={`design-template-${tmpl.id}`}
                onClick={() => handleTemplateChange(tmpl.id)}
                className={`py-2 px-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {t(nameKey as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
      </div>

      {/* Free Color Picker & Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('design.primaryColor')}
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase font-semibold text-slate-600 dark:text-slate-300">
              {project.primaryColor}
            </span>
            <input
              data-testid="design-color-picker"
              type="color"
              value={project.primaryColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
              title="Pick any hex color"
            />
          </div>
        </div>

        {/* Color Chips */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => {
            const isSelected = project.primaryColor.toLowerCase() === c.hex.toLowerCase();
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

      <ChangeFormatDialog
        isOpen={isChangeFormatOpen}
        onClose={() => setIsChangeFormatOpen(false)}
      />
    </div>
  );
};
