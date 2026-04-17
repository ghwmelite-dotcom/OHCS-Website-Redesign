'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const LEADERS = [
  {
    name: 'Evans Aggrey-Darkoh, Ph.D.',
    title: 'Head of the Civil Service',
    bio: 'Leading the transformation and modernisation of Ghana\u2019s civil service to deliver efficient, transparent, and accountable public services to all citizens.',
    photoUrl: '/images/hero/head-of-civil-service.jpg',
  },
  {
    name: 'Mr. Sylvanus Kofi Adzornu',
    title: 'Chief Director',
    bio: 'Overseeing the administrative operations of OHCS and driving institutional excellence across all directorates and departments.',
    photoUrl: '/images/hero/chief-director.jpg',
  },
];

export function LeadershipSpotlight() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} aria-labelledby="leadership-heading" className="py-16 lg:py-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2
            id="leadership-heading"
            className="font-display text-2xl lg:text-3xl font-bold text-primary-dark"
          >
            Our Leadership
          </h2>
          <Link
            href="/about/leadership"
            className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all leadership <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-2 gap-8',
            isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
            !isVisible && 'opacity-0',
          )}
        >
          {LEADERS.map((leader) => (
            <div
              key={leader.name}
              className="relative rounded-xl overflow-hidden min-h-[320px] sm:min-h-[360px]"
            >
              {/* Full-bleed background image */}
              <Image
                src={leader.photoUrl}
                alt={leader.name}
                fill
                className="object-cover object-[center_20%]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Gradient overlay for text readability */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, transparent 0%, transparent 30%, rgba(13,59,19,0.5) 50%, rgba(13,59,19,0.75) 65%, rgba(13,59,19,0.88) 80%, rgba(13,59,19,0.92) 100%)',
                }}
              />

              {/* Bio panel — positioned on the right */}
              <div className="absolute inset-0 flex items-center justify-end">
                <div className="w-full sm:w-[55%] p-6 lg:p-8 flex flex-col justify-center">
                  <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2 drop-shadow-sm">
                    {leader.title}
                  </p>
                  <h3 className="font-display text-xl lg:text-2xl font-bold text-white mb-3 drop-shadow-sm">
                    {leader.name}
                  </h3>
                  <p className="text-white/80 text-base leading-relaxed line-clamp-4 drop-shadow-sm">
                    {leader.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
