'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

interface MegaMenuProps {
  item: NavItem;
}

export function MegaMenu({ item }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!item.children || item.children.length === 0) {
    return (
      <Link
        href={item.href}
        className={cn(
          'relative text-sm font-medium text-text-muted hover:text-primary transition-colors duration-200',
          'px-3 py-2 rounded-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-primary',
          'after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left',
        )}
      >
        {item.label}
      </Link>
    );
  }

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), 100);
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  function handleButtonClick() {
    setIsOpen((prev) => !prev);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleButtonClick}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          'relative flex items-center gap-1 text-sm font-medium transition-colors duration-200',
          'px-3 py-2 rounded-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen ? 'text-primary bg-primary/5' : 'text-text-muted hover:text-primary',
        )}
      >
        {item.label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute left-0 top-full mt-2 min-w-[240px]',
            'bg-white rounded-2xl border border-border/60 shadow-elevated',
            'z-50 py-2 px-1',
            'animate-[reveal_0.2s_ease-out_forwards]',
          )}
        >
          {/* Gold accent line at top */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
            style={{ background: 'linear-gradient(90deg, #D4A017, #E8C547, #D4A017)' }}
          />

          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className={cn(
                'group/item flex items-center gap-3 px-4 py-3 mx-1 rounded-xl text-sm text-text',
                'hover:bg-primary/5 hover:text-primary transition-all duration-150',
                'focus-visible:outline-none focus-visible:bg-primary/5 focus-visible:text-primary',
              )}
            >
              {/* Dot indicator */}
              <span
                className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover/item:bg-primary group-hover/item:scale-125 transition-all duration-200 shrink-0"
                aria-hidden="true"
              />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
