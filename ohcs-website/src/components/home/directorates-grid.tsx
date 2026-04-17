'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  Briefcase,
  Wallet,
  RefreshCw,
  Users,
  BarChart3,
  ClipboardCheck,
  Scale,
  Monitor,
} from 'lucide-react';
import { DIRECTORATES } from '@/lib/constants';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import { FloatingShapes } from '@/components/home/floating-shapes';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Wallet,
  RefreshCw,
  Users,
  BarChart3,
  ClipboardCheck,
  Scale,
  Monitor,
};

const GRADIENT_MAP: Record<string, string> = {
  Briefcase: 'from-green-500 to-emerald-600',
  Wallet: 'from-blue-500 to-indigo-600',
  RefreshCw: 'from-purple-500 to-violet-600',
  Users: 'from-teal-500 to-cyan-600',
  BarChart3: 'from-amber-500 to-orange-600',
  ClipboardCheck: 'from-rose-500 to-pink-600',
  Scale: 'from-slate-500 to-gray-700',
  Monitor: 'from-sky-500 to-blue-600',
};

const BORDER_MAP: Record<string, string> = {
  Briefcase: 'border-green-200 hover:border-green-400',
  Wallet: 'border-blue-200 hover:border-blue-400',
  RefreshCw: 'border-purple-200 hover:border-purple-400',
  Users: 'border-teal-200 hover:border-teal-400',
  BarChart3: 'border-amber-200 hover:border-amber-400',
  ClipboardCheck: 'border-rose-200 hover:border-rose-400',
  Scale: 'border-slate-200 hover:border-slate-400',
  Monitor: 'border-sky-200 hover:border-sky-400',
};

export function DirectoratesGrid() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      aria-labelledby="directorates-heading"
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <FloatingShapes />
      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header — centered */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-accent tracking-wide">
              Our Structure
            </span>
          </div>
          <h2
            id="directorates-heading"
            className="font-display text-4xl lg:text-5xl font-bold text-primary-dark mb-5"
          >
            <span className="relative inline-block">
              Directorates
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10"
              />
            </span>
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Eight specialized directorates driving Ghana&apos;s civil service forward.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DIRECTORATES.map((dir, index) => {
            const Icon = ICON_MAP[dir.icon];
            const gradient = GRADIENT_MAP[dir.icon] ?? 'from-gray-500 to-gray-600';
            const border = BORDER_MAP[dir.icon] ?? 'border-gray-200 hover:border-gray-400';
            return (
              <Link
                key={dir.slug}
                href={`/directorates/${dir.slug}`}
                className={cn(
                  'group/dir block bg-white rounded-2xl border-2 p-6',
                  'hover:shadow-lg transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  border,
                  isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                  !isVisible && 'opacity-0',
                )}
                style={isVisible ? { animationDelay: `${index * 80}ms` } : undefined}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                    gradient,
                  )}>
                    {Icon && <Icon className="h-6 w-6 text-white" aria-hidden="true" />}
                  </div>
                  <ChevronRight
                    className="h-5 w-5 text-text-muted/30 group-hover/dir:text-primary group-hover/dir:translate-x-1 transition-all duration-200"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">
                  {dir.shortName}
                </span>
                <h3 className="font-semibold text-base leading-snug mb-2">
                  {dir.name}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                  {dir.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* View all link */}
        <div className="text-center mt-12">
          <Link
            href="/directorates"
            className="inline-flex items-center gap-2 text-base font-medium text-primary px-6 py-3 rounded-xl border-2 border-primary/20 hover:border-primary/40 hover:shadow-sm transition-all"
          >
            View all directorates <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
