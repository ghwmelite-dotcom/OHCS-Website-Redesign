/**
 * A decorative Kente-inspired section divider with weft threads and shimmer.
 * Thicker and more visual than the simple KenteAccent divider.
 */

interface KenteSectionDividerProps {
  className?: string;
}

export function KenteSectionDivider({ className }: KenteSectionDividerProps) {
  return (
    <div aria-hidden="true" className={className} style={{ height: 8 }}>
      {/* Base stripe pattern */}
      <div
        className="h-full relative"
        style={{
          background:
            'repeating-linear-gradient(90deg, #1B5E20 0px, #1B5E20 80px, #D4A017 80px, #D4A017 160px, #B71C1C 160px, #B71C1C 240px, #212121 240px, #212121 320px)',
        }}
      >
        {/* Weft thread lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(0deg, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 3px, rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px, transparent 4px)',
            backgroundSize: '100% 8px',
          }}
        />
        {/* Shimmer sweep */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 55%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'kente-shimmer 4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
