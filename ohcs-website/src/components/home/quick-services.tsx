'use client';

import Link from 'next/link';
import { UserPlus, FileText, MessageSquareWarning, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const services = [
  {
    icon: UserPlus,
    title: 'Recruitment',
    description: 'Apply for civil service positions across Ghana.',
    href: '/services/recruitment',
  },
  {
    icon: FileText,
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data.',
    href: '/services/rti',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaints & Feedback',
    description: 'Report issues or share feedback about civil service delivery.',
    href: '/services/complaints',
  },
  {
    icon: Download,
    title: 'Publications & Downloads',
    description: 'Access reports, policies, forms, and circulars.',
    href: '/publications',
  },
];

export function QuickServices() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} aria-labelledby="services-heading" className="py-16 lg:py-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="services-heading"
            className="font-display text-3xl font-bold text-primary-dark mb-3"
          >
            How Can We Help You?
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Access key civil service resources and submit requests online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.href}
              href={service.href}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
            >
              <Card
                hoverable
                kenteAccent
                className={cn(
                  'h-full text-center p-8',
                  isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                  !isVisible && 'opacity-0',
                )}
                style={
                  isVisible ? { animationDelay: `${index * 80}ms` } : undefined
                }
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <service.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-text-muted">{service.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
