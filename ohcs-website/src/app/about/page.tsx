import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import Link from 'next/link';
import {
  Building2,
  Target,
  Eye,
  Heart,
  Users,
  Landmark,
  GraduationCap,
  Award,
  ArrowRight,
} from 'lucide-react';

const STATS = [
  { number: '30,000+', label: 'Civil Servants', icon: Users },
  { number: '5', label: 'Line Directorates', icon: Landmark },
  { number: '6', label: 'Support Units', icon: Building2 },
  { number: '3+', label: 'Training & Departments', icon: GraduationCap },
];

const CORE_VALUES = [
  {
    icon: Heart,
    value: 'Loyalty',
    desc: 'Faithful and unwavering service to the nation, its constitution, and its people.',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    border: 'border-green-200 hover:border-green-400',
  },
  {
    icon: Award,
    value: 'Excellence',
    desc: 'A relentless commitment to the highest standards of professionalism and performance.',
    gradient: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200 hover:border-amber-400',
  },
  {
    icon: Building2,
    value: 'Service',
    desc: 'Wholehearted dedication to public welfare, citizen satisfaction, and national development.',
    gradient: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200 hover:border-sky-400',
  },
];

const QUICK_LINKS = [
  { label: 'Our Leadership', href: '/about/leadership', desc: 'Meet the Head of Service and senior leaders', icon: Users },
  { label: 'Organisational Structure', href: '/about/structure', desc: 'Directorates, Units, and Training Institutions', icon: Landmark },
  { label: 'The Civil Service', href: '/about/civil-service', desc: 'History, mandate, and constitutional framework', icon: Building2 },
  { label: 'Our Partners', href: '/about/partners', desc: 'National and international collaborators', icon: Target },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About OHCS"
        subtitle="The apex administrative body responsible for the management, development, and reform of Ghana's Civil Service."
        breadcrumbs={[{ label: 'About' }]}
        accent="green"
      >
        {/* Stats row inside hero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-2xl p-5 text-center"
            >
              <stat.icon className="h-5 w-5 text-accent mx-auto mb-2" aria-hidden="true" />
              <p className="text-2xl lg:text-3xl font-bold text-white leading-none mb-1">{stat.number}</p>
              <p className="text-xs text-white/50 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      {/* ── Section: Intro ── */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">Who We Are</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-6">
              Leading Ghana&apos;s{' '}
              <span className="relative inline-block">
                Civil Service
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-lg text-text-muted leading-relaxed mb-6">
              Established under the 1992 Constitution of the Republic of Ghana, the Office of the Head of the
              Civil Service serves as the principal advisory body to the Government on all matters
              relating to the Civil Service — including recruitment, training, promotions,
              discipline, and conditions of service.
            </p>
            <p className="text-lg text-text-muted leading-relaxed">
              The Office is headed by the Head of the Civil Service, who is appointed
              by the President in accordance with the advice of the Public Services Commission.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section: Mission & Vision — full width dark ── */}
      <section className="relative py-20 lg:py-24 bg-primary-dark overflow-hidden">
        {/* Kente texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
              'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(46,125,50,0.2) 0%, transparent 60%)' }}
        />

        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-sm font-semibold text-accent tracking-wide">Our Purpose</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white">
              Mission &{' '}
              <span className="relative inline-block">
                Vision
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/30 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-10 hover:bg-white/[0.1] transition-colors duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
                <Eye className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-4">Our Mission</h3>
              <p className="text-lg text-white/60 leading-relaxed">
                To lead the transformation and modernisation of Ghana&apos;s Civil Service
                to deliver efficient, transparent, and accountable public services for all
                citizens.
              </p>
            </div>

            <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-10 hover:bg-white/[0.1] transition-colors duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mb-6 shadow-lg">
                <Target className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-4">Our Vision</h3>
              <p className="text-lg text-white/60 leading-relaxed">
                A world-class Civil Service that is professional, responsive, and
                citizen-centred — driving national development and public trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Core Values — warm cream bg ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/15 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-sm font-semibold text-accent tracking-wide">Our Foundation</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
              Core{' '}
              <span className="relative inline-block">
                Values
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {CORE_VALUES.map((item) => (
              <div
                key={item.value}
                className={`${item.bg} rounded-2xl border-2 ${item.border} p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <item.icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary-dark mb-4">{item.value}</h3>
                <p className="text-base text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section: Explore More — light green bg ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#F0F7F1' }}>
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">Learn More</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
              Explore{' '}
              <span className="relative inline-block">
                OHCS
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-5 bg-white rounded-2xl border-2 border-border/40 p-7 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors">
                  <link.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-primary-dark mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                    {link.label}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
                  </h3>
                  <p className="text-base text-text-muted leading-relaxed">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
