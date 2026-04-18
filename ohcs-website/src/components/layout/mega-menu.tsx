'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Building2,
  Users,
  GitBranch,
  Handshake,
  LayoutGrid,
  Landmark,
  GraduationCap,
  UserPlus,
  FileText,
  MessageSquare,
  Search,
  Newspaper,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Users,
  GitBranch,
  Handshake,
  LayoutGrid,
  Landmark,
  GraduationCap,
  UserPlus,
  FileText,
  MessageSquare,
  Search,
  Newspaper,
  Calendar,
  BookOpen,
};

interface MegaMenuProps {
  item: NavItem;
}

export function MegaMenu({ item }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simple link — no children
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
    timeoutRef.current = setTimeout(() => setIsOpen(true), 80);
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
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
            'absolute left-1/2 -translate-x-1/2 top-full mt-3',
            'bg-white rounded-2xl border border-border/40',
            'z-50 p-2',
            'opacity-0 animate-[reveal_0.25s_ease-out_forwards]',
          )}
          style={{
            width: Math.max(320, item.children.length > 3 ? 400 : 340),
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* Gold accent line at top */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #D4A017, transparent)' }}
          />

          {/* Category label */}
          <div className="px-4 pt-3 pb-2">
            <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
              {item.label}
            </span>
          </div>

          {/* Menu items */}
          {item.children.map((child, i) => {
            const Icon = child.icon ? ICON_MAP[child.icon] : null;
            return (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'group/item flex items-start gap-3.5 px-4 py-3 rounded-xl text-sm',
                  'hover:bg-primary/5 transition-all duration-150',
                  'focus-visible:outline-none focus-visible:bg-primary/5',
                )}
                style={{
                  animationDelay: `${i * 40}ms`,
                  animation: 'reveal 0.3s ease-out forwards',
                  opacity: 0,
                }}
              >
                {/* Icon badge */}
                {Icon && (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:from-primary/20 group-hover/item:to-primary/10 transition-colors duration-200">
                    <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-text group-hover/item:text-primary transition-colors duration-150 block">
                    {child.label}
                  </span>
                  {child.description && (
                    <span className="text-xs text-text-muted leading-relaxed mt-0.5 block">
                      {child.description}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* "View all" footer link */}
          <div className="border-t border-border/40 mt-1 pt-1 px-2 pb-1">
            <Link
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              View all {item.label.toLowerCase()}
              <ChevronDown className="w-3 h-3 -rotate-90" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
