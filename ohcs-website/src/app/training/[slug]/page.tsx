import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { MapPin } from 'lucide-react';
import { TRAINING_INSTITUTIONS } from '@/lib/constants';

interface PageProps { params: Promise<{ slug: string }>; }

export function generateStaticParams() {
  return TRAINING_INSTITUTIONS.map((inst) => ({ slug: inst.slug }));
}

export default async function TrainingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const institution = TRAINING_INSTITUTIONS.find((i) => i.slug === slug);
  if (!institution) notFound();

  return (
    <>
      <PageHero
        title={institution.name}
        breadcrumbs={[{ label: 'Training Institutions', href: '/training' }, { label: institution.name }]}
        accent="warm"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-base text-text-muted flex items-center gap-1.5 mb-8"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" />{institution.location}</p>
          <div className="space-y-6 text-lg text-text-muted leading-relaxed">
            <p>{institution.focusArea}</p>
          </div>
        </div>
      </div>
    </>
  );
}
