'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME, SITE_SHORT_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  variant?: 'header' | 'footer';
}

export function AnimatedLogo({ variant = 'header' }: AnimatedLogoProps) {
  const isFooter = variant === 'footer';

  return (
    <Link
      href="/"
      className={cn(
        'group/logo flex items-center gap-0 shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 -ml-1',
      )}
      aria-label={`${SITE_NAME} — Home`}
    >
      {/* Crest — fades in + subtle scale on hover */}
      <div
        className="shrink-0 opacity-0 group-hover/logo:scale-105 transition-transform duration-500"
        style={{
          animation: 'logo-crest-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s forwards',
        }}
      >
        <Image
          src="/images/ohcs-crest.png"
          alt="Ghana Civil Service Crest"
          width={isFooter ? 48 : 52}
          height={isFooter ? 48 : 52}
          className="object-contain"
          style={{ width: 'auto', height: isFooter ? 48 : 52 }}
        />
      </div>

      {/* Gold divider — grows from center */}
      <div
        className="mx-3.5 shrink-0 opacity-0"
        style={{
          animation: 'logo-divider-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s forwards',
        }}
      >
        <div
          aria-hidden="true"
          className={cn(
            'w-[2px] rounded-full',
            isFooter ? 'h-9' : 'h-10',
          )}
          style={{
            background: 'linear-gradient(to bottom, transparent, #D4A017, transparent)',
            animation: 'logo-divider-glow 3s ease-in-out 1.5s infinite',
          }}
        />
      </div>

      {/* Text block */}
      <div className="flex flex-col leading-tight">
        {/* OHCS — letter-by-letter reveal */}
        <div
          className="overflow-hidden opacity-0"
          style={{
            animation: 'logo-text-in 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s forwards',
          }}
        >
          <span
            className={cn(
              'font-display text-xl font-extrabold tracking-[3px] inline-block',
              isFooter ? 'text-white' : 'text-primary-dark',
            )}
          >
            {'OHCS'.split('').map((letter, i) => (
              <span
                key={i}
                className="inline-block opacity-0"
                style={{
                  animation: `logo-letter-in 0.4s cubic-bezier(0.16,1,0.3,1) ${0.6 + i * 0.08}s forwards`,
                }}
              >
                {letter}
              </span>
            ))}
          </span>
        </div>

        {/* Subtitle — slides in */}
        <span
          className={cn(
            'text-[10px] font-medium leading-tight hidden sm:block tracking-wide opacity-0',
            isFooter ? 'text-white/50' : 'text-text-muted',
          )}
          style={{
            animation: 'logo-subtitle-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.9s forwards',
          }}
        >
          {SITE_NAME}
        </span>

        {/* Kente stripe — draws from left to right + shimmer */}
        <div
          aria-hidden="true"
          className={cn(
            'mt-1 rounded-full hidden sm:block overflow-hidden',
            isFooter ? 'h-[2px]' : 'h-[3px]',
          )}
          style={{
            animation: 'logo-stripe-in 0.8s cubic-bezier(0.16,1,0.3,1) 1.0s forwards',
            width: 0,
          }}
        >
          <div
            className="h-full w-full relative"
            style={{
              background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
            }}
          >
            {/* Shimmer sweep on the stripe */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'kente-shimmer 3s ease-in-out 2s infinite',
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
