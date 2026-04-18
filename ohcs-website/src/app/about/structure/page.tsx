import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Sidebar } from '@/components/layout/sidebar';
import Link from 'next/link';
import { DIRECTORATES, UNITS } from '@/lib/constants';

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

export default function StructurePage() {
  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'About', href: '/about' }, { label: 'Organisational Structure' }]} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <h1 className="font-display text-4xl font-bold text-primary-dark mb-6">
            Organisational Structure
          </h1>

          <p className="text-lg text-text-muted leading-relaxed mb-10">
            OHCS comprises five line directorates and six support units,
            each responsible for specific aspects of civil service management and reform.
          </p>

          <h2 className="font-display text-2xl font-bold text-primary-dark mb-6">
            Line Directorates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {DIRECTORATES.map((dir) => (
              <Link
                key={dir.slug}
                href={`/directorates/${dir.slug}`}
                className="block bg-primary/5 rounded-xl p-5 hover:bg-primary/10 transition-colors border border-primary/10"
              >
                <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">
                  {dir.shortName}
                </span>
                <span className="font-semibold text-base text-primary-dark">{dir.name}</span>
              </Link>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold text-primary-dark mb-6">
            Units
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {UNITS.map((unit) => (
              <Link
                key={unit.slug}
                href={`/units/${unit.slug}`}
                className="block bg-accent/5 rounded-xl p-5 hover:bg-accent/10 transition-colors border border-accent/10"
              >
                <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">
                  {unit.shortName}
                </span>
                <span className="font-semibold text-base text-primary-dark">{unit.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Sidebar sections={ABOUT_SIDEBAR} />
        </div>
      </div>
    </div>
  );
}
