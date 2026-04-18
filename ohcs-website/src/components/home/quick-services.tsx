'use client';

import Link from 'next/link';
import { UserPlus, FileText, MessageSquareWarning, Download, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import { FloatingShapes } from '@/components/home/floating-shapes';

const services = [
  {
    icon: UserPlus,
    title: 'Recruitment',
    description: 'Apply for civil service positions across Ghana.',
    href: '/services/recruitment',
    gradient: 'from-emerald-400 to-green-500',
    bg: 'bg-green-50/70',
    border: 'border-green-200 hover:border-green-400',
    number: '01',
  },
  {
    icon: FileText,
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data.',
    href: '/services/rti',
    gradient: 'from-amber-400 to-yellow-500',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200 hover:border-amber-400',
    number: '02',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaints & Feedback',
    description: 'Report issues or share feedback about civil service delivery.',
    href: '/services/complaints',
    gradient: 'from-rose-400 to-red-500',
    bg: 'bg-rose-50/70',
    border: 'border-rose-200 hover:border-rose-400',
    number: '03',
  },
  {
    icon: Download,
    title: 'Publications & Downloads',
    description: 'Access reports, policies, forms, and circulars.',
    href: '/publications',
    gradient: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50/70',
    border: 'border-sky-200 hover:border-sky-400',
    number: '04',
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
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-primary tracking-wide">Our Services</span>
          </div>
          <h2
            id="services-heading"
            className="font-display text-4xl lg:text-5xl font-bold text-primary-dark mb-5"
          >
            How Can We{' '}
            <span className="relative inline-block">
              Help You
              <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
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
                'group/card block relative rounded-2xl border-2 p-8',
                'hover:-translate-y-2 hover:shadow-xl',
                'transition-all duration-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                service.bg,
                service.border,
                isVisible && 'animate-[reveal_0.7s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                !isVisible && 'opacity-0',
              )}
              style={isVisible ? { animationDelay: `${index * 120}ms` } : undefined}
            >
              {/* Step number watermark */}
              <span className="absolute top-4 right-5 text-5xl font-bold text-primary-dark/[0.04] font-display">{service.number}</span>

              <div className={cn(
                'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg',
                'group-hover/card:scale-110 transition-transform duration-300',
                service.gradient,
              )}>
                <service.icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>

              <h3 className="font-semibold text-xl text-primary-dark mb-3 tracking-tight group-hover/card:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-base text-text-muted leading-relaxed mb-6">{service.description}</p>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
