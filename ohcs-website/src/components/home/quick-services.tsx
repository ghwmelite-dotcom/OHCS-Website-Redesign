'use client';

import Link from 'next/link';
import { UserPlus, FileText, MessageSquareWarning, Download, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const services = [
  {
    icon: UserPlus,
    title: 'Recruitment',
    description: 'Apply for civil service positions across Ghana.',
    href: '/services/recruitment',
    accent: 'from-primary/20 to-primary/5',
  },
  {
    icon: FileText,
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data.',
    href: '/services/rti',
    accent: 'from-accent/20 to-accent/5',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaints & Feedback',
    description: 'Report issues or share feedback about civil service delivery.',
    href: '/services/complaints',
    accent: 'from-kente-red/15 to-kente-red/5',
  },
  {
    icon: Download,
    title: 'Publications & Downloads',
    description: 'Access reports, policies, forms, and circulars.',
    href: '/publications',
    accent: 'from-primary-dark/15 to-primary-dark/5',
  },
];

export function QuickServices() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} aria-labelledby="services-heading" className="py-20 lg:py-28">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header with gold accent line */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.2em]">
              Our Services
            </span>
            <span className="w-8 h-px bg-accent" aria-hidden="true" />
          </div>
          <h2
            id="services-heading"
            className="font-display text-4xl lg:text-5xl font-bold text-primary-dark mb-5"
          >
            How Can We Help You?
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Access key civil service resources and submit requests online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Link
              key={service.href}
              href={service.href}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl group/link"
            >
              <Card
                hoverable
                kenteAccent
                className={cn(
                  'h-full text-center p-10 relative',
                  isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                  !isVisible && 'opacity-0',
                )}
                style={
                  isVisible ? { animationDelay: `${index * 100}ms` } : undefined
                }
              >
                {/* Icon with gradient background */}
                <div className={cn(
                  'w-18 h-18 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-6',
                  'shadow-sm transition-transform duration-300 group-hover/link:scale-110',
                  service.accent,
                )}>
                  <service.icon className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>

                <h3 className="font-semibold text-xl mb-3 tracking-tight">{service.title}</h3>
                <p className="text-base text-text-muted leading-relaxed mb-5">{service.description}</p>

                {/* Arrow indicator */}
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover/link:opacity-100 transition-all duration-300 translate-y-1 group-hover/link:translate-y-0">
                  Learn more <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
