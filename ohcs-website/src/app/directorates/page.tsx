import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { DIRECTORATES, UNITS } from '@/lib/constants';
import {
  Briefcase,
  Wallet,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  ChevronRight,
  Shield,
  Scale,
  Building2,
  Landmark,
  Package,
  Calculator,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const DIR_ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Wallet,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
};

const DIR_GRADIENT_MAP: Record<string, string> = {
  Briefcase: 'from-green-500 to-emerald-600',
  Wallet: 'from-blue-500 to-indigo-600',
  BarChart3: 'from-amber-500 to-orange-600',
  ClipboardCheck: 'from-rose-500 to-pink-600',
  GraduationCap: 'from-purple-500 to-violet-600',
};

const DIR_BORDER_MAP: Record<string, string> = {
  Briefcase: 'border-green-200 hover:border-green-400',
  Wallet: 'border-blue-200 hover:border-blue-400',
  BarChart3: 'border-amber-200 hover:border-amber-400',
  ClipboardCheck: 'border-rose-200 hover:border-rose-400',
  GraduationCap: 'border-purple-200 hover:border-purple-400',
};

const DIR_BG_MAP: Record<string, string> = {
  Briefcase: 'bg-green-50',
  Wallet: 'bg-blue-50',
  BarChart3: 'bg-amber-50',
  ClipboardCheck: 'bg-rose-50',
  GraduationCap: 'bg-purple-50',
};

const UNIT_ICONS: LucideIcon[] = [Shield, Scale, Building2, Landmark, Calculator, Package];
const UNIT_GRADIENTS = [
  'from-teal-500 to-cyan-600',
  'from-slate-500 to-gray-600',
  'from-emerald-500 to-green-600',
  'from-indigo-500 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-violet-500 to-purple-600',
];
const UNIT_BORDERS = [
  'border-teal-200 hover:border-teal-400',
  'border-slate-200 hover:border-slate-400',
  'border-emerald-200 hover:border-emerald-400',
  'border-indigo-200 hover:border-indigo-400',
  'border-orange-200 hover:border-orange-400',
  'border-violet-200 hover:border-violet-400',
];
const UNIT_BGS = [
  'bg-teal-50',
  'bg-slate-50',
  'bg-emerald-50',
  'bg-indigo-50',
  'bg-orange-50',
  'bg-violet-50',
];

export default function DirectoratesUnitsPage() {
  return (
    <>
      <PageHero
        title="Directorates & Units"
        subtitle="The operational backbone of Ghana's Civil Service — five line directorates and six support units working in concert."
        breadcrumbs={[{ label: 'Directorates & Units' }]}
        accent="green"
      >
        {/* Quick stats in hero */}
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-5 py-2">
            <span className="text-2xl font-bold text-white">5</span>
            <span className="text-sm text-white/50">Line Directorates</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-5 py-2">
            <span className="text-2xl font-bold text-accent">6</span>
            <span className="text-sm text-white/50">Support Units</span>
          </div>
        </div>
      </PageHero>

      {/* ── Line Directorates Section ── */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">Core Operations</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-4">
              Line{' '}
              <span className="relative inline-block">
                Directorates
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Five specialised directorates driving the day-to-day management, reform, and modernisation of Ghana&apos;s Civil Service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIRECTORATES.map((dir) => {
              const Icon = DIR_ICON_MAP[dir.icon];
              const gradient = DIR_GRADIENT_MAP[dir.icon] ?? 'from-gray-500 to-gray-600';
              const border = DIR_BORDER_MAP[dir.icon] ?? 'border-gray-200';
              const bg = DIR_BG_MAP[dir.icon] ?? 'bg-gray-50';
              return (
                <Link
                  key={dir.slug}
                  href={`/directorates/${dir.slug}`}
                  className={`group block ${bg} rounded-2xl border-2 ${border} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                      {Icon && <Icon className="h-6 w-6 text-white" aria-hidden="true" />}
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted/30 group-hover:text-primary group-hover:translate-x-1 transition-all" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">
                    {dir.shortName}
                  </span>
                  <h3 className="font-semibold text-lg text-primary-dark mb-2 group-hover:text-primary transition-colors">
                    {dir.name}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed line-clamp-3">
                    {dir.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── Support Units Section ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/15 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-sm font-semibold text-accent tracking-wide">Essential Support</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-4">
              Support{' '}
              <span className="relative inline-block">
                Units
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Six specialised units providing reform coordination, audit, secretarial, estate, accounts, and stores services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {UNITS.map((unit, i) => {
              const Icon = UNIT_ICONS[i] ?? Building2;
              const gradient = UNIT_GRADIENTS[i] ?? 'from-gray-500 to-gray-600';
              const border = UNIT_BORDERS[i] ?? 'border-gray-200';
              const bg = UNIT_BGS[i] ?? 'bg-gray-50';
              return (
                <Link
                  key={unit.slug}
                  href={`/units/${unit.slug}`}
                  className={`group block ${bg} rounded-2xl border-2 ${border} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted/30 group-hover:text-accent group-hover:translate-x-1 transition-all" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">
                    {unit.shortName}
                  </span>
                  <h3 className="font-semibold text-lg text-primary-dark mb-2 group-hover:text-primary transition-colors">
                    {unit.name}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed line-clamp-3">
                    {unit.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
