import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.startDate);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GH', { month: 'short' });

  return (
    <Link
      href={`/events/${event.slug}`}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl block group/event"
    >
      <Card hoverable className="flex items-start gap-5 p-5">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex flex-col items-center justify-center flex-shrink-0 shadow-sm border border-accent/10 group-hover/event:border-accent/30 transition-colors duration-300">
          <span className="text-xs font-bold text-accent uppercase tracking-wide">{month}</span>
          <span className="text-2xl font-bold text-accent leading-none">{day}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2 group-hover/event:text-primary transition-colors duration-200">
            {event.title}
          </h3>
          {event.location && (
            <p className="text-sm text-text-muted flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-accent/60" aria-hidden="true" />
              {event.location}
            </p>
          )}
        </div>
        <ArrowUpRight
          className="h-5 w-5 text-text-muted/30 group-hover/event:text-accent shrink-0 mt-1 transition-all duration-200 group-hover/event:translate-x-0.5 group-hover/event:-translate-y-0.5"
          aria-hidden="true"
        />
      </Card>
    </Link>
  );
}
