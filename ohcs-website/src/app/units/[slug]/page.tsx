import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { UNITS } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return UNITS.map((unit) => ({ slug: unit.slug }));
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const unit = UNITS.find((u) => u.slug === slug);

  if (!unit) {
    notFound();
  }

  return (
    <>
      <PageHero
        title={unit.name}
        breadcrumbs={[
          { label: 'Units', href: '/units' },
          { label: unit.name },
        ]}
        accent="gold"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-3xl">
          <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-3">
            {unit.shortName}
          </span>

          <div className="space-y-6 text-lg text-text-muted leading-relaxed">
            <p>{unit.description}</p>
          </div>
        </div>
      </div>
    </>
  );
}
