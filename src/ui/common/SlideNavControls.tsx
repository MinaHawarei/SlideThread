import React from 'react';
import { useT } from '../../i18n';

export type NavDirectionRole = 'prev' | 'next';
export type NavArrowVariant = 'arrow' | 'chevron';

/** Returns a direction-aware glyph for previous/next navigation in LTR and RTL. */
function getDirectionalArrow(
  dir: 'ltr' | 'rtl',
  role: NavDirectionRole,
  variant: NavArrowVariant = 'arrow'
): string {
  if (variant === 'chevron') {
    if (dir === 'rtl') return role === 'prev' ? '›' : '‹';
    return role === 'prev' ? '‹' : '›';
  }
  if (dir === 'rtl') return role === 'prev' ? '→' : '←';
  return role === 'prev' ? '←' : '→';
}

export interface DirectionalNavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  roleType: NavDirectionRole;
  variant?: NavArrowVariant;
}

/** Shared prev/next navigation button that derives its arrow glyph from document direction. */
export const DirectionalNavButton: React.FC<DirectionalNavButtonProps> = ({
  roleType,
  variant = 'arrow',
  children,
  ...rest
}) => {
  const { dir } = useT();
  const arrow = getDirectionalArrow(dir, roleType, variant);

  return (
    <button type="button" {...rest}>
      {children ?? <span aria-hidden="true">{arrow}</span>}
    </button>
  );
};
