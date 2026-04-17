'use client';

import { cn } from '@/lib/utils';
import { KENTE_COLORS } from './kente-patterns';

export interface KenteLoaderProps {
  /** Visual size of the loader */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 48, height: 16, rectHeight: 2, gap: 4 },
  md: { width: 80, height: 24, rectHeight: 3, gap: 5 },
  lg: { width: 120, height: 32, rectHeight: 4, gap: 6 },
} as const;

const THREAD_COLORS = [
  KENTE_COLORS.green,
  KENTE_COLORS.gold,
  KENTE_COLORS.red,
  KENTE_COLORS.black,
] as const;

/**
 * KenteLoader — animated weave-threads loading indicator.
 * Four horizontal thread-rect elements animate from width=0 to full width
 * with staggered delays, evoking the motion of a Kente loom.
 */
export function KenteLoader({ size = 'md', className }: KenteLoaderProps) {
  const { width, height, rectHeight, gap } = SIZE_MAP[size];

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {THREAD_COLORS.map((color, i) => {
          const y = i * (rectHeight + gap);
          const delay = `${i * 0.15}s`;

          return (
            <rect
              key={color}
              x="0"
              y={y}
              width="0"
              height={rectHeight}
              rx={rectHeight / 2}
              fill={color}
            >
              {/* Animate width from 0 → full, repeat indefinitely */}
              <animate
                attributeName="width"
                from="0"
                to={String(width)}
                dur="0.9s"
                begin={delay}
                repeatCount="indefinite"
                calcMode="ease-out"
              />
              {/* Fade out as the thread reaches the end */}
              <animate
                attributeName="opacity"
                values="1;1;0"
                keyTimes="0;0.7;1"
                dur="0.9s"
                begin={delay}
                repeatCount="indefinite"
              />
            </rect>
          );
        })}
      </svg>
      {/* Screen-reader label */}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
