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
            className="object-cover object-[center_30%] brightness-[0.28] contrast-[1.15] saturate-[0.8]"
            style={{ animation: 'ken-burns 25s ease-in-out infinite alternate' }}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Kente mesh overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity: 0.09,
          backgroundImage: [
            'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            'repeating-linear-gradient(0deg, #1B5E20 0px, #1B5E20 1px, transparent 1px, transparent 80px)',
            'repeating-linear-gradient(90deg, #B71C1C 0px, #B71C1C 1px, transparent 1px, transparent 80px)',
          ].join(', '),
        }}
      />

      {/* Directional gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(13,59,19,0.95) 0%, rgba(13,59,19,0.75) 45%, rgba(13,59,19,0.4) 70%, rgba(13,59,19,0.2) 100%)',
        }}
      />

      {/* Gold accent lines */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[3px] z-20"
        style={{
          background: 'linear-gradient(90deg, #D4A017, #E8C547 50%, #D4A017)',
          boxShadow: '0 0 12px rgba(212,160,23,0.3)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px z-20"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(212,160,23,0.4) 20%, rgba(212,160,23,0.4) 80%, transparent)',
        }}
      />

      {/* Ambient layers */}
      <FloatingIcons className="z-[5]" />
      <GoldParticles className="z-[4]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16 max-w-[680px]">
        <div
          className="flex items-center gap-3.5 mb-5 opacity-0"
          style={{
            animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          <span className="w-9 h-0.5 bg-accent" aria-hidden="true" />
          <span className="text-xs uppercase tracking-[3.5px] text-accent font-semibold">
            Republic of Ghana
          </span>
        </div>

        <h1
          className="font-display text-[clamp(2rem,7vw,3.4rem)] font-bold leading-[1.08] mb-6 opacity-0"
          style={{
            animation:
              'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s forwards',
          }}
        >
          {slide.headline[0]}
          <br />
          <span className="text-[#4CAF50]">{slide.headline[1]}</span>
        </h1>

        <p
          className="text-[17px] text-white/65 leading-relaxed max-w-[460px] mb-9 opacity-0"
          style={{
            animation:
              'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s forwards',
          }}
        >
          {slide.subtitle}
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 opacity-0"
          style={{
            animation:
              'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards',
          }}
        >
          <Link
            href="/services"
            className={cn(
              'inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg',
              'bg-primary text-white font-semibold text-[15px]',
              'shadow-[0_4px_16px_rgba(27,94,32,0.3)]',
              'hover:bg-primary-light hover:-translate-y-0.5 hover:scale-[1.02]',
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
              'bg-accent text-kente-black font-semibold text-[15px]',
              'shadow-[0_4px_16px_rgba(212,160,23,0.25)]',
              'hover:bg-accent-light hover:-translate-y-0.5 hover:scale-[1.02]',
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
