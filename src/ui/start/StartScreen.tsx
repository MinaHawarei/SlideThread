import React, { useState, useRef } from 'react';
import { useT } from '../../i18n';
import { Footer } from '../common/Footer';
import { useProjectStore } from '../../store/projectStore';
import { useRecentStore } from '../../store/recentStore';
import { openCreateDialog } from '../../store/createDialogStore';
import { getDemoProjectEn, getDemoProjectAr } from '../../store/seedProjects';
import { FORMAT_REGISTRY, type FormatId } from '../../core/formats';
import type { Project, PlatformId } from '../../core/schema';
import { SizeWarningModal } from '../common/SizeWarningModal';
import { HomeHero } from './HomeHero';
import { EmptyIllustration } from '../common/EmptyIllustration';
import '../common/editorial.css';
import { AppNav } from '../common/AppNav';

export interface StartScreenProps {
  onOpenProject?: (project?: Project) => void;
  onNavigate?: (path: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onOpenProject,
  onNavigate,
}) => {
  const { t } = useT();
  const currentProject = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);

  const recents = useRecentStore((state) => state.recents);
  const saveProject = useRecentStore((state) => state.saveProject);
  const getProject = useRecentStore((state) => state.getProject);
  const duplicateProject = useRecentStore((state) => state.duplicateProject);
  const deleteRecent = useRecentStore((state) => state.deleteRecent);

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

  // Every way of starting a project opens the same create dialog.
  const handleQuickPlatform = (platform: PlatformId, formatId: FormatId, contentType: 'carousel' | 'post' | 'story') => {
    openCreateDialog({ platform, formatId, contentType });
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

  const formats: Array<{ id: string; title: string; sub: string; w: number; h: number; run: () => void }> = [
    { id: 'linkedin', title: t('start.platform.linkedinCarousel'), sub: '4:5 · 1080×1350', w: 36, h: 45, run: () => handleQuickPlatform('linkedin', 'r_4_5', 'carousel') },
    { id: 'instagram', title: t('start.platform.instagramCarousel'), sub: '4:5 / 1:1', w: 36, h: 45, run: () => handleQuickPlatform('instagram', 'r_4_5', 'carousel') },
    { id: 'story', title: t('home.fmtStory'), sub: '9:16 · 1080×1920', w: 28, h: 50, run: () => handleQuickPlatform('instagram', 'r_9_16', 'story') },
    { id: 'post', title: t('start.platform.postTitle'), sub: '1:1', w: 44, h: 44, run: () => handleQuickPlatform('custom', 'r_1_1', 'post') },
  ];

  return (
    <div data-testid="start-screen" className="ed-page flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <div>
        <AppNav current="/" onNavigate={handleNavigate} />

        {hasActiveProject && (
          <section data-testid="resume-banner" className="hm-resume">
            <div>
              {t('home.continue')} <b>{currentProject.title || 'Untitled'}</b> · {t('start.slidesCount', { count: currentProject.slides.length })} · {FORMAT_REGISTRY[currentProject.formatId as FormatId]?.label || currentProject.formatId}
            </div>
            <button data-testid="resume-project-btn" onClick={handleResumeCurrent} aria-label={t('start.resumeProject')}>
              {t('home.resume')} →
            </button>
          </section>
        )}

        <main className="overflow-x-clip">
          <HomeHero onNavigate={handleNavigate} />

          <div className="hm-ticker" aria-hidden="true">
            <span>{t('home.ticker1')}</span>
            <span>{t('home.ticker2')}</span>
            <span>{t('home.ticker3')}</span>
            <span>{t('home.ticker4')}</span>
          </div>

          <section className="hm-sec">
            <h2>{t('home.stepsTitle')}</h2>
            <p>{t('home.stepsSubtitle')}</p>
            <div className="hm-steps">
              {[t('home.step1'), t('home.step2'), t('home.step3')].map((label, index) => (
                <div key={label} className="hm-step">
                  <b>{`0${index + 1}`}</b>
                  <div>{label}</div>
                </div>
              ))}
            </div>
          </section>

          <section data-testid="quick-start-platforms" className="hm-sec">
            <h2>{t('home.formatsTitle')}</h2>
            <div className="hm-plat">
              {formats.map((f) => (
                <button key={f.id} type="button" data-testid={`quick-platform-${f.id}`} onClick={f.run} className="hm-pl">
                  <i style={{ width: f.w, height: f.h }} />
                  {f.title}
                  <small>{f.sub}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="hm-sec">
            <h2>{t('home.projectsTitle')}</h2>
            <p>{t('home.projectsSubtitle')}</p>

            {importError && (
              <div data-testid="import-error-msg" role="alert" className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                <span>{t('start.importError', { error: importError })}</span>
                <button onClick={() => setImportError(null)} className="text-xs font-semibold uppercase hover:underline">
                  {t('common.close')}
                </button>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div data-testid="start-wizard-card" onClick={() => openCreateDialog()} className="hm-card-box cursor-pointer">
                <span className="hm-tag">{t('start.guidedTitle')}</span>
                <p>{t('start.guidedDesc')}</p>
                <button
                  data-testid="start-wizard-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateDialog();
                  }}
                  className="hm-btn self-start"
                >
                  {t('start.guidedTitle')} →
                </button>
              </div>

              <div data-testid="start-import-card" onClick={handleTriggerImport} className="hm-card-box cursor-pointer">
                <span className="hm-tag">JSON</span>
                <p>{t('start.importDesc')}</p>
                <button
                  data-testid="start-import-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerImport();
                  }}
                  className="hm-btn ghost self-start"
                >
                  {t('start.importTitle')}
                </button>
                <input ref={fileInputRef} type="file" data-testid="start-file-input" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            <h3 className="ed-serif mb-3 mt-10 text-2xl">{t('start.demoTitle')}</h3>
            <div data-testid="demo-projects-container" className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div data-testid="demo-en-card" className="hm-card-box">
                <span className="hm-tag">English · 9 · 4:5</span>
                <h3>Modern Frontend Architecture</h3>
                <p>{t('start.demoEn')}</p>
                <button data-testid="demo-en-btn" onClick={() => handleOpenDemo('en')} className="hm-btn ghost self-start">
                  {t('start.openProject')}
                </button>
              </div>
              <div data-testid="demo-ar-card" className="hm-card-box">
                <span className="hm-tag">العربية · ٩ · 4:5</span>
                <h3 className="font-arabic">أنظمة التصميم والواجهات الحديثة</h3>
                <p>{t('start.demoAr')}</p>
                <button data-testid="demo-ar-btn" onClick={() => handleOpenDemo('ar')} className="hm-btn ghost self-start">
                  {t('start.openProject')}
                </button>
              </div>
            </div>

            <div className="mb-3 mt-10 flex items-baseline justify-between">
              <h3 className="ed-serif text-2xl">{t('start.recentTitle')}</h3>
              {recentList.length > 0 && <span className="text-xs" style={{ color: 'var(--ed-mut)' }}>{recentList.length} / 10</span>}
            </div>
            {recentList.length === 0 ? (
              <div data-testid="recent-empty" className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: 'var(--ed-card2)', color: 'var(--ed-mut)' }}>
                <EmptyIllustration variant="empty" className="h-20 w-20 opacity-60" />
                <p className="max-w-sm text-sm">{t('start.recentEmpty')}</p>
              </div>
            ) : (
              <div data-testid="recent-list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentList.map((item) => (
                  <div key={item.id} data-testid={`recent-item-${item.id}`} onClick={() => handleOpenRecent(item.id)} className="hm-card-box cursor-pointer">
                    <div className="flex items-center justify-between gap-2">
                      <span className="hm-tag">{item.platform} · {item.contentType}</span>
                      <span className="text-xs" style={{ color: 'var(--ed-mut)' }}>{FORMAT_REGISTRY[item.formatId as FormatId]?.label ?? item.formatId}{item.templateId ? ` • ${item.templateId}` : ''}</span>
                    </div>
                    <h3 className="truncate">{item.title || 'Untitled'}</h3>
                    <p>{t('start.slidesCount', { count: item.slideCount })}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--ed-line)' }}>
                      <button data-testid={`recent-open-${item.id}`} onClick={() => handleOpenRecent(item.id)} className="text-xs font-semibold hover:underline" style={{ color: 'var(--ed-acc)' }}>
                        {t('start.openProject')}
                      </button>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ed-mut)' }}>
                        <button data-testid={`recent-export-${item.id}`} onClick={(e) => handleExportRecent(item.id, e)} className="hover:underline" title={t('io.exportJson')}>
                          {t('io.exportJson')}
                        </button>
                        <button data-testid={`recent-dup-${item.id}`} onClick={(e) => handleDuplicateRecent(item.id, e)} className="hover:underline" title={t('start.duplicateProject')}>
                          {t('start.duplicateProject')}
                        </button>
                        <button data-testid={`recent-del-${item.id}`} onClick={(e) => handleDeleteRecent(item.id, e)} className="text-red-500 hover:underline" title={t('start.deleteProject')}>
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
      </div>

      <div className="mt-16">
        <Footer />
      </div>

      <SizeWarningModal
        isOpen={sizeWarning.isOpen}
        sizeMB={sizeWarning.sizeMB}
        onConfirm={sizeWarning.proceed}
        onCancel={() => setSizeWarning((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
