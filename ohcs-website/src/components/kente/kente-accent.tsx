import { cn } from '@/lib/utils';
import { KentePatternSVG, kenteBackgroundPattern } from './kente-patterns';

export type KenteVariant = 'divider' | 'border' | 'background' | 'header-band';

export interface KenteAccentProps {
  variant: KenteVariant;
  className?: string;
}

/**
 * KenteAccent — decorative Kente-cloth-inspired accent element.
 * Always aria-hidden; purely visual.
 */
export function KenteAccent({ variant, className }: KenteAccentProps) {
  switch (variant) {
    case 'divider':
      return (
        <div
          role="separator"
          className={cn('kente-divider w-full overflow-hidden', className)}
          style={{ height: '6px' }}
        >
          {/* Tile the 64px-wide SVG strip across the full width */}
          <div
            className="h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 8" preserveAspectRatio="none">' +
                '<rect x="0"  y="0" width="16" height="8" fill="#1B5E20"/>' +
                '<rect x="16" y="0" width="16" height="8" fill="#D4A017"/>' +
                '<rect x="32" y="0" width="16" height="8" fill="#B71C1C"/>' +
                '<rect x="48" y="0" width="16" height="8" fill="#212121"/>' +
                '<line x1="0" y1="2" x2="64" y2="2" stroke="rgba(255,255,255,0.20)" stroke-width="0.5"/>' +
                '<line x1="0" y1="6" x2="64" y2="6" stroke="rgba(255,255,255,0.20)" stroke-width="0.5"/>' +
                '</svg>'
              )}")`,
              backgroundSize: '64px 6px',
              backgroundRepeat: 'repeat-x',
            }}
          />
        </div>
      );

    case 'header-band':
      return (
        <div
          data-testid="kente-header-band"
          aria-hidden="true"
          className={cn('w-full overflow-hidden', className)}
          style={{ height: '4px' }}
        >
          <div
            className="h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 8" preserveAspectRatio="none">' +
                '<rect x="0"  y="0" width="16" height="8" fill="#1B5E20"/>' +
                '<rect x="16" y="0" width="16" height="8" fill="#D4A017"/>' +
                '<rect x="32" y="0" width="16" height="8" fill="#B71C1C"/>' +
                '<rect x="48" y="0" width="16" height="8" fill="#212121"/>' +
                '<line x1="0" y1="2" x2="64" y2="2" stroke="rgba(255,255,255,0.20)" stroke-width="0.5"/>' +
                '<line x1="0" y1="6" x2="64" y2="6" stroke="rgba(255,255,255,0.20)" stroke-width="0.5"/>' +
                '</svg>'
              )}")`,
              backgroundSize: '64px 4px',
              backgroundRepeat: 'repeat-x',
            }}
          />
        </div>
      );

    case 'background':
      return (
        <div
          aria-hidden="true"
          className={cn('absolute inset-0 pointer-events-none', className)}
          style={{
            backgroundImage: `url("${kenteBackgroundPattern}")`,
            backgroundSize: '64px 64px',
            backgroundRepeat: 'repeat',
          }}
        />
      );

    case 'border':
      return (
        <div
          aria-hidden="true"
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100',
            'transition-opacity duration-200',
            className,
          )}
          style={{
            background: 'linear-gradient(to bottom, #1B5E20, #D4A017, #B71C1C)',
          }}
        />
      );

    default:
      return null;
  }
}
