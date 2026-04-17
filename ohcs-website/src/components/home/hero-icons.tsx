/**
 * Floating civic icon SVGs that drift upward through the hero gradient.
 * All icons are decorative — aria-hidden on the container.
 */

const ICON_PATHS: { name: string; size: number; viewBox: string; d: string }[] = [
  {
    name: 'scales',
    size: 32,
    viewBox: '0 0 24 24',
    d: 'M12 2L12 22M4 6L20 6M4 6L2 12C2 12 4 14 7 14C10 14 12 12 12 12M20 6L22 12C22 12 20 14 17 14C14 14 12 12 12 12M2 12L7 12M17 12L22 12',
  },
  {
    name: 'shield',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z',
  },
  {
    name: 'people',
    size: 34,
    viewBox: '0 0 24 24',
    d: 'M9 7a3 3 0 100-6 3 3 0 000 6zM17 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 21v-4c0-2 2-4 6-4s6 2 6 4v4M15 13c2.5 0 6 1 6 4v4',
  },
  {
    name: 'document',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M8 13h8M8 17h5',
  },
  {
    name: 'gear',
    size: 30,
    viewBox: '0 0 24 24',
    d: 'M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  },
  {
    name: 'star',
    size: 24,
    viewBox: '0 0 24 24',
    d: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z',
  },
  {
    name: 'building',
    size: 30,
    viewBox: '0 0 24 24',
    d: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01',
  },
  {
    name: 'globe',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M12 12m-10 0a10 10 0 1020 0 10 10 0 10-20 0M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  },
  {
    name: 'handshake',
    size: 32,
    viewBox: '0 0 24 24',
    d: 'M20 8l-6-6H10L4 8M4 8s4 4 8 4 8-4 8-4M8 16l-4 4M16 16l4 4M12 16a2 2 0 100-4 2 2 0 000 4z',
  },
  {
    name: 'book',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2zM9 7h7M9 11h5',
  },
  {
    name: 'award',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M12 8m-6 0a6 6 0 1012 0 6 6 0 10-12 0M15.477 12.89L17 22l-5-3-5 3 1.523-9.11',
  },
  {
    name: 'flag',
    size: 24,
    viewBox: '0 0 24 24',
    d: 'M4 2v20M4 2h16l-4 5 4 5H4',
  },
  {
    name: 'wreath',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M6 3C4 5 3 8 3 12s1 7 3 9M18 3c2 2 3 5 3 9s-1 7-3 9M8 4C7 6 6.5 9 6.5 12S7 18 8 20M16 4c1 2 1.5 5 1.5 8S17 18 16 20M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0',
  },
  {
    name: 'compass',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M12 12m-10 0a10 10 0 1020 0 10 10 0 10-20 0M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z',
  },
  {
    name: 'crown',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M2 17l2-10 4 4 4-7 4 7 4-4 2 10H2zM4 20h16',
  },
  {
    name: 'torch',
    size: 24,
    viewBox: '0 0 24 24',
    d: 'M12 2s-3 4-3 7a3 3 0 006 0c0-3-3-7-3-7zM12 12v8M8 20h8M10 16h4',
  },
];

const ICON_LAYOUT: { left: string; duration: string; delay: string }[] = [
  { left: '4%',  duration: '18s', delay: '0s' },
  { left: '11%', duration: '22s', delay: '2s' },
  { left: '19%', duration: '20s', delay: '5s' },
  { left: '27%', duration: '24s', delay: '1s' },
  { left: '34%', duration: '21s', delay: '7s' },
  { left: '7%',  duration: '26s', delay: '4s' },
  { left: '42%', duration: '17s', delay: '6s' },
  { left: '16%', duration: '23s', delay: '9s' },
  { left: '30%', duration: '19s', delay: '1s' },
  { left: '48%', duration: '25s', delay: '3s' },
  { left: '55%', duration: '20s', delay: '8s' },
  { left: '2%',  duration: '27s', delay: '3s' },
  { left: '38%', duration: '18s', delay: '10s' },
  { left: '23%', duration: '22s', delay: '0s' },
  { left: '50%', duration: '24s', delay: '5s' },
  { left: '14%', duration: '19s', delay: '12s' },
];

export function FloatingIcons({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {ICON_PATHS.map((icon, i) => {
        const layout = ICON_LAYOUT[i];
        if (!layout) return null;
        return (
          <div
            key={icon.name}
            style={{
              position: 'absolute',
              left: layout.left,
              width: icon.size,
              height: icon.size,
              opacity: 0,
              animation: `float-up ${layout.duration} linear ${layout.delay} infinite`,
              filter: 'drop-shadow(0 0 6px rgba(212,160,23,0.25))',
            }}
          >
            <svg
              viewBox={icon.viewBox}
              fill="none"
              stroke="rgba(212,160,23,0.35)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon.d} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
