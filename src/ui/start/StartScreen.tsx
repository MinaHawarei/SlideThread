import React, { useState, useRef } from 'react';
import { useT } from '../../i18n';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Footer } from '../common/Footer';
import { APP_NAME } from '../../config/site';
import { useProjectStore } from '../../store/projectStore';
import { useRecentStore } from '../../store/recentStore';
import { getDemoProjectEn, getDemoProjectAr } from '../../store/seedProjects';
import type { FormatId } from '../../core/formats';
import type { Project } from '../../core/schema';
import { SizeWarningModal } from '../common/SizeWarningModal';

export interface StartScreenProps {
  onStartWizard?: () => void;
  onOpenProject?: (project?: Project) => void;
  onNavigate?: (path: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartWizard,
  onOpenProject,
  onNavigate,
}) => {
  const { t } = useT();
  const currentProject = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);
  const createProject = useProjectStore((state) => state.createProject);

  const recents = useRecentStore((state) => state.recents);
  const saveProject = useRecentStore((state) => state.saveProject);
  const getProject = useRecentStore((state) => state.getProject);
  const duplicateProject = useRecentStore((state) => state.duplicateProject);
  const deleteRecent = useRecentStore((state) => state.deleteRecent);

  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sizeWarning, setSizeWarning] = useState<{
    isOpen: boolean;
    sizeMB: string;
    proceed: () => void;
  }>({
    isOpen: false,
    sizeMB: '0',
    proceed: () => {},
  });

  // Resume active project
  const handleResumeCurrent = () => {
    if (onOpenProject) {
      onOpenProject(currentProject);
    }
  };

  // Open guided wizard
  const handleStartWizard = () => {
    if (onStartWizard) {
      onStartWizard();
    }
  };

  // Direct dimension selection
  const handleSelectFormat = (formatId: FormatId) => {
    const newProj = createProject({
      title: 'Untitled Presentation',
      formatId,
      orientation: formatId === 'r_16_9' ? 'landscape' : 'portrait',
      platform: 'custom',
      contentType: formatId === 'r_9_16' ? 'story' : 'carousel',
    });

    saveProject(newProj);
    setIsDirectModalOpen(false);
    if (onOpenProject) {
      onOpenProject(newProj);
    }
  };

  // Open a recent project
  const handleOpenRecent = (id: string) => {
    const proj = getProject(id);
    if (proj) {
      setProject(proj);
      if (onOpenProject) {
        onOpenProject(proj);
      }
    }
  };

  // Duplicate a recent project
  const handleDuplicateRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateProject(id);
  };

  // Delete a recent project
  const handleDeleteRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('start.confirmDelete'))) {
      deleteRecent(id);
    }
  };

  // Demo projects
  const handleOpenDemo = (lang: 'en' | 'ar') => {
    const base = lang === 'en' ? getDemoProjectEn() : getDemoProjectAr();
    const demoProj: Project = {
      ...base,
      id: `demo_${lang}_${Date.now()}`,
      updatedAt: Date.now(),
    };
    saveProject(demoProj);
    setProject(demoProj);
    if (onOpenProject) {
      onOpenProject(demoProj);
    }
  };

  // Trigger file dialog
  const handleTriggerImport = () => {
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Export a recent project JSON
  const handleExportRecent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const proj = getProject(id);
    if (!proj) return;
    const { handleExportProject } = await import('../../core/projectIO');
    await handleExportProject(proj, (sizeMB, proceed) => {
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

  // File import handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const text = await file.text();
      const { importProjectFromJSON } = await import('../../core/projectIO');
      const imported = await importProjectFromJSON(text);
      saveProject(imported);
      setProject(imported);

      if (onOpenProject) {
        onOpenProject(imported);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(msg);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const hasActiveProject = currentProject && currentProject.slides && currentProject.slides.length > 0;
  const recentList = (recents || []).slice(0, 10);

  return (
    <div data-testid="start-screen" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                {APP_NAME}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('app.tagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate('/gallery')}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-300/50 dark:border-slate-700/50 transition-colors"
            >
              {t('nav.gallery')}
            </button>
            <button
              onClick={() => handleNavigate('/settings')}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-300/50 dark:border-slate-700/50 transition-colors"
            >
              {t('nav.settings')}
            </button>
            {import.meta.env.DEV && <button
              onClick={() => handleNavigate('/spike')}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-300/50 dark:border-slate-700/50 transition-colors"
            >Spike</button>}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 space-y-12">
        {/* Active Project Resume Banner */}
        {hasActiveProject && (
          <section
            data-testid="resume-banner"
            className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent border border-cyan-500/30 dark:border-cyan-500/20 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                In Progress
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('start.continueWorking', { title: currentProject.title || 'Untitled' })}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('start.slidesCount', { count: currentProject.slides.length })} • {currentProject.formatId} • {currentProject.templateId}
              </p>
            </div>
            <button
              data-testid="resume-project-btn"
              onClick={handleResumeCurrent}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm shadow-sm transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            >
              {t('start.resumeProject')}
            </button>
          </section>
        )}

        {/* Import Error Message */}
        {importError && (
          <div
            data-testid="import-error-msg"
            role="alert"
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center justify-between gap-4"
          >
            <span>{t('start.importError', { error: importError })}</span>
            <button
              onClick={() => setImportError(null)}
              className="text-xs font-semibold uppercase hover:underline"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        {/* Entry Paths Grid */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Guided Path Card */}
            <div
              data-testid="start-wizard-card"
              onClick={handleStartWizard}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    ✨
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                    Recommended
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {t('start.guidedTitle')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('start.guidedDesc')}
                </p>
              </div>

              <div className="pt-6">
                <button
                  data-testid="start-wizard-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartWizard();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>{t('start.guidedTitle')}</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>

            {/* 2. Direct-Size Path Card */}
            <div
              data-testid="start-direct-card"
              onClick={() => setIsDirectModalOpen(true)}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    📐
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Instant
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t('start.directTitle')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('start.directDesc')}
                </p>
              </div>

              <div className="pt-6">
                <button
                  data-testid="start-direct-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDirectModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>{t('start.directTitle')}</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>

            {/* 3. Import Project Card */}
            <div
              data-testid="start-import-card"
              onClick={handleTriggerImport}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-violet-500/50 dark:hover:border-violet-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    📂
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    JSON
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {t('start.importTitle')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('start.importDesc')}
                </p>
              </div>

              <div className="pt-6">
                <button
                  data-testid="start-import-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerImport();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>{t('start.importTitle')}</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                data-testid="start-file-input"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </section>

        {/* Demo Projects Section (Spec §11) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('start.demoTitle')}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Spec §11 Seed Examples
            </span>
          </div>

          <div data-testid="demo-projects-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* English Demo */}
            <div
              data-testid="demo-en-card"
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                    English
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    9 Slides • 4:5 Portrait
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Modern Frontend Architecture
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('start.demoEn')} — Demonstrates all 9 slide types (Cover, Explain, Rule, Compare, Code, Stat, Quote, Image, CTA) in Network template.
                </p>
              </div>
              <button
                data-testid="demo-en-btn"
                onClick={() => handleOpenDemo('en')}
                className="w-full py-2 px-4 rounded-xl border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium text-xs transition-colors"
              >
                {t('start.openProject')}
              </button>
            </div>

            {/* Arabic Demo */}
            <div
              data-testid="demo-ar-card"
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    العربية
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ٩ شرائح • 4:5 طولي
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-arabic">
                  أنظمة التصميم والواجهات الحديثة
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('start.demoAr')} — نموذج كامل باللغة العربية يوضح النصوص ثنائية الاتجاه، المقارنات، الكود المضمن، والإحصائيات في قالب الشبكة.
                </p>
              </div>
              <button
                data-testid="demo-ar-btn"
                onClick={() => handleOpenDemo('ar')}
                className="w-full py-2 px-4 rounded-xl border border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-xs transition-colors"
              >
                {t('start.openProject')}
              </button>
            </div>
          </div>
        </section>

        {/* Recent Projects Section (Spec §8.2) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('start.recentTitle')}
            </h2>
            {recentList.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {recentList.length} / 10
              </span>
            )}
          </div>

          {recentList.length === 0 ? (
            <div
              data-testid="recent-empty"
              className="p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('start.recentEmpty')}
              </p>
            </div>
          ) : (
            <div data-testid="recent-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentList.map((item) => (
                <div
                  key={item.id}
                  data-testid={`recent-item-${item.id}`}
                  onClick={() => handleOpenRecent(item.id)}
                  className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.platform} • {item.contentType}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.formatId}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {item.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('start.slidesCount', { count: item.slideCount })}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      data-testid={`recent-open-${item.id}`}
                      onClick={() => handleOpenRecent(item.id)}
                      className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      {t('start.openProject')}
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        data-testid={`recent-export-${item.id}`}
                        onClick={(e) => handleExportRecent(item.id, e)}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title={t('io.exportJson')}
                      >
                        {t('io.exportJson')}
                      </button>
                      <button
                        data-testid={`recent-dup-${item.id}`}
                        onClick={(e) => handleDuplicateRecent(item.id, e)}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title={t('start.duplicateProject')}
                      >
                        {t('start.duplicateProject')}
                      </button>
                      <button
                        data-testid={`recent-del-${item.id}`}
                        onClick={(e) => handleDeleteRecent(item.id, e)}
                        className="text-xs text-red-500 hover:text-red-700"
                        title={t('start.deleteProject')}
                      >
                        {t('start.deleteProject')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Direct Dimensions Picker Modal */}
      {isDirectModalOpen && (
        <div
          data-testid="direct-dimensions-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('start.directModalTitle')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('start.directModalDesc')}
                </p>
              </div>
              <button
                data-testid="close-direct-modal"
                onClick={() => setIsDirectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 4:5 Portrait */}
              <button
                data-testid="direct-format-r_4_5"
                onClick={() => handleSelectFormat('r_4_5')}
                className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-15 rounded-lg border-2 border-dashed border-cyan-500/50 flex items-center justify-center text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  4:5
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Portrait (4:5)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    1080 × 1350 px
                  </p>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                    Instagram &amp; LinkedIn Carousel
                  </span>
                </div>
              </button>

              {/* 1:1 Square */}
              <button
                data-testid="direct-format-r_1_1"
                onClick={() => handleSelectFormat('r_1_1')}
                className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-indigo-500/50 flex items-center justify-center text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  1:1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Square (1:1)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    1080 × 1080 px
                  </p>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Universal Post &amp; Carousel
                  </span>
                </div>
              </button>

              {/* 16:9 Landscape */}
              <button
                data-testid="direct-format-r_16_9"
                onClick={() => handleSelectFormat('r_16_9')}
                className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-14 h-9 rounded-lg border-2 border-dashed border-violet-500/50 flex items-center justify-center text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                  16:9
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    Landscape (16:9)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    1920 × 1080 px
                  </p>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                    Presentations &amp; Wide Posts
                  </span>
                </div>
              </button>

              {/* 9:16 Vertical Story */}
              <button
                data-testid="direct-format-r_9_16"
                onClick={() => handleSelectFormat('r_9_16')}
                className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-pink-500 dark:hover:border-pink-500 text-left transition-all flex items-center gap-4 group"
              >
                <div className="w-9 h-16 rounded-lg border-2 border-dashed border-pink-500/50 flex items-center justify-center text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                  9:16
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    Story / Reel (9:16)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    1080 × 1920 px
                  </p>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
                    Stories &amp; Reels Cover
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer (Spec §10.3) */}
      <Footer />

      {/* Project Size Warning Modal */}
      <SizeWarningModal
        isOpen={sizeWarning.isOpen}
        sizeMB={sizeWarning.sizeMB}
        onConfirm={sizeWarning.proceed}
        onCancel={() => setSizeWarning((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
