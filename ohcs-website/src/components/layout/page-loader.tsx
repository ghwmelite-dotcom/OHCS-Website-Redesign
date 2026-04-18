'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 0>(1);

  useEffect(() => {
    setLoading(true);
    setPhase(1);

    // Phase 1: Kente blocks build (0-900ms)
    // Phase 2: Crest burst (900-2000ms)
    // Phase 3: Kente stripe + text (2000-2800ms)
    // Phase 4: Dissolve out (2800-3500ms)
    const t1 = setTimeout(() => setPhase(2), 900);
    const t2 = setTimeout(() => setPhase(3), 2000);
    const t3 = setTimeout(() => setPhase(4), 2800);
    const t4 = setTimeout(() => setPhase(0), 3500);
    const t5 = setTimeout(() => setLoading(false), 3800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [pathname]);

  if (!loading) return null;

  const active = phase >= 2;
  const burst = phase >= 2;
  const textIn = phase >= 3;
  const fadeOut = phase >= 4 || phase === 0;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      aria-hidden="true"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Background — warm cream */}
      <div className="absolute inset-0" style={{ backgroundColor: '#FDFAF5' }} />

      {/* ── Kente Pattern Grid — builds block by block ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: 'repeat(16, 1fr)',
            gridTemplateRows: 'repeat(10, 1fr)',
            width: '100vw',
            height: '100vh',
            opacity: fadeOut ? 0 : 0.12,
            transition: 'opacity 0.3s',
          }}
        >
          {Array.from({ length: 160 }).map((_, i) => {
            const colors = ['#1B5E20', '#D4A017', '#B71C1C', '#212121'];
            const row = Math.floor(i / 16);
            const col = i % 16;
            const colorIndex = (row + col) % 4;
            const delay = (row * 40) + (col * 20);
            return (
              <div
                key={i}
                style={{
                  backgroundColor: colors[colorIndex],
                  opacity: active ? 1 : 0,
                  transform: active ? 'scale(1)' : 'scale(0)',
                  transition: `all 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Central Spotlight ── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: burst
            ? 'radial-gradient(circle at center, #FDFAF5 0%, #FDFAF5 15%, transparent 50%)'
            : 'none',
          transition: 'all 0.5s',
        }}
      />

      {/* ── Crest Assembly ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          {/* Outer gold ring — rotating */}
          <div className="relative">
            <div
              className="absolute rounded-full"
              style={{
                inset: -16,
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(212,160,23,0.6) 20%, transparent 40%, rgba(212,160,23,0.4) 60%, transparent 80%, rgba(212,160,23,0.5) 95%, transparent 100%)',
                animation: 'coa-shimmer 2s linear infinite',
                opacity: burst ? 1 : 0,
                transform: burst ? 'scale(1)' : 'scale(0.5)',
                transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute rounded-full"
              style={{
                inset: -8,
                border: '2px solid rgba(212,160,23,0.25)',
                opacity: burst ? 1 : 0,
                transition: 'opacity 0.4s 0.2s',
              }}
            />
            {/* Cream mask */}
            <div
              className="absolute rounded-full"
              style={{
                inset: -6,
                backgroundColor: '#FDFAF5',
                opacity: burst ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            />
            {/* Gold glow pulse */}
            <div
              className="absolute rounded-full"
              style={{
                inset: -24,
                background: 'radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 60%)',
                animation: 'coa-glow 1.5s ease-in-out infinite',
                opacity: burst ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            />

            {/* CREST IMAGE — LARGE */}
            <img
              src="/images/ohcs-crest.png"
              alt=""
              style={{
                width: 100,
                height: 100,
                objectFit: 'contain',
                position: 'relative',
                zIndex: 10,
                opacity: burst ? 1 : 0,
                transform: burst ? 'scale(1) rotate(0deg)' : 'scale(0.3) rotate(-20deg)',
                transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>

          {/* OHCS Text */}
          <div
            style={{
              marginTop: 20,
              opacity: textIn ? 1 : 0,
              transform: textIn ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: '#0D3B13',
                letterSpacing: 8,
                display: 'block',
                textAlign: 'center',
              }}
            >
              OHCS
            </span>
            <span
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: 10,
                color: '#5C5549',
                letterSpacing: 3,
                marginTop: 4,
                textTransform: 'uppercase',
                fontWeight: 600,
                opacity: textIn ? 0.6 : 0,
                transition: 'opacity 0.3s 0.15s',
              }}
            >
              Office of the Head of the Civil Service
            </span>
          </div>

          {/* Kente Stripe */}
          <div
            style={{
              height: 5,
              borderRadius: 3,
              marginTop: 14,
              overflow: 'hidden',
              width: textIn ? 120 : 0,
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s',
              background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'kente-shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
