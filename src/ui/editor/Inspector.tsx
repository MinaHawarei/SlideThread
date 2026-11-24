import React, { useState } from 'react';
import { useT } from '../../i18n';
import { SlideInspector } from './SlideInspector';
import { DesignInspector } from './DesignInspector';
import { BrandInspector } from './BrandInspector';
import { AssetsPanel } from './AssetsPanel';

export type InspectorTab = 'slide' | 'assets' | 'design' | 'brand';

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
      {/* Four Tabs: Slide / Assets / Design / Brand */}
      <div
        data-testid="inspector-tabs"
        role="tablist"
        aria-label="Inspector tabs"
        className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1"
      >
        <button
          type="button"
          role="tab"
          id="tab-slide"
          aria-controls="panel-slide"
          aria-selected={activeTab === 'slide'}
          data-testid="tab-slide"
          onClick={() => setActiveTab('slide')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 ${
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
          id="tab-assets"
          aria-controls="panel-assets"
          aria-selected={activeTab === 'assets'}
          data-testid="tab-assets"
          onClick={() => setActiveTab('assets')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 ${
            activeTab === 'assets'
              ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('editor.tabAssets')}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-design"
          aria-controls="panel-design"
          aria-selected={activeTab === 'design'}
          data-testid="tab-design"
          onClick={() => setActiveTab('design')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 ${
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
          id="tab-brand"
          aria-controls="panel-brand"
          aria-selected={activeTab === 'brand'}
          data-testid="tab-brand"
          onClick={() => setActiveTab('brand')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 ${
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
        {activeTab === 'slide' && (
          <div role="tabpanel" id="panel-slide" aria-labelledby="tab-slide">
            <SlideInspector />
          </div>
        )}
        {activeTab === 'assets' && (
          <div role="tabpanel" id="panel-assets" aria-labelledby="tab-assets">
            <AssetsPanel />
          </div>
        )}
        {activeTab === 'design' && (
          <div role="tabpanel" id="panel-design" aria-labelledby="tab-design">
            <DesignInspector />
          </div>
        )}
        {activeTab === 'brand' && (
          <div role="tabpanel" id="panel-brand" aria-labelledby="tab-brand">
            <BrandInspector />
          </div>
        )}
      </div>
    </aside>
  );
};

