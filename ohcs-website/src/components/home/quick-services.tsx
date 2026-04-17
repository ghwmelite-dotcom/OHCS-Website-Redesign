'use client';

import Link from 'next/link';
import { UserPlus, FileText, MessageSquareWarning, Download, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import { FloatingShapes } from '@/components/home/floating-shapes';

const services = [
  {
    icon: UserPlus,
    title: 'Recruitment',
    description: 'Apply for civil service positions across Ghana.',
    href: '/services/recruitment',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    border: 'border-green-100 hover:border-green-300',
  },
  {
    icon: FileText,
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data.',
    href: '/services/rti',
    gradient: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100 hover:border-amber-300',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaints & Feedback',
    description: 'Report issues or share feedback about civil service delivery.',
    href: '/services/complaints',
    gradient: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100 hover:border-rose-300',
  },
  {
    icon: Download,
    title: 'Publications & Downloads',
    description: 'Access reports, policies, forms, and circulars.',
    href: '/publications',
    gradient: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100 hover:border-sky-300',
  },
];

export function QuickServices() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      aria-labelledby="services-heading"
      className="relative py-24 lg:py-32 bg-white overflow-hidden"
    >
      <FloatingShapes />

      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-primary tracking-wide">
              Our Services
            </span>
          </div>
          <h2
            id="services-heading"
            className="font-display text-4xl lg:text-5xl font-bold text-primary-dark mb-5"
          >
            How Can We{' '}
            <span className="relative inline-block">
              Help You
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10"
              />
            </span>
            ?
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Access key civil service resources and submit requests online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.href}
              href={service.href}
              className={cn(
                'group/card block rounded-2xl border-2 p-7 text-left',
                'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                service.bg,
                service.border,
                isVisible && 'animate-[reveal_0.7s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                !isVisible && 'opacity-0',
              )}
              style={isVisible ? { animationDelay: `${index * 100}ms` } : undefined}
            >
              <div className="flex items-center justify-between mb-5">
                <div className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                  service.gradient,
                )}>
                  <service.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <ChevronRight
                  className="h-5 w-5 text-text-muted/30 group-hover/card:text-primary group-hover/card:translate-x-1 transition-all duration-200"
                  aria-hidden="true"
                />
              </div>

              <h3 className="font-semibold text-lg mb-2 tracking-tight">{service.title}</h3>
              <p className="text-base text-text-muted leading-relaxed">{service.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
