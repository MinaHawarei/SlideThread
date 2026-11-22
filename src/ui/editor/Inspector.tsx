import React, { useState } from 'react';
import { useT } from '../../i18n';
import { SlideInspector } from './SlideInspector';
import { DesignInspector } from './DesignInspector';
import { BrandInspector } from './BrandInspector';

export type InspectorTab = 'slide' | 'design' | 'brand';

export interface InspectorProps {
  className?: string;
  defaultTab?: InspectorTab;
}

export const Inspector: React.FC<InspectorProps> = ({
  className = '',
  defaultTab = 'slide',
}) => {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<InspectorTab>(defaultTab);

  return (
    <aside
      data-testid="inspector"
      aria-label="Slide properties inspector"
      className={`w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 ${className}`}
    >
      {/* Three Tabs: Slide / Design / Brand per Spec §10.2 */}
      <div
        data-testid="inspector-tabs"
        role="tablist"
        className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'slide'}
          data-testid="tab-slide"
          onClick={() => setActiveTab('slide')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'slide'
              ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('editor.tabSlide')}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'design'}
          data-testid="tab-design"
          onClick={() => setActiveTab('design')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'design'
              ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('editor.tabDesign')}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'brand'}
          data-testid="tab-brand"
          onClick={() => setActiveTab('brand')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'brand'
              ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('editor.tabBrand')}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'slide' && <SlideInspector />}
        {activeTab === 'design' && <DesignInspector />}
        {activeTab === 'brand' && <BrandInspector />}
      </div>
    </aside>
  );
};
