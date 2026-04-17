import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'accent';
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-black/10 text-text',
  success: 'bg-success/10 text-success',
  error:   'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
  info:    'bg-info/10 text-info',
  accent:  'bg-accent/10 text-kente-black',
};

function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full text-xs font-medium px-2.5 py-0.5',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps };
