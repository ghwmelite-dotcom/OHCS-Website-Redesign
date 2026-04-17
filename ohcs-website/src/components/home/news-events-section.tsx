'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { NewsCard } from '@/components/news/news-card';
import { EventCard } from '@/components/events/event-card';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import type { NewsArticle, Event } from '@/types';

const SAMPLE_NEWS: NewsArticle[] = [
  {
    id: 1,
    title: "Nigeria's Federal Civil Service Pays Courtesy Call on Ghana's Head of Civil Service",
    slug: 'nigeria-courtesy-call',
    excerpt: 'A delegation from Nigeria visited OHCS to discuss cross-border collaboration on civil service reforms and best practices.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-15T10:00:00Z',
    isPublished: true,
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'OHCS Launches 2026 Civil Service Training Programme for Senior Officers',
    slug: 'training-programme-2026',
    excerpt: 'The programme aims to equip 500 senior officers with modern leadership and digital governance skills.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-10T09:00:00Z',
    isPublished: true,
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
  },
  {
    id: 3,
    title: 'Head of Civil Service Addresses Staff on Public Sector Reforms Agenda',
    slug: 'reforms-address',
    excerpt: 'Dr. Evans Aggrey-Darkoh outlined key priorities for the civil service transformation roadmap.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-05T14:00:00Z',
    isPublished: true,
    createdAt: '2026-04-05T14:00:00Z',
    updatedAt: '2026-04-05T14:00:00Z',
  },
];

const SAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Civil Service Week 2026 Opening Ceremony',
    slug: 'cs-week-2026',
    description: '',
    location: 'Accra International Conference Centre',
    startDate: '2026-05-05T09:00:00Z',
    endDate: '2026-05-05T17:00:00Z',
    isPublished: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Digital Governance Workshop for Regional Directors',
    slug: 'digital-governance-workshop',
    description: '',
    location: 'GIMPA Campus, Accra',
    startDate: '2026-05-12T10:00:00Z',
    endDate: '2026-05-12T16:00:00Z',
    isPublished: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'Quarterly Civil Service Council Meeting',
    slug: 'council-meeting-q2',
    description: '',
    location: 'OHCS Headquarters, Accra',
    startDate: '2026-05-20T09:00:00Z',
    endDate: '2026-05-20T15:00:00Z',
    isPublished: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
];

export function NewsEventsSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 lg:py-32 bg-surface relative overflow-hidden">
      {/* Decorative background elements */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(212,160,23,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(27,94,32,0.04) 0%, transparent 50%)',
        }}
      />
      {/* Left accent bar */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-24 bottom-24 w-1 hidden lg:block"
        style={{
          background: 'linear-gradient(to bottom, transparent, #D4A017 30%, #1B5E20 70%, transparent)',
        }}
      />
      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-5 gap-14',
            isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
            !isVisible && 'opacity-0',
          )}
        >
          {/* News — 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-[0.2em] block mb-1">Stay Updated</span>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
                  Latest News
                </h2>
              </div>
              <Link
                href="/news"
                className="text-base text-primary font-medium flex items-center gap-1.5 hover:gap-2.5 transition-all group/viewall"
              >
                View all <ArrowRight className="h-5 w-5 group-hover/viewall:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-5">
              {SAMPLE_NEWS.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>

          {/* Events — 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-[0.2em] block mb-1">Mark Your Calendar</span>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
                  Upcoming Events
                </h2>
              </div>
              <Link
                href="/events"
                className="text-base text-primary font-medium flex items-center gap-1.5 hover:gap-2.5 transition-all group/viewall"
              >
                View all <ArrowRight className="h-5 w-5 group-hover/viewall:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-5">
              {SAMPLE_EVENTS.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
