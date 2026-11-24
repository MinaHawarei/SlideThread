import React from 'react';

export interface LogoMarkProps {
  className?: string;
  size?: number | string;
  animated?: boolean;
}

export const LogoMark: React.FC<LogoMarkProps> = ({
  className = '',
  size = 24,
  animated = false,
}) => {
  const id = React.useId();
  const clipId = `slidethread-logo-clip-${id.replace(/:/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${animated ? 'animate-pulse motion-reduce:animate-none' : ''} ${className}`}
      aria-hidden="true"
    >
      <g transform="translate(143.36 326.9199175257732) scale(0.7600824742268041)">
        <defs>
          <clipPath id={clipId}>
            <path
              clipRule="evenodd"
              d="M-10 -10H980V497H-10Z M202.0 198.5H768.0A45.0 45.0 0 0 1 768.0 288.5H202.0A45.0 45.0 0 0 1 202.0 198.5Z"
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect
            width="447"
            height="487"
            rx="78"
            className="fill-[#44403C] dark:fill-[#F5F0E8] transition-colors"
          />
          <rect
            x="523"
            width="447"
            height="487"
            rx="78"
            fill="#F2993A"
          />
        </g>
        <rect
          x="181"
          y="222.5"
          width="608"
          height="42"
          rx="21"
          className="fill-[#44403C] dark:fill-[#F5F0E8] transition-colors"
        />
      </g>
    </svg>
  );
};
