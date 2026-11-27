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
