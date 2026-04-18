import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';
import { MapPin } from 'lucide-react';
import { TRAINING_INSTITUTIONS } from '@/lib/constants';

export default function TrainingListingPage() {
  return (
    <>
      <PageHero
        title="Training Institutions"
        subtitle="Building capacity across the Civil Service through specialised training programmes and partnerships."
        breadcrumbs={[{ label: 'Training Institutions' }]}
        accent="warm"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_INSTITUTIONS.map((inst) => (
            <Link key={inst.slug} href={`/training/${inst.slug}`}
              className="group block bg-white rounded-2xl border-2 border-border/40 p-7 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <h2 className="font-semibold text-xl text-primary-dark mb-2 group-hover:text-primary transition-colors">{inst.name}</h2>
              <p className="text-sm text-text-muted flex items-center gap-1.5 mb-4"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" />{inst.location}</p>
              <p className="text-base text-text-muted leading-relaxed">{inst.focusArea}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
