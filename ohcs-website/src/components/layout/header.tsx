'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, SITE_NAME, SITE_SHORT_NAME } from '@/lib/constants';
import { MegaMenu } from '@/components/layout/mega-menu';
import { MobileNav } from '@/components/layout/mobile-nav';

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
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/coat-of-arms.png"
                alt="Ghana Coat of Arms"
                width={20}
                height={20}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
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
          <Link
            href="/"
            className={cn(
              'flex items-center gap-0 shrink-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 -ml-1',
            )}
            aria-label={`${SITE_NAME} — Home`}
          >
            {/* Crest */}
            <Image
              src="/images/ohcs-crest.png"
              alt="Ghana Civil Service Crest"
              width={52}
              height={52}
              className="object-contain shrink-0"
              style={{ width: 'auto', height: 52 }}
            />

            {/* Gold divider */}
            <div
              aria-hidden="true"
              className="w-[2px] h-10 mx-3.5 rounded-full shrink-0"
              style={{ background: 'linear-gradient(to bottom, transparent, #D4A017, transparent)' }}
            />

            {/* Text block with Kente underline */}
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-extrabold text-primary-dark tracking-[3px]">
                {SITE_SHORT_NAME}
              </span>
              <span className="text-[10px] font-medium text-text-muted leading-tight hidden sm:block tracking-wide">
                {SITE_NAME}
              </span>
              {/* Kente stripe */}
              <div
                aria-hidden="true"
                className="h-[3px] mt-1 rounded-full hidden sm:block"
                style={{
                  background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
                }}
              />
            </div>
          </Link>

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

            {/* Get Started CTA — desktop only */}
            <Link
              href="/services"
              className={cn(
                'hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl',
                'bg-primary text-white text-sm font-semibold',
                'hover:bg-primary-light hover:shadow-md transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              )}
            >
              Get Started
            </Link>

            {/* Mobile nav (hamburger + panel) */}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
