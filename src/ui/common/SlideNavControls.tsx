import React from 'react';

export type NavDirectionRole = 'prev' | 'next';
export type NavArrowVariant = 'arrow' | 'chevron';

/** Returns the physical glyph for previous/next navigation. The layout never
 * mirrors on language switch, so prev always points left and next right. */
function getDirectionalArrow(
  role: NavDirectionRole,
  variant: NavArrowVariant = 'arrow'
): string {
  if (variant === 'chevron') {
    return role === 'prev' ? '‹' : '›';
  }
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
  const arrow = getDirectionalArrow(roleType, variant);

  return (
    <button type="button" {...rest}>
      {children ?? <span aria-hidden="true">{arrow}</span>}
    </button>
  );
};
