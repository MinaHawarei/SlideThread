import React from 'react';

/** Small inline SVG icon set. Never use emoji or icon-font glyphs: they render as boxes on some systems. */
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
type P = { size?: number; className?: string };
const I = (children: React.ReactNode) =>
  function Icon({ size = 16, className }: P) {
    return <svg {...base} width={size} height={size} className={className}>{children}</svg>;
  };

export const CameraIcon = I(<><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.4" /></>);
export const DownloadIcon = I(<><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M5 19h14" /></>);
export const UploadIcon = I(<><path d="M12 16V5M7.5 9.5 12 5l4.5 4.5" /><path d="M5 19h14" /></>);
export const CloseIcon = I(<path d="M6 6l12 12M18 6 6 18" />);
export const StarIcon = I(<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" />);
export const ChatIcon = I(<path d="M5 5h14v10H10l-4 4v-4H5z" />);
export const CheckIcon = I(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const SearchIcon = I(<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>);
export const FolderIcon = I(<path d="M3.5 7.5h6l2 2h9v9h-17z" />);
export const SwapIcon = I(<><path d="M4 8h15M15 4l4 4-4 4" /><path d="M20 16H5M9 12l-4 4 4 4" /></>);

// Editor and dialog icons that replace emoji and font-glyph symbols.
export const TemplateIcon = I(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9.5h16M9.5 9.5V20" /></>);
export const ShapesIcon = I(<><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" /><circle cx="16.5" cy="16.5" r="4" /></>);
export const PencilIcon = I(<><path d="M4 20l1-4.5L16.5 4a1.9 1.9 0 0 1 2.7 0l.8.8a1.9 1.9 0 0 1 0 2.7L8.5 19z" /><path d="M14.5 6l3.5 3.5" /></>);
export const PenIcon = I(<><path d="M12 20l-6.5-2 1.5-6.5L16 3l5 5-9 9" /><path d="M3 21l4-4" /><circle cx="11" cy="11" r="1.4" /></>);
export const TextIcon = I(<path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6" />);
export const BrandIcon = I(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /></>);
export const LayoutIcon = I(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 4v16M10 12h10" /></>);
export const SlidesIcon = I(<><rect x="6" y="3.5" width="12" height="14" rx="1.5" /><path d="M4 8v11.5h12" /></>);
export const TrashIcon = I(<><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7" /><path d="M10 11v5M14 11v5" /></>);
export const EyeIcon = I(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOffIcon = I(<><path d="M3 3l18 18" /><path d="M10 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.3 7.6A15.6 15.6 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.2-.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>);
export const LockIcon = I(<><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>);
export const UnlockIcon = I(<><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 7.5-1.9" /></>);
export const UndoIcon = I(<><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9a5 5 0 0 1 0 10h-3" transform="translate(0 -3)" /></>);
export const RedoIcon = I(<><path d="M15 7l4.5 4.5L15 16" /><path d="M19 11.5h-9a5 5 0 0 0 0 10h3" transform="translate(0 -3)" /></>);
export const KeyboardIcon = I(<><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>);
export const BulbIcon = I(<><path d="M9 18h6M10 21h4" /><path d="M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-.6c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z" /></>);
export const PageIcon = I(<><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>);
export const ClipboardIcon = I(<><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7" /></>);
export const SparkleIcon = I(<><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" /><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></>);
export const WarningIcon = I(<><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17.2v.1" /></>);
export const InfoIcon = I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.1" /></>);
export const ArrowUpIcon = I(<path d="M12 19V5M6 11l6-6 6 6" />);
export const ArrowDownIcon = I(<path d="M12 5v14M6 13l6 6 6-6" />);
export const ChevronUpIcon = I(<path d="m6 14 6-6 6 6" />);
export const ChevronDownIcon = I(<path d="m6 10 6 6 6-6" />);
export const ChevronRightIcon = I(<path d="m10 6 6 6-6 6" />);
export const ChevronLeftIcon = I(<path d="m14 6-6 6 6 6" />);

/** The single collapse/expand chevron for every panel (dock cards, slides strip,
 * whole-dock, mobile sheet cards): one glyph, rotated to point where the panel
 * goes when collapsing, or where it opens when expanding. */
export type CollapseDirection = 'up' | 'down' | 'left' | 'right';
const COLLAPSE_ROTATION: Record<CollapseDirection, string> = {
  down: '',
  right: '-rotate-90',
  up: 'rotate-180',
  left: 'rotate-90',
};
export const CollapseChevron = ({ direction, size = 14, className = '' }: { direction: CollapseDirection; size?: number; className?: string }) => (
  <ChevronDownIcon size={size} className={`transition-transform ${COLLAPSE_ROTATION[direction]} ${className}`.trim()} />
);
export const SlidersIcon = I(<><path d="M4 8h16M4 16h16" /><circle cx="9" cy="8" r="2.2" /><circle cx="15" cy="16" r="2.2" /></>);
export const DuplicateIcon = I(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
export const SunIcon = I(<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M2.5 12h2M19.5 12h2M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4" /></>);
export const MoonIcon = I(<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a7 7 0 0 0 10 10z" />);
export const ShieldIcon = I(<path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z" />);
export const LinkIcon = I(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
export const ImageIcon = I(<><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></>);
export const PackageIcon = I(<><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>);
export const RulerIcon = I(<><path d="M3.5 16.5 16.5 3.5l4 4-13 13z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></>);
export const SaveIcon = I(<><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></>);
export const PlayTriangleIcon = I(<path d="M8 5.5v13l10.5-6.5z" />);
export const RotateIcon = I(<><path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" /><path d="M4.5 4.5v4h4" /></>);
export const CheckCircleIcon = I(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.6-5" /></>);
export const FrameLandscapeIcon = I(<rect x="3.5" y="6.5" width="17" height="11" rx="1.5" />);
export const FramePortraitIcon = I(<rect x="6.5" y="3.5" width="11" height="17" rx="1.5" />);
export const BulletIcon = I(<><circle cx="6" cy="8" r="1" /><circle cx="6" cy="16" r="1" /><path d="M10 8h9M10 16h9" /></>);
export const IndentIcon = I(<><path d="M4 5h16M12 10h8M12 14h8M4 19h16" /><path d="m4 9.5 3.5 2.5L4 14.5z" /></>);
export const OutdentIcon = I(<><path d="M4 5h16M12 10h8M12 14h8M4 19h16" /><path d="M8 9.5 4.5 12 8 14.5z" /></>);
export const HomeIcon = I(<path d="M4 11 12 4l8 7v9h-5.5v-5.5h-5V20H4z" />);
export const PaletteIcon = I(<><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.6-2-.5-1.2.3-2.3 1.6-2.3H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7 16.8 3.5 12 3.5z" /><circle cx="8" cy="11" r="1" /><circle cx="11" cy="7.8" r="1" /><circle cx="15.2" cy="8.6" r="1" /></>);
export const GearIcon = I(<><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" /></>);
export const BoltIcon = I(<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z" />);
export const CodeIcon = I(<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 5l-3 14" />);
export const StatIcon = I(<path d="M5 20V12M10 20V6M15 20V10M20 20V14M3.5 20.5h17" />);
export const ArrowRightCircleIcon = I(<><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12h7M12.5 8.5 16 12l-3.5 3.5" /></>);
export const TitleIcon = I(<><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M7.5 10h9M7.5 14h5" /></>);
