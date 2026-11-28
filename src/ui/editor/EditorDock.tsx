import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { SlideInspector } from './SlideInspector';
import { DesignInspector } from './DesignInspector';
import { BrandInspector } from './BrandInspector';
import { LayersPanel } from './LayersPanel';
import { ElementPropertiesPanel } from './ElementPropertiesPanel';
import { CollapseChevron } from '../common/icons';

/** Cards and sub-tabs of the desktop inspector dock. */
export type DockCardId = 'propsSlide' | 'designBrand' | 'layers';
export interface DockRequest {
  card: 'propsSlide' | 'designBrand';
  tab: 'slide' | 'design';
  nonce: number;
}

export interface EditorDockProps {
  /** Rail tools steer the dock through this one-shot request. */
  request: DockRequest | null;
  className?: string;
}

interface DockCardProps {
  title: string;
  hint?: string;
  testId: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const DockCard: React.FC<DockCardProps> = ({ title, hint, testId, collapsed, onToggle, children }) => (
  <section
    data-testid={testId}
    className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 overflow-hidden shrink-0"
  >
    <button
      type="button"
      data-testid={`${testId}-head`}
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="w-full flex items-center gap-2 px-3.5 py-3 text-left hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
    >
      <CollapseChevron
        direction={collapsed ? 'right' : 'down'}
        size={13}
        className="text-stone-400 shrink-0"
      />
      <span className="flex-1 text-[11px] font-bold uppercase tracking-[1.6px] text-stone-800 dark:text-stone-100 whitespace-nowrap">
        {title}
      </span>
      {collapsed && hint && (
        <span className="text-[11px] text-stone-400 dark:text-stone-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[45%] text-right">
          {hint}
        </span>
      )}
    </button>
    {!collapsed && <div className="pb-1">{children}</div>}
  </section>
);

const tabButtonClass = (active: boolean) =>
  `flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
    active
      ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100'
      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
  }`;

export const EditorDock: React.FC<EditorDockProps> = ({ request, className = '' }) => {
  const { t } = useT();
  const selectedElementId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();

  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Record<DockCardId, boolean>>({
    propsSlide: false,
    designBrand: false,
    layers: false,
  });
  const [psTab, setPsTab] = useState<'properties' | 'slide'>('slide');
  const [dbTab, setDbTab] = useState<'design' | 'brand'>('design');

  // Selecting an element jumps the first card to its Properties tab, like the old inspector
  // swapping to the element panel.
  const prevSelectedRef = useRef<string | undefined>(selectedElementId);
  useEffect(() => {
    if (!prevSelectedRef.current && selectedElementId) {
      setPsTab('properties');
      setCollapsedCards((prev) => ({ ...prev, propsSlide: false }));
      setDockCollapsed(false);
    }
    prevSelectedRef.current = selectedElementId;
  }, [selectedElementId]);

  // One-shot rail requests: expand the dock + target card and pick the tab.
  useEffect(() => {
    if (!request) return;
    setDockCollapsed(false);
    setCollapsedCards((prev) => ({ ...prev, [request.card]: false }));
    if (request.card === 'propsSlide') setPsTab(request.tab === 'slide' ? 'slide' : 'properties');
    if (request.card === 'designBrand') setDbTab(request.tab === 'design' ? 'design' : 'brand');
  }, [request]);

  const toggleCard = (card: DockCardId) =>
    setCollapsedCards((prev) => ({ ...prev, [card]: !prev[card] }));

  const slideTypeLabel = activeSlide ? t(`slideType.${activeSlide.type}`) : '';
  const designHint = `${project.theme === 'dark' ? t('design.theme.dark') : t('design.theme.light')} · ${project.primaryColor}`;

  if (dockCollapsed) {
    return (
      <aside
        data-testid="inspector"
        aria-label={t('dock.inspector')}
        className={`w-12 border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center py-3 gap-3 shrink-0 ${className}`}
      >
        <button
          type="button"
          data-testid="dock-expand-btn"
          onClick={() => setDockCollapsed(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={t('dock.expand')}
          aria-label={t('dock.expand')}
        >
          <CollapseChevron direction="left" size={14} />
        </button>
        <span
          className="text-[11px] font-bold uppercase tracking-[2px] text-stone-400 dark:text-stone-500"
          style={{ writingMode: 'vertical-rl' }}
        >
          {t('dock.inspector')}
        </span>
      </aside>
    );
  }

  return (
    <aside
      data-testid="inspector"
      aria-label={t('dock.inspector')}
      className={`w-80 border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col h-full shrink-0 relative ${className}`}
    >
      {/* Whole-dock collapse handle straddling the left edge */}
      <button
        type="button"
        data-testid="dock-collapse-btn"
        onClick={() => setDockCollapsed(true)}
        className="absolute -left-3 top-3 z-20 w-6 h-6 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 flex items-center justify-center hover:text-stone-900 dark:hover:text-stone-100 shadow-sm transition-colors"
        title={t('dock.collapse')}
        aria-label={t('dock.collapse')}
      >
        <CollapseChevron direction="right" size={13} />
      </button>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Card 1: Properties | Slide */}
        <DockCard
          title={t('dock.propsSlide')}
          hint={selectedElementId ? selectedElementId : slideTypeLabel}
          testId="dock-card-props"
          collapsed={collapsedCards.propsSlide}
          onToggle={() => toggleCard('propsSlide')}
        >
          <div className="px-3 pt-1 pb-2 flex gap-1.5" role="tablist" aria-label={t('dock.propsSlide')}>
            <button
              type="button"
              role="tab"
              aria-selected={psTab === 'properties'}
              data-testid="tab-properties"
              onClick={() => setPsTab('properties')}
              className={tabButtonClass(psTab === 'properties')}
            >
              {t('dock.properties')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={psTab === 'slide'}
              data-testid="tab-slide"
              onClick={() => setPsTab('slide')}
              className={tabButtonClass(psTab === 'slide')}
            >
              {t('editor.tabSlide')}
            </button>
          </div>
          {psTab === 'properties' ? (
            selectedElementId ? (
              <ElementPropertiesPanel onClose={() => selectElement(undefined)} />
            ) : (
              <p
                data-testid="properties-empty-hint"
                className="px-4 py-6 text-center text-xs text-stone-400 dark:text-stone-500"
              >
                {t('dock.selectElementHint')}
              </p>
            )
          ) : (
            <SlideInspector />
          )}
        </DockCard>

        {/* Card 2: Design | Brand */}
        <DockCard
          title={t('dock.designBrand')}
          hint={designHint}
          testId="dock-card-design"
          collapsed={collapsedCards.designBrand}
          onToggle={() => toggleCard('designBrand')}
        >
          <div className="px-3 pt-1 pb-2 flex gap-1.5" role="tablist" aria-label={t('dock.designBrand')}>
            <button
              type="button"
              role="tab"
              aria-selected={dbTab === 'design'}
              data-testid="tab-design"
              onClick={() => setDbTab('design')}
              className={tabButtonClass(dbTab === 'design')}
            >
              {t('editor.tabDesign')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dbTab === 'brand'}
              data-testid="tab-brand"
              onClick={() => setDbTab('brand')}
              className={tabButtonClass(dbTab === 'brand')}
            >
              {t('editor.tabBrand')}
            </button>
          </div>
          {dbTab === 'design' ? <DesignInspector /> : <BrandInspector />}
        </DockCard>

        {/* Card 3: Layers */}
        <DockCard
          title={t('editor.tabLayers')}
          hint={slideTypeLabel}
          testId="dock-card-layers"
          collapsed={collapsedCards.layers}
          onToggle={() => toggleCard('layers')}
        >
          <LayersPanel />
        </DockCard>
      </div>
    </aside>
  );
};

export default EditorDock;
