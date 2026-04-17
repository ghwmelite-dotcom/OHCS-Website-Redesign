'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Wallet,
  RefreshCw,
  Users,
  BarChart3,
  ClipboardCheck,
  Scale,
  Monitor,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DIRECTORATES } from '@/lib/constants';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
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

export function DirectoratesGrid() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      aria-labelledby="directorates-heading"
      className="py-24 lg:py-32 bg-white relative overflow-hidden"
    >
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="text-xs font-semibold text-accent uppercase tracking-[0.2em] block mb-1">
              Our Structure
            </span>
            <h2
              id="directorates-heading"
              className="font-display text-3xl lg:text-4xl font-bold text-primary-dark"
            >
              Directorates
            </h2>
          </div>
          <Link
            href="/directorates"
            className="text-base text-primary font-medium flex items-center gap-1.5 hover:gap-2.5 transition-all"
          >
            View all directorates <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {DIRECTORATES.map((dir, index) => {
            const Icon = ICON_MAP[dir.icon];
            return (
              <Link
                key={dir.slug}
                href={`/directorates/${dir.slug}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
              >
                <Card
                  hoverable
                  kenteAccent
                  className={cn(
                    'h-full p-7',
                    isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                    !isVisible && 'opacity-0',
                  )}
                  style={isVisible ? { animationDelay: `${index * 60}ms` } : undefined}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {Icon && <Icon className="h-6 w-6 text-primary" aria-hidden="true" />}
                    </div>
                    <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                      {dir.shortName}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base leading-snug mb-2">
                    {dir.name}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                    {dir.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
