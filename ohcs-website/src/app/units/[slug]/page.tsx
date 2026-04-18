import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/breadcrumb';
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
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb
        items={[
          { label: 'Units', href: '/units' },
          { label: unit.name },
        ]}
      />

      <div className="mt-8 max-w-3xl">
        <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-3">
          {unit.shortName}
        </span>
        <h1 className="font-display text-4xl font-bold text-primary-dark mb-6">
          {unit.name}
        </h1>

        <div className="space-y-6 text-lg text-text-muted leading-relaxed">
          <p>{unit.description}</p>
        </div>
      </div>
    </div>
  );
}
