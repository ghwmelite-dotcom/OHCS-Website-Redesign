/**
 * Floating decorative geometric shapes scattered across sections.
 * Inspired by the OHCS E-Library's playful, modern aesthetic.
 * All shapes are aria-hidden — purely decorative.
 */

const SHAPES = [
  { color: '#1B5E20', width: 40, height: 40, top: '8%', left: '5%', rotate: 12, opacity: 0.08, radius: 8 },
  { color: '#D4A017', width: 24, height: 24, top: '15%', right: '8%', rotate: -20, opacity: 0.12, radius: 6 },
  { color: '#B71C1C', width: 32, height: 18, top: '25%', left: '90%', rotate: 45, opacity: 0.07, radius: 4 },
  { color: '#1B5E20', width: 18, height: 32, top: '60%', left: '3%', rotate: -15, opacity: 0.06, radius: 4 },
  { color: '#D4A017', width: 28, height: 28, top: '70%', right: '5%', rotate: 30, opacity: 0.1, radius: 14 },
  { color: '#2E7D32', width: 20, height: 20, top: '45%', left: '92%', rotate: 0, opacity: 0.08, radius: 10 },
  { color: '#E8C547', width: 16, height: 36, top: '85%', left: '8%', rotate: -25, opacity: 0.06, radius: 3 },
  { color: '#B71C1C', width: 22, height: 22, top: '5%', left: '50%', rotate: 15, opacity: 0.05, radius: 4 },
];

export function FloatingShapes() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {SHAPES.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: s.width,
            height: s.height,
            top: s.top,
            left: s.left,
            right: (s as Record<string, unknown>).right as string | undefined,
            backgroundColor: s.color,
            opacity: s.opacity,
            borderRadius: s.radius,
            transform: `rotate(${s.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
