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
    glow: 'group-hover/card:shadow-[0_0_40px_rgba(16,185,129,0.15)]',
    number: '01',
  },
  {
    icon: FileText,
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data.',
    href: '/services/rti',
    gradient: 'from-amber-400 to-yellow-500',
    glow: 'group-hover/card:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    number: '02',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaints & Feedback',
    description: 'Report issues or share feedback about civil service delivery.',
    href: '/services/complaints',
    gradient: 'from-rose-400 to-red-500',
    glow: 'group-hover/card:shadow-[0_0_40px_rgba(244,63,94,0.15)]',
    number: '03',
  },
  {
    icon: Download,
    title: 'Publications & Downloads',
    description: 'Access reports, policies, forms, and circulars.',
    href: '/publications',
    gradient: 'from-sky-400 to-blue-500',
    glow: 'group-hover/card:shadow-[0_0_40px_rgba(56,189,248,0.15)]',
    number: '04',
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
      {/* Kente mesh */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: [
            'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px)',
            'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(212,160,23,0.08) 0%, transparent 50%)' }}
      />

      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-accent tracking-wide">Our Services</span>
          </div>
          <h2
            id="services-heading"
            className="font-display text-4xl lg:text-5xl font-bold text-white mb-5"
          >
            How Can We{' '}
            <span className="relative inline-block">
              Help You
              <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/30 rounded-sm -z-10" />
            </span>
            ?
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Access key civil service resources and submit requests online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.href}
              href={service.href}
              className={cn(
                'group/card block relative bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/10 p-8',
                'hover:bg-white/[0.1] hover:border-white/20 hover:-translate-y-2',
                'transition-all duration-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark',
                service.glow,
                isVisible && 'animate-[reveal_0.7s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                !isVisible && 'opacity-0',
              )}
              style={isVisible ? { animationDelay: `${index * 120}ms` } : undefined}
            >
              {/* Step number watermark */}
              <span className="absolute top-4 right-5 text-5xl font-bold text-white/[0.04] font-display">{service.number}</span>

              <div className={cn(
                'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg',
                'group-hover/card:scale-110 transition-transform duration-300',
                service.gradient,
              )}>
                <service.icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>

              <h3 className="font-semibold text-xl text-white mb-3 tracking-tight group-hover/card:text-accent transition-colors">
                {service.title}
              </h3>
              <p className="text-base text-white/40 leading-relaxed mb-6">{service.description}</p>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
