'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
// Note: SITE_SHORT_NAME no longer needed here — AnimatedLogo handles it
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { MegaMenu } from '@/components/layout/mega-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AnimatedLogo } from '@/components/layout/animated-logo';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-header border-b border-border/50'
          : 'bg-white border-b border-border/30',
      )}
    >
      {/* Top utility bar — Ghana identity + language */}
      <div className="bg-primary-dark">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9">
            {/* Ghana identity */}
            <div className="flex items-center gap-2.5 group/coa">
              <div className="relative w-7 h-7 flex items-center justify-center">
                {/* Rotating gold shimmer ring — always visible */}
                <div
                  aria-hidden="true"
                  className="absolute inset-[-4px] rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(212,160,23,0.5) 25%, transparent 50%, rgba(212,160,23,0.3) 75%, transparent 100%)',
                    animation: 'coa-shimmer 3s linear infinite',
                  }}
                />
                {/* Inner dark circle to mask the ring center */}
                <div
                  aria-hidden="true"
                  className="absolute inset-[-1px] rounded-full"
                  style={{ background: 'var(--color-primary-dark)' }}
                />
                {/* Pulsing gold glow */}
                <div
                  aria-hidden="true"
                  className="absolute inset-[-6px] rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(212,160,23,0.25) 0%, transparent 65%)',
                    animation: 'coa-glow 2.5s ease-in-out infinite',
                  }}
                />
                <Image
                  src="/images/coat-of-arms.png"
                  alt="Ghana Coat of Arms"
                  width={24}
                  height={24}
                  className="object-contain relative z-10 group-hover/coa:scale-110 transition-transform duration-500"
                  style={{ width: 24, height: 24 }}
                />
              </div>
              <span className="text-xs font-medium text-white/80 hidden sm:inline tracking-wide">
                Republic of Ghana
              </span>
            </div>

            {/* Right side — language + quick links */}
            <div className="flex items-center gap-4">
              <Link
                href="/contact"
                className="text-xs text-white/60 hover:text-white transition-colors hidden sm:inline"
              >
                Contact Us
              </Link>
              <span className="text-white/20 text-xs hidden sm:inline" aria-hidden="true">|</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="English language"
                  className={cn(
                    'text-xs font-semibold text-white/90 px-2 py-0.5 rounded',
                    'bg-white/15',
                  )}
                >
                  EN
                </button>
                <button
                  type="button"
                  aria-label="Twi language"
                  className={cn(
                    'text-xs font-medium text-white/50 px-2 py-0.5 rounded',
                    'hover:text-white/80 hover:bg-white/10 transition-colors',
                  )}
                >
                  TW
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ghana flag stripe */}
      <div
        aria-hidden="true"
        className="h-[3px]"
        style={{
          background: 'linear-gradient(90deg, #CE1126 33%, #FCD116 33%, #FCD116 66%, #006B3F 66%)',
        }}
      />

      {/* Main nav bar */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo + Identity */}
          <AnimatedLogo variant="header" />

          {/* Desktop navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => (
              <MegaMenu key={item.href} item={item} />
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search button */}
            <button
              type="button"
              aria-label="Search"
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl',
                'text-text-muted hover:text-primary hover:bg-primary/5 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <Search aria-hidden="true" className="w-5 h-5" />
            </button>

            {/* Ask Lexi CTA — desktop only */}
            <Link
              href="/assistant"
              className={cn(
                'hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl',
                'bg-gradient-to-r from-accent to-accent-light text-primary-dark text-sm font-bold',
                'hover:shadow-lg hover:scale-[1.03] transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              )}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ask Lexi
            </Link>

            {/* Mobile nav (hamburger + panel) */}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
