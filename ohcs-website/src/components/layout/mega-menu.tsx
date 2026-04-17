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
          'text-sm font-medium text-text hover:text-primary transition-colors duration-150',
          'px-1 py-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        {item.label}
      </Link>
    );
  }

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), 150);
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
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
          'flex items-center gap-1 text-sm font-medium text-text hover:text-primary transition-colors duration-150',
          'px-1 py-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen && 'text-primary',
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
            'absolute left-0 top-full mt-1 min-w-[200px]',
            'bg-surface-card rounded-lg border border-border shadow-card',
            'z-50 py-1 animate-fade-in',
          )}
        >
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className={cn(
                'block px-4 py-2.5 text-sm text-text',
                'hover:bg-primary/5 hover:text-primary transition-colors duration-150',
                'focus-visible:outline-none focus-visible:bg-primary/5 focus-visible:text-primary',
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
