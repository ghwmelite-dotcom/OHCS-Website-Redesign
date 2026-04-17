import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  kenteAccent?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, kenteAccent = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base
          'relative bg-surface-card rounded-lg border border-border shadow-card p-6',
          // Overflow hidden needed for the kente accent bar
          kenteAccent && 'group overflow-hidden',
          // Hoverable
          hoverable &&
            'hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 cursor-pointer',
          className,
        )}
        {...props}
      >
        {kenteAccent && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-0 bottom-0 w-[3px]',
              'bg-gradient-to-b from-[var(--color-kente-green,#006B3F)] via-[var(--color-accent,#FCD116)] to-[var(--color-kente-red,#CE1126)]',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            )}
          />
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

// Convenience sub-components
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-text leading-tight', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-text-muted', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center gap-2', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
export type { CardProps };
