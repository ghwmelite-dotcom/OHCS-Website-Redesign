'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/types';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        className={cn(
          'lg:hidden flex items-center justify-center w-10 h-10 rounded-md',
          'text-text hover:text-primary hover:bg-primary/5 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        <Menu aria-hidden="true" className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out panel — only mounted when open to avoid duplicate nav items in DOM */}
      {isOpen && (
        <div
          id="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={cn(
            'fixed top-0 right-0 h-full w-[300px] bg-surface-card z-50 lg:hidden',
            'flex flex-col shadow-card',
            'transform transition-transform duration-300 ease-out translate-x-0',
          )}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <span className="font-semibold text-text">Navigation</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-md',
                'text-text hover:text-primary hover:bg-primary/5 transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <X aria-hidden="true" className="w-5 h-5" />
            </button>
          </div>

          {/* Nav items */}
          <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto py-2">
            {NAV_ITEMS.map((item) => (
              <MobileNavItem
                key={item.href}
                item={item}
                onClose={() => setIsOpen(false)}
              />
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

interface MobileNavItemProps {
  item: NavItem;
  onClose: () => void;
}

function MobileNavItem({ item, onClose }: MobileNavItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item.children || item.children.length === 0) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          'block px-4 py-3 text-sm font-medium text-text',
          'hover:text-primary hover:bg-primary/5 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:bg-primary/5',
        )}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3',
          'text-sm font-medium text-text',
          'hover:text-primary hover:bg-primary/5 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:bg-primary/5',
        )}
      >
        {item.label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {isExpanded && (
        <div className="bg-surface border-t border-border">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className={cn(
                'block pl-8 pr-4 py-2.5 text-sm text-text-muted',
                'hover:text-primary hover:bg-primary/5 transition-colors duration-150',
                'focus-visible:outline-none focus-visible:bg-primary/5',
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
