'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'weaving' | 'crest' | 'reveal' | 'done'>('weaving');

  useEffect(() => {
    setLoading(true);
    setPhase('weaving');

    // Phase 1: Kente threads weave (0-600ms)
    const t1 = setTimeout(() => setPhase('crest'), 600);
    // Phase 2: Crest appears (600-1200ms)
    const t2 = setTimeout(() => setPhase('reveal'), 1200);
    // Phase 3: Curtain reveals (1200-1800ms)
    const t3 = setTimeout(() => setPhase('done'), 1800);
    // Remove from DOM
    const t4 = setTimeout(() => setLoading(false), 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    >
      {/* ── Left curtain ── */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-primary-dark transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)]"
        style={{
          transform: phase === 'done' ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        {/* Kente mesh texture */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
          }}
        />

        {/* Weaving threads — horizontal from left */}
        <div
          className="absolute top-[20%] left-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent"
          style={{
            width: phase === 'weaving' ? '0%' : '100%',
            transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            opacity: phase === 'done' ? 0 : 0.3,
          }}
        />
        <div
          className="absolute top-[45%] left-0 h-[2px] bg-gradient-to-r from-transparent via-[#E8C547] to-transparent"
          style={{
            width: phase === 'weaving' ? '0%' : '100%',
            transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s',
            opacity: phase === 'done' ? 0 : 0.2,
          }}
        />
        <div
          className="absolute top-[70%] left-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent"
          style={{
            width: phase === 'weaving' ? '0%' : '100%',
            transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s',
            opacity: phase === 'done' ? 0 : 0.25,
          }}
        />
      </div>

      {/* ── Right curtain ── */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-primary-dark transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)]"
        style={{
          transform: phase === 'done' ? 'translateX(100%)' : 'translateX(0)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
          }}
        />

        {/* Weaving threads — horizontal from right */}
        <div
          className="absolute top-[30%] right-0 h-[2px] bg-gradient-to-l from-transparent via-[#B71C1C] to-transparent"
          style={{
            width: phase === 'weaving' ? '0%' : '100%',
            transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s',
            opacity: phase === 'done' ? 0 : 0.2,
          }}
        />
        <div
          className="absolute top-[55%] right-0 h-[2px] bg-gradient-to-l from-transparent via-[#2E7D32] to-transparent"
          style={{
            width: phase === 'weaving' ? '0%' : '100%',
            transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s',
            opacity: phase === 'done' ? 0 : 0.25,
          }}
        />
        <div
          className="absolute top-[80%] right-0 h-[2px] bg-gradient-to-l from-transparent via-[#D4A017] to-transparent"
          style={{
            width: phase === 'weaving' ? '0%' : '100%',
            transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s',
            opacity: phase === 'done' ? 0 : 0.15,
          }}
        />
      </div>

      {/* ── Center emblem ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500"
        style={{
          opacity: phase === 'crest' || phase === 'reveal' ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${phase === 'crest' || phase === 'reveal' ? 1 : 0.5})`,
        }}
      >
        {/* Rotating shimmer ring behind crest */}
        <div
          className="absolute w-28 h-28 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(212,160,23,0.4) 25%, transparent 50%, rgba(212,160,23,0.2) 75%, transparent 100%)',
            animation: 'coa-shimmer 2s linear infinite',
            opacity: phase === 'done' ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        />
        {/* Dark mask */}
        <div
          className="absolute w-24 h-24 rounded-full bg-primary-dark"
          style={{
            opacity: phase === 'done' ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        />

        {/* Crest image */}
        <img
          src="/images/ohcs-crest.png"
          alt=""
          className="w-16 h-16 object-contain relative z-10"
          style={{
            opacity: phase === 'done' ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        />

        {/* OHCS text */}
        <div
          className="relative z-10 mt-3 text-center"
          style={{
            opacity: phase === 'reveal' ? 1 : 0,
            transform: phase === 'reveal' ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <span className="text-white font-display text-lg font-bold tracking-[4px] block">
            OHCS
          </span>
          {/* Kente stripe */}
          <div
            className="h-[3px] rounded-full mt-2 overflow-hidden"
            style={{
              width: phase === 'reveal' ? 80 : 0,
              margin: '8px auto 0',
              background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s',
            }}
          />
        </div>
      </div>

      {/* ── Kente stripe at curtain split ── */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[4px] z-10"
        style={{
          background: 'linear-gradient(to bottom, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
          opacity: phase === 'done' ? 0 : phase === 'weaving' ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
      />
    </div>
  );
}
