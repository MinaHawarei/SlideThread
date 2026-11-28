import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useT } from '../../i18n';
import type { ExportFormat } from '../../export/pipeline';
import { ChevronDownIcon, CodeIcon, DownloadIcon, ImageIcon, PageIcon } from '../common/icons';

export interface ExportMenuProps {
  /** Opens the export dialog with a preselected format ('zip' = one PNG per slide, 'pdf', 'png'). */
  onOpenExport?: (format?: ExportFormat) => void;
  /** Exports the whole project as JSON. */
  onExportJson: () => void;
  /** Single-slide projects export one PNG instead of a ZIP of images. */
  isSingleSlide: boolean;
}

const itemClass =
  'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer outline-none data-[highlighted]:bg-stone-100 dark:data-[highlighted]:bg-stone-800';

export const ExportMenu: React.FC<ExportMenuProps> = ({ onOpenExport, onExportJson, isSingleSlide }) => {
  const { t } = useT();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          data-testid="editor-export-btn"
          className="py-1.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
        >
          <DownloadIcon size={16} />
          <span>{t('editor.export')}</span>
          <ChevronDownIcon size={13} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          data-testid="export-menu"
          align="end"
          sideOffset={6}
          className="z-50 w-60 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl p-1.5"
        >
          <DropdownMenu.Item
            data-testid="export-menu-images"
            className={itemClass}
            onSelect={() => onOpenExport?.(isSingleSlide ? 'png' : 'zip')}
          >
            <ImageIcon size={17} className="text-stone-500 dark:text-stone-400 shrink-0" />
            <span>
              {t('export.menuImages')}
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">{t('export.menuImagesHint')}</span>
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            data-testid="export-menu-pdf"
            className={itemClass}
            onSelect={() => onOpenExport?.('pdf')}
          >
            <PageIcon size={17} className="text-stone-500 dark:text-stone-400 shrink-0" />
            <span>
              {t('export.menuPdf')}
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">{t('export.menuPdfHint')}</span>
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            data-testid="export-menu-json"
            className={itemClass}
            onSelect={() => onExportJson()}
          >
            <CodeIcon size={17} className="text-stone-500 dark:text-stone-400 shrink-0" />
            <span>
              {t('export.menuJson')}
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">{t('export.menuJsonHint')}</span>
            </span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default ExportMenu;
