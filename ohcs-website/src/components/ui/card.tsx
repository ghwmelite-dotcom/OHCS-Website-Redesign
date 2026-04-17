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
          // Base — refined surface with layered depth
          'relative bg-surface-card rounded-xl border border-border/60 shadow-card p-6',
          // Overflow hidden needed for the kente accent bar
          kenteAccent && 'group overflow-hidden',
          // Hoverable — smooth lift with gold-tinted shadow
          hoverable &&
            'hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 ease-out cursor-pointer',
          className,
        )}
        {...props}
      >
        {kenteAccent && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-0 bottom-0 w-[3px]',
              'bg-gradient-to-b from-primary via-accent to-kente-red',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
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
