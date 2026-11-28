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
import { EditorDock, type DockRequest } from './EditorDock';
import { AssetsPanel } from './AssetsPanel';
import { ExportMenu } from './ExportMenu';
import { FORMAT_REGISTRY, type FormatId } from '../../core/formats';
import { StorageQuotaBanner } from '../common/StorageQuotaBanner';
import { ShortcutsOverlay } from '../common/ShortcutsOverlay';
import { OnboardingModal } from '../common/OnboardingModal';
import { APP_NAME } from '../../config/site';
import { LogoMark } from '../brand/LogoMark';
import { BulbIcon, ChevronLeftIcon, ImageIcon, KeyboardIcon, LayoutIcon, PencilIcon, PenIcon, ShapesIcon, SlidesIcon, TemplateIcon, TextIcon, UndoIcon, RedoIcon } from '../common/icons';

export interface EditorDesktopProps {
  onHome?: () => void;
  onOpenExport?: (format?: 'png' | 'zip' | 'pdf') => void;
}

type FlyoutId = 'elements' | 'media' | 'draw' | null;

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

  const [isSlideRailVisible, setIsSlideRailVisible] = useState(true);
  const [flyout, setFlyout] = useState<FlyoutId>(null);
  const [dockRequest, setDockRequest] = useState<DockRequest | null>(null);
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

  const isSingleSlide = project.slides.length <= 1 || project.contentType === 'post';

  const requestDock = (card: DockRequest['card'], tab: DockRequest['tab']) => {
    setFlyout(null);
    setDockRequest((prev) => ({ card, tab, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const toggleFlyout = (id: Exclude<FlyoutId, null>) => {
    setFlyout((prev) => (prev === id ? null : id));
  };

  const railBtnClass = (active: boolean) =>
    `w-12 rounded-xl flex flex-col items-center justify-center gap-1 py-2 text-[9px] font-semibold transition-colors border ${
      active
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40'
        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border-transparent'
    }`;

  const flyoutTitle =
    flyout === 'elements' ? t('rail.elements') : flyout === 'media' ? t('rail.media') : t('rail.draw');

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

        {/* Right: Quick Actions + single Export menu */}
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

          <ExportMenu
            onOpenExport={onOpenExport}
            onExportJson={handleExportJson}
            isSingleSlide={isSingleSlide}
          />
        </div>
      </header>

      {/* Main Studio Workspace: Slide Strip | Tool Rail | Canvas (+ flyout) | Dock */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Slides strip (far left) */}
        <SlideRail
          collapsed={!isSlideRailVisible}
          onToggleCollapsed={() => setIsSlideRailVisible((prev) => !prev)}
        />

        {/* Left Tool Rail (Studio Capabilities) */}
        <aside
          data-testid="left-tool-rail"
          aria-label="Studio tools"
          className="w-16 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center py-3 gap-1.5 shrink-0 z-10"
        >
          <button
            type="button"
            data-testid="rail-tool-template"
            onClick={() => requestDock('designBrand', 'design')}
            className={railBtnClass(false)}
            title={t('rail.templates')}
            aria-label={t('rail.templates')}
          >
            <TemplateIcon size={19} />
            <span>{t('rail.templates')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-elements"
            onClick={() => toggleFlyout('elements')}
            className={railBtnClass(flyout === 'elements')}
            title={t('rail.elements')}
            aria-label={t('rail.elements')}
          >
            <ShapesIcon size={19} />
            <span>{t('rail.elements')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-draw"
            aria-pressed={penMode !== 'off'}
            onClick={() => toggleFlyout('draw')}
            className={railBtnClass(flyout === 'draw' || penMode !== 'off')}
            title={t('rail.draw')}
            aria-label={t('rail.draw')}
          >
            <PencilIcon size={19} />
            <span>{t('rail.draw')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-text"
            onClick={() => requestDock('propsSlide', 'slide')}
            className={railBtnClass(false)}
            title={t('rail.text')}
            aria-label={t('rail.text')}
          >
            <TextIcon size={19} />
            <span>{t('rail.text')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-media"
            onClick={() => toggleFlyout('media')}
            className={railBtnClass(flyout === 'media')}
            title={t('rail.media')}
            aria-label={t('rail.media')}
          >
            <ImageIcon size={19} />
            <span>{t('rail.media')}</span>
          </button>

          <button
            type="button"
            data-testid="rail-tool-layout"
            onClick={() => requestDock('designBrand', 'design')}
            className={railBtnClass(false)}
            title={t('rail.layout')}
            aria-label={t('rail.layout')}
          >
            <LayoutIcon size={19} />
            <span>{t('rail.layout')}</span>
          </button>

          <div className="mt-auto pt-2 border-t border-stone-200 dark:border-stone-800 w-full flex justify-center">
            <button
              type="button"
              data-testid="rail-tool-slides"
              onClick={() => setIsSlideRailVisible((prev) => !prev)}
              className={`w-12 rounded-xl flex flex-col items-center justify-center gap-1 py-2 text-[9px] font-semibold transition-colors ${
                isSlideRailVisible
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
              title={t('editor.mobileTabSlides')}
              aria-label={t('editor.mobileTabSlides')}
            >
              <SlidesIcon size={19} />
              <span>{t('editor.mobileTabSlides')}</span>
            </button>
          </div>
        </aside>

        {/* Canvas column with the tool flyout overlaying its left edge */}
        <div className="flex-1 relative min-w-0 flex">
          <MainCanvas />

          {flyout && (
            <div
              data-testid="rail-flyout"
              className="absolute left-0 top-0 bottom-0 w-72 z-20 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-700 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
                <span className="font-serif font-bold text-[15px]">{flyoutTitle}</span>
                <button
                  type="button"
                  data-testid="rail-flyout-close"
                  onClick={() => setFlyout(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label={t('editor.closeInspector')}
                >
                  <ChevronLeftIcon size={14} />
                </button>
              </div>

              {flyout === 'draw' ? (
                <div className="p-3 flex flex-col gap-2">
                  <button
                    type="button"
                    data-testid="rail-tool-pen"
                    aria-pressed={penMode === 'pencil'}
                    onClick={() => {
                      setPenMode(penMode === 'pencil' ? 'off' : 'pencil');
                      setFlyout(null);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-[13px] font-semibold transition-colors ${
                      penMode === 'pencil'
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-stone-200 dark:border-stone-700 hover:border-amber-500/50 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    <PencilIcon size={17} />
                    <span>
                      Pencil
                      <span className="block text-[11px] font-normal text-stone-400 dark:text-stone-500">
                        {t('rail.pencilHint')}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="rail-tool-bezier"
                    aria-pressed={penMode === 'pen'}
                    onClick={() => {
                      setPenMode(penMode === 'pen' ? 'off' : 'pen');
                      setFlyout(null);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-[13px] font-semibold transition-colors ${
                      penMode === 'pen'
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-stone-200 dark:border-stone-700 hover:border-amber-500/50 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    <PenIcon size={17} />
                    <span>
                      Pen
                      <span className="block text-[11px] font-normal text-stone-400 dark:text-stone-500">
                        {t('rail.penHint')}
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <AssetsPanel
                    initialCategory={flyout === 'elements' ? 'shapes' : 'all'}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right dock: card-separated, collapsible panels */}
        <EditorDock request={dockRequest} />
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
