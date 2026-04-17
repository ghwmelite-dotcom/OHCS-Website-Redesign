'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingIcons } from '@/components/home/hero-icons';
import { GoldParticles } from '@/components/home/hero-particles';

interface Slide {
  image: string;
  alt: string;
  headline: [string, string];
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    image: '/images/hero/head-of-civil-service.jpg',
    alt: 'Head of the Civil Service of Ghana',
    headline: ["Serving Ghana's", 'Public Sector'],
    subtitle:
      'The Office of the Head of Civil Service drives excellence, accountability, and transformation across Ghana\u2019s civil service.',
  },
  {
    image: '/images/hero/chief-director.jpg',
    alt: 'Chief Director of OHCS',
    headline: ['Committed to', 'Excellence'],
    subtitle:
      'Upholding the values of loyalty, excellence, and service in every aspect of Ghana\u2019s public administration.',
  },
  {
    image: '/images/hero/council.jpg',
    alt: 'The Ghana Civil Service Council',
    headline: ["Transforming Ghana's", 'Civil Service'],
    subtitle:
      'Building a modern, accountable, and citizen-centered civil service for Ghana\u2019s future.',
  },
];

const INTERVAL_MS = 8000;
const TRANSITION_MS = 1000;

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      if (index === current || transitioning) return;
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(index);
        setTransitioning(false);
      }, TRANSITION_MS);
    },
    [current, transitioning],
  );

  const goToPrev = useCallback(() => {
    const prev = (current - 1 + SLIDES.length) % SLIDES.length;
    goTo(prev);
  }, [current, goTo]);

  const goToNext = useCallback(() => {
    const next = (current + 1) % SLIDES.length;
    goTo(next);
  }, [current, goTo]);

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setCurrent((prev) => {
          const next = (prev + 1) % SLIDES.length;
          setTransitioning(true);
          setTimeout(() => setTransitioning(false), TRANSITION_MS);
          return next;
        });
      }
    }, INTERVAL_MS);
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoplay]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  const slide = SLIDES[current]!;

  return (
    <section
      aria-label="Hero"
      aria-live="polite"
      role="region"
      className="relative w-full h-[500px] sm:h-[550px] lg:h-[600px] overflow-hidden bg-primary-dark"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      {/* Background images */}
      {SLIDES.map((s, i) => (
        <div
          key={s.image}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            i === current ? 'opacity-100' : 'opacity-0',
            i === current &&
              transitioning &&
              'animate-[zoom-fade-out_1s_ease-in-out_forwards]',
          )}
        >
          <Image
            src={s.image}
            alt={s.alt}
            fill
            priority={i === 0}
            className="object-contain brightness-[0.85] contrast-[1.02]"
            style={{
              animation: 'ken-burns 25s ease-in-out infinite alternate',
              objectPosition: 'right center',
            }}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Kente mesh overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: [
            'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            'repeating-linear-gradient(0deg, #1B5E20 0px, #1B5E20 1px, transparent 1px, transparent 80px)',
            'repeating-linear-gradient(90deg, #B71C1C 0px, #B71C1C 1px, transparent 1px, transparent 80px)',
          ].join(', '),
        }}
      />

      {/* Directional gradient — minimal, only on the left for text readability */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(13,59,19,0.82) 0%, rgba(13,59,19,0.5) 35%, rgba(13,59,19,0.15) 55%, transparent 70%)',
        }}
      />

      {/* ── Kente Frame: Top Band ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 z-20"
        style={{ height: 10 }}
      >
        {/* Base Kente stripe pattern */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(90deg, #1B5E20 0px, #1B5E20 80px, #D4A017 80px, #D4A017 160px, #B71C1C 160px, #B71C1C 240px, #212121 240px, #212121 320px)',
          }}
        />
        {/* Weft thread lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(0deg, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 7px, transparent 7px)',
            backgroundSize: '100% 10px',
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
        {/* Bottom shadow for depth */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)',
          }}
        />
      </div>

      {/* ── Kente Frame: Bottom Band ── */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{ height: 10 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(90deg, #212121 0px, #212121 80px, #B71C1C 80px, #B71C1C 160px, #D4A017 160px, #D4A017 240px, #1B5E20 240px, #1B5E20 320px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(0deg, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 7px, transparent 7px)',
            backgroundSize: '100% 10px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 55%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'kente-shimmer 4s ease-in-out 2s infinite',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)',
          }}
        />
      </div>

      {/* ── Golden Corner Brackets ── */}
      {/* Top-left */}
      <div
        aria-hidden="true"
        className="absolute top-[10px] left-0 z-20"
        style={{ animation: 'corner-glow 3s ease-in-out infinite' }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M2 58V6a4 4 0 014-4h52" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M2 40V10a4 4 0 014-4h34" stroke="#D4A017" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="6" cy="6" r="2" fill="#D4A017" opacity="0.8" />
        </svg>
      </div>
      {/* Top-right */}
      <div
        aria-hidden="true"
        className="absolute top-[10px] right-0 z-20"
        style={{ animation: 'corner-glow 3s ease-in-out 0.75s infinite' }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M58 58V6a4 4 0 00-4-4H2" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 40V10a4 4 0 00-4-4H20" stroke="#D4A017" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="54" cy="6" r="2" fill="#D4A017" opacity="0.8" />
        </svg>
      </div>
      {/* Bottom-left */}
      <div
        aria-hidden="true"
        className="absolute bottom-[10px] left-0 z-20"
        style={{ animation: 'corner-glow 3s ease-in-out 1.5s infinite' }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M2 2V54a4 4 0 004 4h52" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M2 20V50a4 4 0 004 4h34" stroke="#D4A017" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="6" cy="54" r="2" fill="#D4A017" opacity="0.8" />
        </svg>
      </div>
      {/* Bottom-right */}
      <div
        aria-hidden="true"
        className="absolute bottom-[10px] right-0 z-20"
        style={{ animation: 'corner-glow 3s ease-in-out 2.25s infinite' }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M58 2V54a4 4 0 01-4 4H2" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 20V50a4 4 0 01-4 4H20" stroke="#D4A017" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="54" cy="54" r="2" fill="#D4A017" opacity="0.8" />
        </svg>
      </div>

      {/* Ambient layers */}
      <FloatingIcons className="z-[5]" />
      <GoldParticles className="z-[4]" />

      {/* ── Navigation Arrows ── */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={goToPrev}
        className={cn(
          'absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20',
          'w-12 h-12 rounded-full',
          'flex items-center justify-center',
          'bg-transparent border border-white/30',
          'text-white/60 hover:text-accent hover:border-accent/60',
          'hover:shadow-[0_0_16px_rgba(212,160,23,0.15)]',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark',
          'group',
        )}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:-translate-x-0.5 transition-transform duration-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={goToNext}
        className={cn(
          'absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20',
          'w-12 h-12 rounded-full',
          'flex items-center justify-center',
          'bg-transparent border border-white/30',
          'text-white/60 hover:text-accent hover:border-accent/60',
          'hover:shadow-[0_0_16px_rgba(212,160,23,0.15)]',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark',
          'group',
        )}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:translate-x-0.5 transition-transform duration-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Content — eyebrow top-left, CTAs bottom-left */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 sm:pb-28">
        {/* Eyebrow — top left */}
        <div
          className="flex items-center gap-3.5 opacity-0"
          style={{
            animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          <span className="w-9 h-0.5 bg-accent" aria-hidden="true" />
          <span className="text-xs uppercase tracking-[3.5px] text-accent font-semibold">
            Republic of Ghana
          </span>
        </div>

        {/* CTAs — bottom left */}
        <div
          className="flex flex-col sm:flex-row gap-4 opacity-0"
          style={{
            animation:
              'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s forwards',
          }}
        >
          <Link
            href="/services"
            className={cn(
              'inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg',
              'bg-primary/60 text-white font-semibold text-[15px]',
              'backdrop-blur-[2px]',
              'hover:bg-primary/80 hover:-translate-y-0.5 hover:scale-[1.02]',
              'hover:shadow-[0_8px_24px_rgba(27,94,32,0.4)]',
              'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            )}
          >
            <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            Find a Service
          </Link>
          <Link
            href="/track"
            className={cn(
              'inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg',
              'bg-accent/60 text-kente-black font-semibold text-[15px]',
              'backdrop-blur-[2px]',
              'hover:bg-accent/80 hover:-translate-y-0.5 hover:scale-[1.02]',
              'hover:shadow-[0_8px_24px_rgba(212,160,23,0.35)]',
              'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            )}
          >
            <FileSearch className="w-[18px] h-[18px]" aria-hidden="true" />
            Track Submission
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div
        className="absolute bottom-9 left-6 sm:left-10 lg:left-16 flex gap-2 z-20 opacity-0"
        style={{
          animation:
            'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s forwards',
        }}
        role="tablist"
        aria-label="Hero slides"
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
            onClick={() => goTo(i)}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark',
              i === current
                ? 'w-13 bg-accent shadow-[0_0_8px_rgba(212,160,23,0.4)]'
                : 'w-8 bg-white/15 hover:bg-white/30',
            )}
          />
        ))}
      </div>
    </section>
  );
}
