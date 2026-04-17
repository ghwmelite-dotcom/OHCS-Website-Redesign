/**
 * Gold bokeh particle field — 20 glowing dots that float through the hero.
 * All decorative — aria-hidden on the container.
 */

interface ParticleConfig {
  left: string;
  top: string;
  size: number;
  dx: number;
  dy: number;
  maxOpacity: number;
  duration: string;
  delay: string;
}

const PARTICLES: ParticleConfig[] = [
  { left: '6%',  top: '80%', size: 6,  dx: 25,  dy: -380, maxOpacity: 0.7,  duration: '16s', delay: '0s' },
  { left: '14%', top: '90%', size: 5,  dx: -18, dy: -420, maxOpacity: 0.6,  duration: '20s', delay: '2s' },
  { left: '24%', top: '75%', size: 8,  dx: 35,  dy: -350, maxOpacity: 0.75, duration: '18s', delay: '1s' },
  { left: '32%', top: '85%', size: 4,  dx: -12, dy: -400, maxOpacity: 0.55, duration: '22s', delay: '5s' },
  { left: '9%',  top: '95%', size: 9,  dx: 28,  dy: -480, maxOpacity: 0.65, duration: '24s', delay: '3s' },
  { left: '40%', top: '70%', size: 5,  dx: -22, dy: -320, maxOpacity: 0.7,  duration: '17s', delay: '1s' },
  { left: '20%', top: '60%', size: 7,  dx: 18,  dy: -300, maxOpacity: 0.5,  duration: '21s', delay: '7s' },
  { left: '45%', top: '88%', size: 5,  dx: -28, dy: -390, maxOpacity: 0.6,  duration: '19s', delay: '4s' },
  { left: '4%',  top: '65%', size: 8,  dx: 15,  dy: -280, maxOpacity: 0.75, duration: '20s', delay: '6s' },
  { left: '36%', top: '78%', size: 4,  dx: 20,  dy: -340, maxOpacity: 0.5,  duration: '23s', delay: '9s' },
  { left: '50%', top: '92%', size: 6,  dx: -15, dy: -450, maxOpacity: 0.55, duration: '25s', delay: '2s' },
  { left: '17%', top: '72%', size: 5,  dx: 24,  dy: -310, maxOpacity: 0.65, duration: '18s', delay: '8s' },
  { left: '55%', top: '82%', size: 7,  dx: -10, dy: -360, maxOpacity: 0.45, duration: '26s', delay: '1s' },
  { left: '28%', top: '68%', size: 4,  dx: 16,  dy: -280, maxOpacity: 0.7,  duration: '15s', delay: '11s' },
  { left: '60%', top: '75%', size: 5,  dx: -20, dy: -330, maxOpacity: 0.4,  duration: '20s', delay: '4s' },
  { left: '12%', top: '55%', size: 10, dx: 30,  dy: -260, maxOpacity: 0.6,  duration: '22s', delay: '0s' },
  { left: '42%', top: '94%', size: 6,  dx: -14, dy: -440, maxOpacity: 0.65, duration: '19s', delay: '6s' },
  { left: '2%',  top: '85%', size: 7,  dx: 22,  dy: -370, maxOpacity: 0.7,  duration: '21s', delay: '3s' },
  { left: '48%', top: '65%', size: 5,  dx: -18, dy: -290, maxOpacity: 0.5,  duration: '16s', delay: '10s' },
  { left: '33%', top: '58%', size: 8,  dx: 12,  dy: -250, maxOpacity: 0.55, duration: '23s', delay: '7s' },
];

export function GoldParticles({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,160,23,0.8), rgba(212,160,23,0) 70%)',
            boxShadow: `0 0 ${p.size * 2}px rgba(212,160,23,0.3)`,
            opacity: 0,
            animation: `drift ${p.duration} linear ${p.delay} infinite`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--max-opacity': p.maxOpacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
