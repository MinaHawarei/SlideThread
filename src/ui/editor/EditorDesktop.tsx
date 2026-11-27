import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { handleExportProject } from '../../core/projectIO';
import { undo, redo, useHistoryStore } from '../../store/history';
import { SizeWarningModal } from '../common/SizeWarningModal';
import { ChangeFormatDialog } from './ChangeFormatDialog';
import { SlideRail } from './SlideRail';
import { MainCanvas } from './MainCanvas';
import { Inspector, type InspectorTab } from './Inspector';
import { FORMAT_REGISTRY, type FormatId } from '../../core/formats';
import { StorageQuotaBanner } from '../common/StorageQuotaBanner';
import { ShortcutsOverlay } from '../common/ShortcutsOverlay';
import { OnboardingModal } from '../common/OnboardingModal';
import { APP_NAME } from '../../config/site';
import { LogoMark } from '../brand/LogoMark';
import { BrandIcon, BulbIcon, DownloadIcon, KeyboardIcon, LayoutIcon, PageIcon, PenIcon, PencilIcon, RedoIcon, ShapesIcon, SlidesIcon, TemplateIcon, UndoIcon, UploadIcon } from '../common/icons';

export interface EditorDesktopProps {
  onHome?: () => void;
  onOpenExport?: () => void;
}

export const EditorDesktop: React.FC<EditorDesktopProps> = ({
  onHome,
  onOpenExport,
}) => {
  const { t } = useT();
  const penMode = useSelectionStore((state) => state.penMode);
  const setPenMode = useSelectionStore((state) => state.setPenMode);
  const project = useProjectStore((state) => state.project);
  const updateProjectMeta = useProjectStore((state) => state.updateProjectMeta);
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);

  const [activeTab, setActiveTab] = useState<InspectorTab>('slide');
  const [isSlideRailVisible, setIsSlideRailVisible] = useState(true);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [sizeWarning, setSizeWarning] = useState<{
    isOpen: boolean;
    sizeMB: string;
    proceed: () => void;
  }>({
    isOpen: false,
    sizeMB: '0',
    proceed: () => { },
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
      className="h-screen w-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans select-none"
    >
      <StorageQuotaBanner />

      {/* Editor Top Navigation Bar (Atelier Aesthetic) */}
      <header className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Home & Project Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="editor-home-btn"
            onClick={onHome}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('editor.returnHome')}
            title={t('editor.returnHome')}
          >
            <LogoMark size={28} />
            <span className="font-serif font-bold text-sm hidden sm:inline-block text-stone-900 dark:text-white">
              {APP_NAME}
            </span>
          </button>

          <span className="text-stone-300 dark:text-stone-700">/</span>

          {/* Editable Project Title */}
          <input
            data-testid="editor-project-title"
            type="text"
            value={project.title}
            onChange={handleTitleChange}
            placeholder="Untitled Presentation"
            className="font-semibold text-sm py-1 px-2.5 rounded-lg border border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 bg-transparent focus:bg-white dark:focus:bg-stone-800 focus:outline-none transition-colors"
          />

          {/* Platform / Content Type Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 uppercase font-mono text-[10px]">
              {project.platform}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 capitalize text-[10px]">
              {project.contentType}
            </span>
            <button
              type="button"
              data-testid="editor-change-format-btn"
              onClick={() => setIsFormatDialogOpen(true)}
              className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 hover:text-amber-600 text-[10px] font-mono font-medium transition-colors cursor-pointer"
              title={t('editor.changeFormat')}
            >
              <span className="inline-flex items-center gap-1">{FORMAT_REGISTRY[project.formatId as FormatId]?.label || project.formatId} <PencilIcon size={11} /></span>
            </button>
          </div>
        </div>

        {/* Center: History Quick Actions (Undo / Redo) */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            type="button"
            data-testid="editor-undo-btn"
            disabled={!canUndo}
            onClick={() => undo()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={`${t('editor.undo')} (Ctrl+Z)`}
            aria-label={t('editor.undo')}
          >
            <UndoIcon size={16} />
          </button>
          <button
            type="button"
            data-testid="editor-redo-btn"
            disabled={!canRedo}
            onClick={() => redo()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={`${t('editor.redo')} (Ctrl+Shift+Z)`}
            aria-label={t('editor.redo')}
          >
            <RedoIcon size={16} />
          </button>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="editor-shortcuts-btn"
            onClick={() => setIsShortcutsOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm"
            title={t('shortcuts.title')}
            aria-label={t('shortcuts.title')}
          >
            <KeyboardIcon size={16} />
          </button>

          <button
            type="button"
            data-testid="editor-onboarding-btn"
            onClick={() => setIsOnboardingOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm"
            title={t('onboarding.step1Title')}
            aria-label={t('onboarding.step1Title')}
          >
            <BulbIcon size={16} />
          </button>

          <button
            type="button"
            data-testid="editor-export-json-btn"
            onClick={handleExportJson}
            className="py-1.5 px-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs transition-colors flex items-center gap-1.5"
            title={t('io.exportJson')}
          >
            <PageIcon size={16} />
            <span>{t('io.exportJson')}</span>
          </button>

          <button
            type="button"
            data-testid="editor-export-btn"
            onClick={onOpenExport}
            className="py-1.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <DownloadIcon size={16} />
            <span>{t('editor.export')}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace: Tool Rail | Slide Rail | Canvas | Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Rail (Studio Capabilities) */}
        <aside
          data-testid="left-tool-rail"
          aria-label="Studio tools"
          className="w-14 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center py-3 gap-2 shrink-0 z-10"
        >
          <button
            type="button"
            data-testid="rail-tool-template"
            onClick={() => {
              setActiveTab('design');
            }}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${activeTab === 'design'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            title="Templates & Layouts"
            aria-label="Templates & Layouts"
          >
            <TemplateIcon size={16} />
            <span className="text-[9px] scale-90">{t('rail.tmpl')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-elements"
            onClick={() => {
              setActiveTab('assets');
            }}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${activeTab === 'assets'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            title="Shapes & Stickers"
            aria-label="Shapes & Stickers"
          >
            <ShapesIcon size={16} />
            <span className="text-[9px] scale-90">{t('rail.shapes')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-pen"
            aria-pressed={penMode === 'pencil'}
            onClick={() => setPenMode(penMode === 'pencil' ? 'off' : 'pencil')}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${penMode === 'pencil'
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-400/60'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            title="Pencil: draw a freehand shape on the slide (Esc to stop)"
            aria-label="Pencil tool"
          >
            <PencilIcon size={16} />
            <span className="text-[9px] scale-90">Pencil</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-bezier"
            aria-pressed={penMode === 'pen'}
            onClick={() => setPenMode(penMode === 'pen' ? 'off' : 'pen')}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${penMode === 'pen'
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-400/60'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            title="Pen: click to place points, drag to curve, click the first point to close, Enter to finish"
            aria-label="Pen tool"
          >
            <PenIcon size={16} />
            <span className="text-[9px] scale-90">Pen</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-text"
            onClick={() => {
              setActiveTab('slide');
            }}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${activeTab === 'slide'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            title="Slide Text & Fields"
            aria-label="Slide Text & Fields"
          >
            <span className="text-sm font-bold">T</span>
            <span className="text-[9px] scale-90">{t('rail.text')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-uploads"
            onClick={() => {
              setActiveTab('assets');
            }}
            className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Upload Assets"
            aria-label="Upload Assets"
          >
            <UploadIcon size={16} />
            <span className="text-[9px] scale-90">{t('rail.upload')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-brand"
            onClick={() => {
              setActiveTab('brand');
            }}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${activeTab === 'brand'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            title="Brand Kit"
            aria-label="Brand Kit"
          >
            <BrandIcon size={16} />
            <span className="text-[9px] scale-90">{t('rail.brand')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-layout"
            onClick={() => {
              setActiveTab('design');
            }}
            className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Layout Design"
            aria-label="Layout Design"
          >
            <LayoutIcon size={16} />
            <span className="text-[9px] scale-90">{t('rail.layout')}</span>
          </button>

          <div className="mt-auto pt-2 border-t border-stone-200 dark:border-stone-800 w-full flex justify-center">
            <button
              type="button"
              data-testid="rail-tool-slides"
              onClick={() => setIsSlideRailVisible((prev) => !prev)}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${isSlideRailVisible
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-stone-400 hover:text-stone-600'
                }`}
              title="Toggle Slide Rail"
              aria-label="Toggle Slide Rail"
            >
              <SlidesIcon size={16} />
              <span className="text-[9px] scale-90">Rail</span>
            </button>
          </div>
        </aside>

        {/* Slide Rail */}
        {isSlideRailVisible && <SlideRail />}

        {/* Main Canvas */}
        <MainCanvas />

        {/* Inspector Panel */}
        <Inspector
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Format Changer Dialog */}
      <ChangeFormatDialog
        isOpen={isFormatDialogOpen}
        onClose={() => setIsFormatDialogOpen(false)}
      />

      {/* Shortcuts Overlay */}
      <ShortcutsOverlay
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => setIsOnboardingOpen(false)}
      />

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
