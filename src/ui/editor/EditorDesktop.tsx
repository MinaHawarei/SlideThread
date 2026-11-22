import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore } from '../../store/projectStore';
import { handleExportProject } from '../../core/projectIO';
import { SizeWarningModal } from '../common/SizeWarningModal';
import { SlideRail } from './SlideRail';
import { MainCanvas } from './MainCanvas';
import { Inspector } from './Inspector';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { StorageQuotaBanner } from '../common/StorageQuotaBanner';
import { APP_NAME } from '../../config/site';

export interface EditorDesktopProps {
  onHome?: () => void;
  onOpenExport?: () => void;
}

export const EditorDesktop: React.FC<EditorDesktopProps> = ({
  onHome,
  onOpenExport,
}) => {
  const { t } = useT();
  const project = useProjectStore((state) => state.project);
  const updateProjectMeta = useProjectStore((state) => state.updateProjectMeta);

  const [sizeWarning, setSizeWarning] = useState<{
    isOpen: boolean;
    sizeMB: string;
    proceed: () => void;
  }>({
    isOpen: false,
    sizeMB: '0',
    proceed: () => {},
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProjectMeta({ title: e.target.value });
  };

  const handleExportJson = async () => {
    await handleExportProject(project, (sizeMB, proceed) => {
      setSizeWarning({
        isOpen: true,
        sizeMB,
        proceed: () => {
          setSizeWarning((prev) => ({ ...prev, isOpen: false }));
          proceed();
        },
      });
    });
  };

  return (
    <div
      data-testid="editor-desktop"
      className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden"
    >
      <StorageQuotaBanner />
      {/* Editor Top Navigation Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Home & Project Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="editor-home-btn"
            onClick={onHome}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Return to Start Screen"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              S
            </div>
            <span className="font-bold text-sm hidden sm:inline-block">
              {APP_NAME}
            </span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          {/* Editable Project Title */}
          <input
            data-testid="editor-project-title"
            type="text"
            value={project.title}
            onChange={handleTitleChange}
            placeholder="Untitled Presentation"
            className="font-semibold text-sm py-1 px-2.5 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-cyan-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
          />

          {/* Platform / Content Type Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase font-mono text-[10px]">
              {project.platform}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 capitalize text-[10px]">
              {project.contentType}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
              {project.formatId}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <button
            type="button"
            data-testid="editor-export-json-btn"
            onClick={handleExportJson}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors flex items-center gap-1.5"
            title={t('io.exportJson')}
          >
            <span>📄</span>
            <span>{t('io.exportJson')}</span>
          </button>

          <button
            type="button"
            data-testid="editor-export-btn"
            onClick={onOpenExport}
            className="py-1.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>↓</span>
            <span>{t('editor.export')}</span>
          </button>
        </div>
      </header>

      {/* 3-Column Workspace (Rail | Canvas | Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        <SlideRail />
        <MainCanvas />
        <Inspector />
      </div>

      {/* Size Warning Modal */}
      <SizeWarningModal
        isOpen={sizeWarning.isOpen}
        sizeMB={sizeWarning.sizeMB}
        onConfirm={sizeWarning.proceed}
        onCancel={() => setSizeWarning((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
