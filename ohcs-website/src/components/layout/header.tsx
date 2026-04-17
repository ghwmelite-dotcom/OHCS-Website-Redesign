'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, SITE_NAME, SITE_SHORT_NAME } from '@/lib/constants';
import { KenteAccent } from '@/components/kente/kente-accent';
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
        'sticky top-0 z-30 bg-surface-card transition-shadow duration-200',
        scrolled && 'shadow-header',
      )}
    >
      {/* Utility bar */}
      <div className="border-b border-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Ghana identity */}
            <div className="flex items-center gap-2">
              <Image
                src="/images/coat-of-arms.png"
                alt="Ghana Coat of Arms"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="text-xs font-medium text-text-muted hidden sm:inline">
                Republic of Ghana
              </span>
            </div>

            {/* Language selector placeholder */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Select language"
                className={cn(
                  'text-xs font-medium text-text-muted px-2 py-1 rounded-sm',
                  'hover:text-primary hover:bg-primary/5 transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                )}
              >
                EN
              </button>
              <span className="text-text-muted/40 text-xs" aria-hidden="true">|</span>
              <button
                type="button"
                aria-label="Twi language"
                className={cn(
                  'text-xs font-medium text-text-muted px-2 py-1 rounded-sm',
                  'hover:text-primary hover:bg-primary/5 transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                )}
              >
                TW
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav bar */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Identity */}
          <a
            href="/"
            className={cn(
              'flex items-center gap-3 shrink-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm',
            )}
            aria-label={`${SITE_NAME} — Home`}
          >
            <Image
              src="/images/logo.png"
              alt="OHCS Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-primary tracking-tight">
                {SITE_SHORT_NAME}
              </span>
              <span className="text-[0.6rem] font-medium text-text-muted leading-tight hidden sm:block max-w-[200px]">
                {SITE_NAME}
              </span>
            </div>
          </a>

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search"
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-md',
                'text-text hover:text-primary hover:bg-primary/5 transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <Search aria-hidden="true" className="w-5 h-5" />
            </button>

            {/* Mobile nav (hamburger + panel) */}
            <MobileNav />
          </div>
        </div>
      </div>

      {/* Kente header band */}
      <KenteAccent variant="header-band" />
    </header>
  );
}
