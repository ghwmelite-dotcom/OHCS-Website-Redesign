import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { DIRECTORATES } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DIRECTORATES.map((dir) => ({ slug: dir.slug }));
}

export default async function DirectorateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const directorate = DIRECTORATES.find((d) => d.slug === slug);

  if (!directorate) {
    notFound();
  }

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb
        items={[
          { label: 'Directorates', href: '/directorates' },
          { label: directorate.name },
        ]}
      />

      <div className="mt-8 max-w-3xl">
        <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-3">
          {directorate.shortName}
        </span>
        <h1 className="font-display text-4xl font-bold text-primary-dark mb-6">
          {directorate.name}
        </h1>

        <div className="space-y-6 text-lg text-text-muted leading-relaxed">
          <p>{directorate.description}</p>
        </div>
      </div>
    </div>
  );
}
