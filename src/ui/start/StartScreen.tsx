import React, { useState, useRef } from 'react';
import { useT } from '../../i18n';
import { Footer } from '../common/Footer';
import { APP_NAME } from '../../config/site';
import { useProjectStore } from '../../store/projectStore';
import { useRecentStore } from '../../store/recentStore';
import { getDemoProjectEn, getDemoProjectAr } from '../../store/seedProjects';
import { FORMAT_REGISTRY, type FormatId } from '../../core/formats';
import type { Project, PlatformId } from '../../core/schema';
import { SizeWarningModal } from '../common/SizeWarningModal';
import { HeroCarousel } from './HeroCarousel';
import { EmptyIllustration } from '../common/EmptyIllustration';
import { LogoMark } from '../brand/LogoMark';
import { MobileNavDrawer } from '../common/MobileNavDrawer';

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
    proceed: () => { },
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

  // Quick start by platform tile
  const handleQuickPlatform = (platform: PlatformId, formatId: FormatId, contentType: 'carousel' | 'post' | 'story') => {
    const newProj = createProject({
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
      formatId,
      orientation: formatId === 'r_16_9' ? 'landscape' : 'portrait',
      platform,
      contentType,
    });

    saveProject(newProj);
    if (onOpenProject) {
      onOpenProject(newProj);
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
    <div
      data-testid="start-screen"
      className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-white"
    >
      {/* Top Header */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <div>
              <h1
                data-testid="start-app-title"
                className="text-xl font-bold tracking-tight text-stone-900 dark:text-white font-serif"
              >
                {APP_NAME}
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
                {t('app.tagline')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => handleNavigate('/gallery')}
              className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium px-3 py-1.5 rounded-lg border border-stone-300/50 dark:border-stone-700/50 transition-colors"
            >
              {t('nav.gallery')}
            </button>
            <button
              onClick={() => handleNavigate('/settings')}
              className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium px-3 py-1.5 rounded-lg border border-stone-300/50 dark:border-stone-700/50 transition-colors"
            >
              {t('nav.settings')}
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={() => handleNavigate('/spike')}
                className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium px-3 py-1.5 rounded-lg border border-stone-300/50 dark:border-stone-700/50 transition-colors"
              >
                Spike
              </button>
            )}
          </div>

          {/* Mobile Side Drawer Navigation */}
          <MobileNavDrawer currentPath="/" onNavigate={handleNavigate} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 space-y-12">
        {/* Active Project Resume Banner */}
        {hasActiveProject && (
          <section
            data-testid="resume-banner"
            className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 dark:border-amber-500/20 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {t('start.inProgress')}
              </span>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {t('start.continueWorking', { title: currentProject.title || 'Untitled' })}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('start.slidesCount', { count: currentProject.slides.length })} • {FORMAT_REGISTRY[currentProject.formatId as FormatId]?.label || currentProject.formatId} • {currentProject.templateId}
              </p>
            </div>
            <button
              data-testid="resume-project-btn"
              onClick={handleResumeCurrent}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm shadow-sm transition-all focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              {t('start.resumeProject')}
            </button>
          </section>
        )}

        {/* Hero Section with Interactive Swipeable Demo Carousel (R8-1) */}
        <section
          data-testid="hero-section"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 pb-6"
        >
          <div className="lg:col-span-7 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              SlideThread
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 leading-tight">
              {t('start.heroTitle')}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
              {t('start.heroSubtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                data-testid="hero-start-btn"
                onClick={handleStartWizard}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <span>✨</span>
                <span>{t('start.heroStartCreating')}</span>
              </button>
              <button
                data-testid="hero-gallery-btn"
                onClick={() => handleNavigate('/gallery')}
                className="px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-sm transition-colors"
              >
                {t('start.heroExploreTemplates')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <HeroCarousel onOpenProject={onOpenProject} />
          </div>
        </section>

        {/* Quick Start by Platform Tiles (R8-1) */}
        <section data-testid="quick-start-platforms" className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-white">
              {t('start.quickStartTitle')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('start.quickStartSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. LinkedIn Carousel */}
            <button
              type="button"
              data-testid="quick-platform-linkedin"
              onClick={() => handleQuickPlatform('linkedin', 'r_4_5', 'carousel')}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl font-bold">
                  💼
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('start.platform.linkedinCarousel')}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug">
                  {t('start.platform.linkedinDesc')}
                </p>
              </div>
              <span className="text-[11px] font-mono text-stone-400 mt-4 block">4:5 • 1080×1350</span>
            </button>

            {/* 2. Instagram Carousel */}
            <button
              type="button"
              data-testid="quick-platform-instagram"
              onClick={() => handleQuickPlatform('instagram', 'r_4_5', 'carousel')}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center text-xl font-bold">
                  📸
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('start.platform.instagramCarousel')}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug">
                  {t('start.platform.instagramDesc')}
                </p>
              </div>
              <span className="text-[11px] font-mono text-stone-400 mt-4 block">4:5 / 1:1 Sequence</span>
            </button>

            {/* 3. Story */}
            <button
              type="button"
              data-testid="quick-platform-story"
              onClick={() => handleQuickPlatform('instagram', 'r_9_16', 'story')}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-xl font-bold">
                  📱
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('start.platform.storyTitle')}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug">
                  {t('start.platform.storyDesc')}
                </p>
              </div>
              <span className="text-[11px] font-mono text-stone-400 mt-4 block">9:16 • 1080×1920</span>
            </button>

            {/* 4. Single Post */}
            <button
              type="button"
              data-testid="quick-platform-post"
              onClick={() => handleQuickPlatform('custom', 'r_1_1', 'post')}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold">
                  ⚡
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('start.platform.postTitle')}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug">
                  {t('start.platform.postDesc')}
                </p>
              </div>
              <span className="text-[11px] font-mono text-stone-400 mt-4 block">1:1 • 1080×1080</span>
            </button>
          </div>
        </section>

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
              className="group p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                    ✨
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Recommended
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('start.guidedTitle')}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
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
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
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
              className="group p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between"
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
                <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t('start.directTitle')}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
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
              className="group p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-violet-500/50 dark:hover:border-violet-500/50 transition-all cursor-pointer flex flex-col justify-between"
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
                <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {t('start.importTitle')}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
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
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
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
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-white">
              {t('start.demoTitle')}
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {t('start.seedExamples')}
            </span>
          </div>

          <div data-testid="demo-projects-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* English Demo */}
            <div
              data-testid="demo-en-card"
              className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                    English
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    9 Slides • 4:5 Portrait
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                  Modern Frontend Architecture
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {t('start.demoEn')} — Demonstrates all 9 slide types (Cover, Explain, Rule, Compare, Code, Stat, Quote, Image, CTA) in Weave template.
                </p>
              </div>
              <button
                data-testid="demo-en-btn"
                onClick={() => handleOpenDemo('en')}
                className="w-full py-2 px-4 rounded-xl border border-amber-500/50 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-xs transition-colors"
              >
                {t('start.openProject')}
              </button>
            </div>

            {/* Arabic Demo */}
            <div
              data-testid="demo-ar-card"
              className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    العربية
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    ٩ شرائح • 4:5 طولي
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white font-arabic">
                  أنظمة التصميم والواجهات الحديثة
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {t('start.demoAr')} — نموذج كامل باللغة العربية يوضح النصوص ثنائية الاتجاه، المقارنات، الكود المضمن، والإحصائيات في قالب نسيج.
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
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-white">
              {t('start.recentTitle')}
            </h2>
            {recentList.length > 0 && (
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {recentList.length} / 10
              </span>
            )}
          </div>

          {recentList.length === 0 ? (
            <div
              data-testid="recent-empty"
              className="p-10 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-center space-y-3"
            >
              <EmptyIllustration variant="empty" className="w-20 h-20 text-stone-400 dark:text-stone-600" />
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400 max-w-sm">
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
                  className="group p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow hover:border-stone-300 dark:hover:border-stone-700 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        {item.platform} • {item.contentType}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {item.formatId}
                      </span>
                    </div>
                    <h4 className="font-semibold text-stone-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {item.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t('start.slidesCount', { count: item.slideCount })}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                    <button
                      data-testid={`recent-open-${item.id}`}
                      onClick={() => handleOpenRecent(item.id)}
                      className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      {t('start.openProject')}
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        data-testid={`recent-export-${item.id}`}
                        onClick={(e) => handleExportRecent(item.id, e)}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
                        title={t('io.exportJson')}
                      >
                        {t('io.exportJson')}
                      </button>
                      <button
                        data-testid={`recent-dup-${item.id}`}
                        onClick={(e) => handleDuplicateRecent(item.id, e)}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
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

      {/* Footer */}
      <Footer />

      {/* Direct Dimensions Modal */}
      {isDirectModalOpen && (
        <div
          data-testid="direct-dimensions-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('start.directModalTitle')}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                  {t('start.directModalTitle')}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {t('start.directModalDesc')}
                </p>
              </div>
              <button
                data-testid="close-direct-modal"
                onClick={() => setIsDirectModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                data-testid="direct-format-r_4_5"
                onClick={() => handleSelectFormat('r_4_5')}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 text-left transition-all group"
              >
                <span className="block font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600">
                  4:5 Portrait
                </span>
                <span className="text-xs text-stone-500">1080 × 1350 px</span>
              </button>

              <button
                data-testid="direct-format-r_1_1"
                onClick={() => handleSelectFormat('r_1_1')}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 text-left transition-all group"
              >
                <span className="block font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600">
                  1:1 Square
                </span>
                <span className="text-xs text-stone-500">1080 × 1080 px</span>
              </button>

              <button
                data-testid="direct-format-r_16_9"
                onClick={() => handleSelectFormat('r_16_9')}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 text-left transition-all group"
              >
                <span className="block font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600">
                  16:9 Landscape
                </span>
                <span className="text-xs text-stone-500">1920 × 1080 px</span>
              </button>

              <button
                data-testid="direct-format-r_9_16"
                onClick={() => handleSelectFormat('r_9_16')}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 text-left transition-all group"
              >
                <span className="block font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600">
                  9:16 Story
                </span>
                <span className="text-xs text-stone-500">1080 × 1920 px</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size warning modal */}
      <SizeWarningModal
        isOpen={sizeWarning.isOpen}
        sizeMB={sizeWarning.sizeMB}
        onConfirm={sizeWarning.proceed}
        onCancel={() => setSizeWarning((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
