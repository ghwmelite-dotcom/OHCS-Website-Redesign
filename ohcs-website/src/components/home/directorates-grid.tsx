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
      className="py-16 lg:py-24 bg-surface-card"
    >
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2
            id="directorates-heading"
            className="font-display text-2xl lg:text-3xl font-bold text-primary-dark"
          >
            Our Directorates
          </h2>
          <Link
            href="/directorates"
            className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all directorates <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DIRECTORATES.map((dir, index) => {
            const Icon = ICON_MAP[dir.icon];
            return (
              <Link
                key={dir.slug}
                href={`/directorates/${dir.slug}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
              >
                <Card
                  hoverable
                  kenteAccent
                  className={cn(
                    'h-full p-6',
                    isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                    !isVisible && 'opacity-0',
                  )}
                  style={isVisible ? { animationDelay: `${index * 60}ms` } : undefined}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {Icon && <Icon className="h-5 w-5 text-primary" aria-hidden="true" />}
                    </div>
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                      {dir.shortName}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-2">
                    {dir.name}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2">
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
