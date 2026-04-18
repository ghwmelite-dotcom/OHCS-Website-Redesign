import { PageHero } from '@/components/layout/page-hero';
import { Sidebar } from '@/components/layout/sidebar';
import { Building2, Target, Eye, Heart } from 'lucide-react';

const ABOUT_SIDEBAR = [
  {
    title: 'About OHCS',
    links: [
      { label: 'Overview', href: '/about' },
      { label: 'The Civil Service', href: '/about/civil-service' },
      { label: 'Our Leadership', href: '/about/leadership' },
      { label: 'Organisational Structure', href: '/about/structure' },
      { label: 'Our Partners', href: '/about/partners' },
    ],
  },
];

const CORE_VALUES = [
  {
    icon: Heart,
    value: 'Loyalty',
    desc: 'Faithful service to the nation and its people',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    icon: Target,
    value: 'Excellence',
    desc: 'Commitment to the highest standards of performance',
    gradient: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    icon: Building2,
    value: 'Service',
    desc: 'Dedication to public welfare and citizen satisfaction',
    gradient: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About OHCS"
        subtitle="The apex administrative body responsible for the management, development, and reform of Ghana's Civil Service."
        breadcrumbs={[{ label: 'About' }]}
        accent="green"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 space-y-16">
            {/* Intro */}
            <div>
              <p className="text-lg text-text-muted leading-relaxed mb-6">
                Established under the 1992 Constitution of the Republic of Ghana, OHCS
                serves as the principal advisory body to the Government on all matters
                relating to the Civil Service, including recruitment, training, promotions,
                discipline, and conditions of service.
              </p>
              <p className="text-lg text-text-muted leading-relaxed">
                The Office is headed by the Head of the Civil Service, who is appointed
                by the President in accordance with the advice of the Public Services
                Commission.
              </p>
            </div>

            {/* Mission & Vision — side by side cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative bg-primary-dark rounded-2xl p-8 overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 20px)',
                  }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-accent" aria-hidden="true" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-white">Our Mission</h2>
                  </div>
                  <p className="text-white/70 text-base leading-relaxed">
                    To lead the transformation and modernisation of Ghana&apos;s Civil Service
                    to deliver efficient, transparent, and accountable public services for all
                    citizens.
                  </p>
                </div>
              </div>

              <div className="relative bg-primary-dark rounded-2xl p-8 overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(-45deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 20px)',
                  }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-accent" aria-hidden="true" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-white">Our Vision</h2>
                  </div>
                  <p className="text-white/70 text-base leading-relaxed">
                    A world-class Civil Service that is professional, responsive, and
                    citizen-centred — driving national development and public trust.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Values */}
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-primary tracking-wide">Our Foundation</span>
                </div>
                <h2 className="font-display text-3xl font-bold text-primary-dark">Core Values</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {CORE_VALUES.map((item) => (
                  <div
                    key={item.value}
                    className={`${item.bg} rounded-2xl border-2 ${item.border} p-8 text-center`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-5 shadow-sm`}>
                      <item.icon className="h-7 w-7 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-primary-dark mb-3">{item.value}</h3>
                    <p className="text-base text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Sidebar sections={ABOUT_SIDEBAR} />
          </div>
        </div>
      </div>
    </>
  );
}
