import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/breadcrumb';
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
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Training Institutions', href: '/training' }, { label: institution.name }]} />
      <div className="mt-8 max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-primary-dark mb-3">{institution.name}</h1>
        <p className="text-base text-text-muted flex items-center gap-1.5 mb-8"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" />{institution.location}</p>
        <div className="space-y-6 text-lg text-text-muted leading-relaxed">
          <p>{institution.focusArea}</p>
        </div>
      </div>
    </div>
  );
}
