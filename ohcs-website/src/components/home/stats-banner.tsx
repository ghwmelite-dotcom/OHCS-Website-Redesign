'use client';

import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import { Users, Landmark, Building2, GraduationCap, Globe, Award } from 'lucide-react';

const STATS = [
  { icon: Users, number: '30,000+', label: 'Civil Servants', gradient: 'from-green-500 to-emerald-600' },
  { icon: Landmark, number: '5', label: 'Line Directorates', gradient: 'from-blue-500 to-indigo-600' },
  { icon: Building2, number: '6', label: 'Support Units', gradient: 'from-amber-500 to-yellow-600' },
  { icon: GraduationCap, number: '3+', label: 'Training Centres', gradient: 'from-purple-500 to-violet-600' },
  { icon: Globe, number: '16', label: 'Regions Served', gradient: 'from-teal-500 to-cyan-600' },
  { icon: Award, number: '30+', label: 'Years of Reform', gradient: 'from-rose-500 to-pink-600' },
];

export function StatsBanner() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="relative py-20 lg:py-24 bg-primary-dark overflow-hidden">
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
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(46,125,50,0.15) 0%, transparent 60%)' }}
      />

      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-accent tracking-wide">By the Numbers</span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white">
            Ghana&apos;s Civil Service at a{' '}
            <span className="relative inline-block">
              Glance
              <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/30 rounded-sm -z-10" />
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'group bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-7 text-center',
                'hover:bg-white/[0.1] hover:border-accent/20 hover:-translate-y-1 transition-all duration-300',
                isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                !isVisible && 'opacity-0',
              )}
              style={isVisible ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <div className={cn(
                'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-5 shadow-lg',
                'group-hover:scale-110 transition-transform duration-300',
                stat.gradient,
              )}>
                <stat.icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <p className="text-4xl font-bold text-white leading-none mb-2 font-display">{stat.number}</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.15em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
