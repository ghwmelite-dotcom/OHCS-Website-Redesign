/**
 * Kente cloth-inspired design primitives.
 * Abstracted geometric patterns inspired by Kente weaving — not literal cloth reproductions.
 */

export const KENTE_COLORS = {
  green: '#1B5E20',
  gold: '#D4A017',
  red: '#B71C1C',
  black: '#212121',
  cream: '#FDFAF5',
} as const;

export type KenteColor = keyof typeof KENTE_COLORS;

/**
 * Inline SVG strip that tiles horizontally.
 * ViewBox: 64×8 — four 16×8 blocks in green, gold, red, black
 * with subtle cross-thread lines to evoke the weave texture.
 */
export function KentePatternSVG({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 8"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Four main colour blocks */}
      <rect x="0" y="0" width="16" height="8" fill={KENTE_COLORS.green} />
      <rect x="16" y="0" width="16" height="8" fill={KENTE_COLORS.gold} />
      <rect x="32" y="0" width="16" height="8" fill={KENTE_COLORS.red} />
      <rect x="48" y="0" width="16" height="8" fill={KENTE_COLORS.black} />

      {/* Horizontal weft threads — lighter overlay at 20% */}
      <line x1="0" y1="2" x2="64" y2="2" stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
      <line x1="0" y1="6" x2="64" y2="6" stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />

      {/* Vertical warp accents at block boundaries */}
      <line x1="16" y1="0" x2="16" y2="8" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
      <line x1="32" y1="0" x2="32" y2="8" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
      <line x1="48" y1="0" x2="48" y2="8" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
    </svg>
  );
}

/**
 * Base64-encoded SVG data URI for CSS `background-image` use.
 * 64×64 checkerboard of the four Kente colours at ~3–4% opacity,
 * suitable as a subtle texture overlay.
 */
export const kenteBackgroundPattern: string = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <rect x="0"  y="0"  width="32" height="32" fill="${KENTE_COLORS.green}" opacity="0.035"/>
    <rect x="32" y="0"  width="32" height="32" fill="${KENTE_COLORS.gold}"  opacity="0.035"/>
    <rect x="0"  y="32" width="32" height="32" fill="${KENTE_COLORS.red}"   opacity="0.035"/>
    <rect x="32" y="32" width="32" height="32" fill="${KENTE_COLORS.black}" opacity="0.035"/>
  </svg>`;
  const encoded = typeof btoa !== 'undefined'
    ? btoa(svg)
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
})();
