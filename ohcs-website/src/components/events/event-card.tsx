import Link from 'next/link';
import { MapPin } from 'lucide-react';
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
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg block"
    >
      <Card hoverable className="flex items-start gap-4 p-4">
        <div className="w-14 h-14 rounded-lg bg-accent/10 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-accent uppercase">{month}</span>
          <span className="text-lg font-bold text-accent leading-none">{day}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">
            {event.title}
          </h3>
          {event.location && (
            <p className="text-xs text-text-muted flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {event.location}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
