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
  activeTab?: InspectorTab;
  onTabChange?: (tab: InspectorTab) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  className = '',
  defaultTab = 'slide',
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  const { t } = useT();
  const [internalTab, setInternalTab] = useState<InspectorTab>(defaultTab);

  const currentTab = controlledActiveTab !== undefined ? controlledActiveTab : internalTab;

  const handleTabClick = (tab: InspectorTab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    setInternalTab(tab);
  };

  return (
    <aside
      data-testid="inspector"
      aria-label="Slide properties inspector"
      className={`w-80 border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col h-full shrink-0 ${className}`}
    >
      {/* Four Tabs: Slide / Assets / Design / Brand */}
      <div
        data-testid="inspector-tabs"
        role="tablist"
        aria-label="Inspector tabs"
        className="grid grid-cols-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-1"
      >
        <button
          type="button"
          role="tab"
          id="tab-slide"
          aria-controls="panel-slide"
          aria-selected={currentTab === 'slide'}
          data-testid="tab-slide"
          onClick={() => handleTabClick('slide')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-500 ${
            currentTab === 'slide'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm border-b-2 border-amber-600 dark:border-amber-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t('editor.tabSlide')}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-assets"
          aria-controls="panel-assets"
          aria-selected={currentTab === 'assets'}
          data-testid="tab-assets"
          onClick={() => handleTabClick('assets')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-500 ${
            currentTab === 'assets'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm border-b-2 border-amber-600 dark:border-amber-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t('editor.tabAssets')}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-design"
          aria-controls="panel-design"
          aria-selected={currentTab === 'design'}
          data-testid="tab-design"
          onClick={() => handleTabClick('design')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-500 ${
            currentTab === 'design'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm border-b-2 border-amber-600 dark:border-amber-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t('editor.tabDesign')}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-brand"
          aria-controls="panel-brand"
          aria-selected={currentTab === 'brand'}
          data-testid="tab-brand"
          onClick={() => handleTabClick('brand')}
          className={`py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-500 ${
            currentTab === 'brand'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm border-b-2 border-amber-600 dark:border-amber-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t('editor.tabBrand')}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto">
        {currentTab === 'slide' && (
          <div role="tabpanel" id="panel-slide" aria-labelledby="tab-slide">
            <SlideInspector />
          </div>
        )}
        {currentTab === 'assets' && (
          <div role="tabpanel" id="panel-assets" aria-labelledby="tab-assets">
            <AssetsPanel />
          </div>
        )}
        {currentTab === 'design' && (
          <div role="tabpanel" id="panel-design" aria-labelledby="tab-design">
            <DesignInspector />
          </div>
        )}
        {currentTab === 'brand' && (
          <div role="tabpanel" id="panel-brand" aria-labelledby="tab-brand">
            <BrandInspector />
          </div>
        )}
      </div>
    </aside>
  );
};
