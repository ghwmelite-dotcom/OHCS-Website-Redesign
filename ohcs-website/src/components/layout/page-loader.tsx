'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'weave' | 'crest' | 'fade' | 'done'>('weave');

  useEffect(() => {
    setLoading(true);
    setPhase('weave');

    const t1 = setTimeout(() => setPhase('crest'), 500);
    const t2 = setTimeout(() => setPhase('fade'), 1200);
    const t3 = setTimeout(() => setPhase('done'), 1700);
    const t4 = setTimeout(() => setLoading(false), 1900);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [pathname]);

  if (!loading) return null;

  const isFading = phase === 'fade' || phase === 'done';

  return (
    <div
      className="fixed inset-0 z-[9999]"
      aria-hidden="true"
      style={{
        opacity: phase === 'done' ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isFading ? 'none' : 'auto',
        backgroundColor: '#FDFAF5',
      }}
    >
      {/* ── Kente Threads — Horizontal ── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Green */}
        <div
          className="absolute h-[3px] rounded-full"
          style={{
            top: '18%',
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, transparent 5%, #1B5E20 25%, #1B5E20 75%, transparent 95%)',
            opacity: 0.18,
            transform: phase === 'weave' ? 'scaleX(0)' : 'scaleX(1)',
            transformOrigin: 'left',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
        {/* Gold */}
        <div
          className="absolute h-[3px] rounded-full"
          style={{
            top: '35%',
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, transparent 5%, #D4A017 20%, #D4A017 80%, transparent 95%)',
            opacity: 0.3,
            transform: phase === 'weave' ? 'scaleX(0)' : 'scaleX(1)',
            transformOrigin: 'right',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s',
          }}
        />
        {/* Red */}
        <div
          className="absolute h-[3px] rounded-full"
          style={{
            top: '58%',
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, transparent 10%, #B71C1C 30%, #B71C1C 70%, transparent 90%)',
            opacity: 0.14,
            transform: phase === 'weave' ? 'scaleX(0)' : 'scaleX(1)',
            transformOrigin: 'left',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s',
          }}
        />
        {/* Black */}
        <div
          className="absolute h-[3px] rounded-full"
          style={{
            top: '78%',
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, transparent 8%, #212121 25%, #212121 75%, transparent 92%)',
            opacity: 0.1,
            transform: phase === 'weave' ? 'scaleX(0)' : 'scaleX(1)',
            transformOrigin: 'right',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s',
          }}
        />

        {/* ── Kente Threads — Vertical ── */}
        {/* Gold */}
        <div
          className="absolute w-[3px] rounded-full"
          style={{
            left: '22%',
            top: 0,
            bottom: 0,
            background: 'linear-gradient(0deg, transparent 5%, #D4A017 25%, #D4A017 75%, transparent 95%)',
            opacity: 0.2,
            transform: phase === 'weave' ? 'scaleY(0)' : 'scaleY(1)',
            transformOrigin: 'top',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.08s',
          }}
        />
        {/* Green */}
        <div
          className="absolute w-[3px] rounded-full"
          style={{
            left: '50%',
            top: 0,
            bottom: 0,
            background: 'linear-gradient(0deg, transparent 10%, #1B5E20 30%, #1B5E20 70%, transparent 90%)',
            opacity: 0.12,
            transform: phase === 'weave' ? 'scaleY(0)' : 'scaleY(1)',
            transformOrigin: 'bottom',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.18s',
          }}
        />
        {/* Red */}
        <div
          className="absolute w-[3px] rounded-full"
          style={{
            left: '78%',
            top: 0,
            bottom: 0,
            background: 'linear-gradient(0deg, transparent 8%, #B71C1C 28%, #B71C1C 72%, transparent 92%)',
            opacity: 0.1,
            transform: phase === 'weave' ? 'scaleY(0)' : 'scaleY(1)',
            transformOrigin: 'top',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s',
          }}
        />
      </div>

      {/* ── Center Crest + Text ── */}
      <div
        className="absolute top-1/2 left-1/2 flex flex-col items-center"
        style={{
          transform: `translate(-50%, -50%) scale(${phase === 'weave' ? 0.6 : 1})`,
          opacity: phase === 'weave' ? 0 : 1,
          transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Gold shimmer ring */}
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(212,160,23,0.35) 25%, transparent 50%, rgba(212,160,23,0.2) 75%, transparent 100%)',
            animation: 'coa-shimmer 2s linear infinite',
          }}
        />
        <div
          className="absolute w-[86px] h-[86px] rounded-full"
          style={{ backgroundColor: '#FDFAF5' }}
        />

        {/* Crest */}
        <img
          src="/images/ohcs-crest.png"
          alt=""
          className="w-14 h-14 object-contain relative z-10"
        />

        {/* OHCS text */}
        <span
          className="relative z-10 mt-3 font-display text-xl font-bold tracking-[5px]"
          style={{
            color: '#0D3B13',
            opacity: phase === 'crest' || phase === 'fade' ? 1 : 0,
            transform: phase === 'crest' || phase === 'fade' ? 'translateY(0)' : 'translateY(6px)',
            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s',
          }}
        >
          OHCS
        </span>

        {/* Kente stripe */}
        <div
          className="relative z-10 h-[4px] rounded-full mt-2 overflow-hidden"
          style={{
            width: phase === 'crest' || phase === 'fade' ? 72 : 0,
            background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
            transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s',
          }}
        >
          <div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'kente-shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}
