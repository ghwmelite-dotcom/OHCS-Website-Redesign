'use client';

import { Breadcrumb } from '@/components/layout/breadcrumb';
import { FloatingShapes } from '@/components/home/floating-shapes';
import type { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  accent?: 'green' | 'gold' | 'warm';
  children?: ReactNode;
}

const ACCENT_STYLES = {
  green: {
    bg: 'from-primary-dark via-primary-dark to-primary',
    overlay: 'radial-gradient(ellipse at 70% 30%, rgba(46,125,50,0.3) 0%, transparent 60%)',
  },
  gold: {
    bg: 'from-[#2a1a00] via-[#3d2800] to-[#4a3000]',
    overlay: 'radial-gradient(ellipse at 70% 30%, rgba(212,160,23,0.2) 0%, transparent 60%)',
  },
  warm: {
    bg: 'from-primary-dark via-[#0a3315] to-primary-dark',
    overlay: 'radial-gradient(ellipse at 30% 70%, rgba(212,160,23,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(46,125,50,0.2) 0%, transparent 50%)',
  },
};

export function PageHero({
  title,
  subtitle,
  breadcrumbs,
  accent = 'green',
  children,
}: PageHeroProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <section className={`relative bg-gradient-to-br ${styles.bg} overflow-hidden`}>
      {/* ── Animated Kente weave threads ── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Horizontal gold threads — animate left to right */}
        <div
          className="absolute top-[20%] left-0 right-0 h-px opacity-[0.12]"
          style={{
            background: 'linear-gradient(90deg, transparent, #D4A017 30%, #D4A017 70%, transparent)',
            animation: 'kente-thread-h 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-[45%] left-0 right-0 h-px opacity-[0.08]"
          style={{
            background: 'linear-gradient(90deg, transparent, #E8C547 20%, #E8C547 80%, transparent)',
            animation: 'kente-thread-h 12s ease-in-out 2s infinite reverse',
          }}
        />
        <div
          className="absolute top-[75%] left-0 right-0 h-px opacity-[0.1]"
          style={{
            background: 'linear-gradient(90deg, transparent, #D4A017 40%, #D4A017 60%, transparent)',
            animation: 'kente-thread-h 10s ease-in-out 4s infinite',
          }}
        />

        {/* Vertical green threads — animate top to bottom */}
        <div
          className="absolute left-[15%] top-0 bottom-0 w-px opacity-[0.08]"
          style={{
            background: 'linear-gradient(0deg, transparent, #2E7D32 30%, #2E7D32 70%, transparent)',
            animation: 'kente-thread-v 9s ease-in-out 1s infinite',
          }}
        />
        <div
          className="absolute left-[50%] top-0 bottom-0 w-px opacity-[0.06]"
          style={{
            background: 'linear-gradient(0deg, transparent, #1B5E20 20%, #1B5E20 80%, transparent)',
            animation: 'kente-thread-v 11s ease-in-out 3s infinite reverse',
          }}
        />
        <div
          className="absolute left-[82%] top-0 bottom-0 w-px opacity-[0.1]"
          style={{
            background: 'linear-gradient(0deg, transparent, #2E7D32 40%, #2E7D32 60%, transparent)',
            animation: 'kente-thread-v 7s ease-in-out infinite',
          }}
        />

        {/* Diagonal red accent threads */}
        <div
          className="absolute top-0 left-0 w-[200%] h-px opacity-[0.06] origin-left"
          style={{
            background: 'linear-gradient(90deg, transparent, #B71C1C 40%, #B71C1C 60%, transparent)',
            transform: 'rotate(25deg) translateY(150px)',
            animation: 'kente-thread-h 14s ease-in-out 5s infinite',
          }}
        />
      </div>

      {/* Floating decorative shapes */}
      <div className="absolute inset-0 opacity-[0.06]">
        <FloatingShapes />
      </div>

      {/* Background overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: styles.overlay }}
      />

      {/* Kente mesh grid — more visible than before */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: [
            'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
          ].join(', '),
        }}
      />

      {/* Kente stripe bottom band — thicker with shimmer */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 6 }}
      >
        <div
          className="h-full"
          style={{
            background: 'repeating-linear-gradient(90deg, #1B5E20 0px, #1B5E20 80px, #D4A017 80px, #D4A017 160px, #B71C1C 160px, #B71C1C 240px, #212121 240px, #212121 320px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'kente-shimmer 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── Gold corner accents ── */}
      <div aria-hidden="true" className="absolute top-4 left-4 opacity-40" style={{ animation: 'corner-glow 3s ease-in-out infinite' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M2 38V4a2 2 0 012-2h34" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="4" cy="4" r="1.5" fill="#D4A017" />
        </svg>
      </div>
      <div aria-hidden="true" className="absolute top-4 right-4 opacity-40" style={{ animation: 'corner-glow 3s ease-in-out 0.75s infinite' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M38 38V4a2 2 0 00-2-2H2" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="36" cy="4" r="1.5" fill="#D4A017" />
        </svg>
      </div>
      <div aria-hidden="true" className="absolute bottom-[10px] left-4 opacity-40" style={{ animation: 'corner-glow 3s ease-in-out 1.5s infinite' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M2 2V36a2 2 0 002 2h34" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="4" cy="36" r="1.5" fill="#D4A017" />
        </svg>
      </div>
      <div aria-hidden="true" className="absolute bottom-[10px] right-4 opacity-40" style={{ animation: 'corner-glow 3s ease-in-out 2.25s infinite' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M38 2V36a2 2 0 01-2 2H2" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="36" cy="36" r="1.5" fill="#D4A017" />
        </svg>
      </div>

      {/* ── Content with staggered animations ── */}
      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Breadcrumb — animated entrance */}
        <div
          className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 mb-8 opacity-0"
          style={{ animation: 'hero-reveal 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards' }}
        >
          <div className="[&_nav]:text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/30">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>

        {/* Gold accent bar before title */}
        <div
          className="flex items-center gap-3 mb-5 opacity-0"
          style={{ animation: 'hero-reveal 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards' }}
        >
          <div
            className="h-[3px] rounded-full"
            style={{
              width: 48,
              background: 'linear-gradient(90deg, #D4A017, #E8C547)',
              animation: 'logo-stripe-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s forwards',
              opacity: 0,
            }}
          />
        </div>

        {/* Title — letter stagger would be too expensive, use word reveal instead */}
        <h1
          className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-5 max-w-3xl leading-tight opacity-0"
          style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards' }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="text-lg lg:text-xl text-white/65 max-w-2xl leading-relaxed opacity-0"
            style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s forwards' }}
          >
            {subtitle}
          </p>
        )}

        {/* Optional extra content (stats, CTAs, etc.) */}
        {children && (
          <div
            className="mt-10 opacity-0"
            style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s forwards' }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
