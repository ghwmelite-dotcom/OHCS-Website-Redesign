'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Newspaper, Calendar } from 'lucide-react';
import { NewsCard } from '@/components/news/news-card';
import { EventCard } from '@/components/events/event-card';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import { FloatingShapes } from '@/components/home/floating-shapes';
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
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden" style={{ backgroundColor: '#F0F7F1' }}>
      <FloatingShapes />

      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header — centered */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-primary tracking-wide">Stay Informed</span>
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-primary-dark mb-5">
            News &{' '}
            <span className="relative inline-block">
              Events
              <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
            </span>
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            The latest updates and upcoming activities from Ghana&apos;s Civil Service.
          </p>
        </div>

        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-5 gap-12',
            isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
            !isVisible && 'opacity-0',
          )}
        >
          {/* News — 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <Newspaper className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary-dark">Latest News</h3>
              </div>
              <Link
                href="/news"
                className="text-sm font-semibold text-primary flex items-center gap-1.5 hover:gap-2.5 transition-all px-4 py-2 rounded-full bg-primary/5 border border-primary/10 hover:border-primary/30"
              >
                View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-sm">
                  <Calendar className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary-dark">Upcoming Events</h3>
              </div>
              <Link
                href="/events"
                className="text-sm font-semibold text-primary flex items-center gap-1.5 hover:gap-2.5 transition-all px-4 py-2 rounded-full bg-primary/5 border border-primary/10 hover:border-primary/30"
              >
                View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
