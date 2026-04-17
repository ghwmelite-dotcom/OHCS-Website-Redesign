'use client';

import Link from 'next/link';
import { UserPlus, FileText, MessageSquareWarning, Download, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const services = [
  {
    icon: UserPlus,
    title: 'Recruitment',
    description: 'Apply for civil service positions across Ghana.',
    href: '/services/recruitment',
    gradient: 'from-emerald-500 to-green-700',
  },
  {
    icon: FileText,
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data.',
    href: '/services/rti',
    gradient: 'from-amber-500 to-yellow-700',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaints & Feedback',
    description: 'Report issues or share feedback about civil service delivery.',
    href: '/services/complaints',
    gradient: 'from-red-500 to-rose-700',
  },
  {
    icon: Download,
    title: 'Publications & Downloads',
    description: 'Access reports, policies, forms, and circulars.',
    href: '/publications',
    gradient: 'from-teal-500 to-cyan-700',
  },
];

export function QuickServices() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      aria-labelledby="services-heading"
      className="relative py-24 lg:py-32 bg-primary-dark overflow-hidden"
    >
      {/* Background pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: [
            'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 60px)',
            'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 60px)',
          ].join(', '),
        }}
      />

      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="w-10 h-px bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.2em]">
              Our Services
            </span>
            <span className="w-10 h-px bg-accent" aria-hidden="true" />
          </div>
          <h2
            id="services-heading"
            className="font-display text-4xl lg:text-5xl font-bold text-white mb-5"
          >
            How Can We Help You?
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Access key civil service resources and submit requests online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Link
              key={service.href}
              href={service.href}
              className={cn(
                'group/card block rounded-2xl p-8 lg:p-10 text-center',
                'bg-white/[0.07] backdrop-blur-sm border border-white/10',
                'hover:bg-white/[0.12] hover:border-accent/30 hover:-translate-y-2',
                'hover:shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_30px_rgba(212,160,23,0.08)]',
                'transition-all duration-400 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark',
                isVisible && 'animate-[reveal_0.7s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                !isVisible && 'opacity-0',
              )}
              style={isVisible ? { animationDelay: `${index * 120}ms` } : undefined}
            >
              {/* Icon with colored gradient */}
              <div className={cn(
                'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-6',
                'shadow-lg group-hover/card:scale-110 transition-transform duration-300',
                service.gradient,
              )}>
                <service.icon className="h-8 w-8 text-white" aria-hidden="true" />
              </div>

              <h3 className="font-semibold text-xl text-white mb-3 tracking-tight">
                {service.title}
              </h3>
              <p className="text-base text-white/50 leading-relaxed mb-6">
                {service.description}
              </p>

              {/* Arrow indicator */}
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
