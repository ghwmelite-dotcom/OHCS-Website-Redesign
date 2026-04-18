import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { DIRECTORATES } from '@/lib/constants';

export default function DirectoratesListingPage() {
  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Directorates' }]} />

      <h1 className="font-display text-4xl font-bold text-primary-dark mt-8 mb-4">
        Our Directorates
      </h1>
      <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-3xl">
        Eight specialised directorates working together to manage, reform, and modernise Ghana&apos;s Civil Service.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {DIRECTORATES.map((dir) => (
          <Link
            key={dir.slug}
            href={`/directorates/${dir.slug}`}
            className="group block bg-white rounded-2xl border-2 border-border/40 p-7 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-2">
              {dir.shortName}
            </span>
            <h2 className="font-semibold text-xl text-primary-dark mb-3 group-hover:text-primary transition-colors">
              {dir.name}
            </h2>
            <p className="text-base text-text-muted leading-relaxed">
              {dir.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
